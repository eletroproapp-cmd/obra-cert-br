import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import { Resend } from "https://esm.sh/resend@4.0.1";
import jsPDF from "https://esm.sh/jspdf@2.5.2";
import autoTable from "https://esm.sh/jspdf-autotable@3.8.3";
import QRCode from "https://esm.sh/qrcode@1.5.4";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const sanitize = (input: string): string => {
  return input.replace(/<[^>]*>/g, '').trim();
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FaturaEmailRequest {
  faturaId: string;
  clienteEmail: string;
  customSubject?: string;
  customBody?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Autenticação necessária" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { data: rateLimitOk, error: rateLimitError } = await supabaseClient
      .rpc('check_rate_limit', {
        _user_id: user.id,
        _function_name: 'enviar-fatura',
        _max_requests: 10,
        _window_minutes: 60
      });

    if (rateLimitError || !rateLimitOk) {
      console.log("Rate limit exceeded for user:", user.id);
      return new Response(
        JSON.stringify({ error: "Limite de requisições excedido. Tente novamente mais tarde." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { faturaId, clienteEmail, customSubject, customBody }: FaturaEmailRequest = await req.json();

    if (!faturaId || typeof faturaId !== 'string' || faturaId.length !== 36) {
      return new Response(
        JSON.stringify({ error: "ID de fatura inválido" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!clienteEmail || !emailRegex.test(clienteEmail)) {
      return new Response(
        JSON.stringify({ error: "Email inválido" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { data: fatura, error: faturaError } = await supabaseClient
      .from("faturas")
      .select(`
        *,
        clientes:cliente_id (nome, email, telefone, endereco, cidade, estado, cep)
      `)
      .eq("id", faturaId)
      .eq("user_id", user.id)
      .single();

    if (faturaError || !fatura) {
      return new Response(
        JSON.stringify({ error: "Fatura não encontrada ou acesso negado" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Buscar itens da fatura
    const { data: items, error: itemsError } = await supabaseClient
      .from("fatura_items")
      .select("*")
      .eq("fatura_id", faturaId)
      .order("ordem");

    if (itemsError) {
      console.error("Erro ao buscar itens:", itemsError);
      return new Response(
        JSON.stringify({ error: "Erro ao buscar itens da fatura" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Buscar empresa info completa
    const { data: empresa } = await supabaseClient
      .from("empresas")
      .select("*")
      .eq("user_id", user.id)
      .single();

    let assunto = customSubject || `Sua Fatura ${sanitize(fatura.numero)}`;
    let corpoHtml = "";

    if (customBody) {
      // Usar corpo personalizado do usuário (converter texto simples para HTML preservando quebras de linha)
      corpoHtml = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="font-size: 14px; color: #333; line-height: 1.6; white-space: pre-wrap;">${sanitize(customBody)}</div>
          </div>
        </div>
      `;
    } else {
      // Buscar template personalizado
      const { data: template } = await supabaseClient
        .from("email_templates")
        .select("assunto, corpo_html")
        .eq("user_id", user.id)
        .eq("tipo", "nova_fatura")
        .eq("ativo", true)
        .single();

      if (template) {
        // Usar template personalizado
        if (!customSubject) {
          assunto = template.assunto
            .replace(/{{numero}}/g, sanitize(fatura.numero))
            .replace(/{{cliente_nome}}/g, sanitize(fatura.clientes.nome));
        }

        corpoHtml = template.corpo_html
          .replace(/{{numero}}/g, sanitize(fatura.numero))
          .replace(/{{cliente_nome}}/g, sanitize(fatura.clientes.nome))
          .replace(/{{titulo}}/g, sanitize(fatura.titulo || ''))
          .replace(/{{status}}/g, sanitize(fatura.status || ''))
          .replace(/{{data_vencimento}}/g, new Date(fatura.data_vencimento).toLocaleDateString('pt-BR'))
          .replace(/{{forma_pagamento}}/g, sanitize(fatura.forma_pagamento || ''))
          .replace(/{{valor_total}}/g, `R$ ${Number(fatura.valor_total || 0).toFixed(2)}`);
      } else {
      // Template padrão profissional
      const diasVencimento = Math.ceil((new Date(fatura.data_vencimento).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      const statusVencimento = diasVencimento < 0 ? 'VENCIDA' : diasVencimento === 0 ? 'Vence HOJE' : `Vence em ${diasVencimento} dias`;
      
      corpoHtml = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Prezado(a) <strong>${sanitize(fatura.clientes.nome)}</strong>,</p>
            
            <p style="font-size: 14px; color: #555; line-height: 1.6; margin-bottom: 15px;">
              Segue em anexo a fatura <strong>${sanitize(fatura.numero)}</strong> referente aos serviços prestados.
            </p>
            
            <div style="background-color: #f5f5f5; border-left: 4px solid #6366f1; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 5px 0; font-size: 14px; color: #333;"><strong>Fatura:</strong> ${sanitize(fatura.numero)}</p>
              <p style="margin: 5px 0; font-size: 14px; color: #333;"><strong>Valor:</strong> R$ ${Number(fatura.valor_total || 0).toFixed(2)}</p>
              <p style="margin: 5px 0; font-size: 14px; color: #333;"><strong>Vencimento:</strong> ${new Date(fatura.data_vencimento).toLocaleDateString('pt-BR')} (${statusVencimento})</p>
              ${fatura.forma_pagamento ? `<p style="margin: 5px 0; font-size: 14px; color: #333;"><strong>Forma de Pagamento:</strong> ${sanitize(fatura.forma_pagamento)}</p>` : ''}
            </div>
            
            ${diasVencimento <= 3 && diasVencimento >= 0 ? `
            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; font-size: 14px; color: #856404;"><strong>⚠️ Atenção:</strong> Prazo de vencimento próximo!</p>
            </div>
            ` : ''}
            
            <p style="font-size: 14px; color: #555; line-height: 1.6; margin-bottom: 15px;">
              Estamos à disposição para esclarecimentos adicionais.
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
              <p style="font-size: 14px; color: #333; margin-bottom: 5px;">Atenciosamente,</p>
              <p style="font-size: 14px; color: #6366f1; font-weight: 600; margin: 0;">${sanitize(empresa?.nome_fantasia || 'Nossa Empresa')}</p>
            </div>
          </div>
          
          <p style="font-size: 11px; color: #999; text-align: center; margin-top: 20px;">
            Este é um email automático. Por favor, não responda diretamente a esta mensagem.
          </p>
        </div>
      `;
      }
    }

    // Determinar email do remetente
    let fromEmail: string;
    const empresaEmail = empresa?.email || '';
    const domain = empresaEmail.split('@')[1]?.toLowerCase() || '';
    const publicDomains = new Set([
      'gmail.com','hotmail.com','outlook.com','yahoo.com','live.com','icloud.com',
      'bol.com.br','uol.com.br','terra.com.br','yahoo.com.br','hotmail.com.br','outlook.com.br','gmail.com.br'
    ]);
    const nomeRemetente = sanitize(empresa?.nome_fantasia || 'Sua Empresa');
    if (empresaEmail && !publicDomains.has(domain)) {
      fromEmail = `${nomeRemetente} <${empresaEmail}>`;
    } else {
      fromEmail = `${nomeRemetente} <no-reply@send.eletroproapp.com>`;
      if (empresaEmail) console.log('Domínio de email não verificado/público. Usando remetente padrão.');
    }

    // === GERAR PDF ===
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 99, g: 102, b: 241 };
    };
    
    const primaryColor = empresa?.cor_primaria || '#6366F1';
    const secondaryColor = empresa?.cor_secundaria || '#E5E7EB';
    const borderColor = empresa?.cor_borda_secoes || primaryColor;
    const rgbPrimary = hexToRgb(primaryColor);
    const rgbSecondary = hexToRgb(secondaryColor);
    const rgbBorder = hexToRgb(borderColor);
    
    const lightSecondaryR = Math.min(255, rgbSecondary.r + (255 - rgbSecondary.r) * 0.85);
    const lightSecondaryG = Math.min(255, rgbSecondary.g + (255 - rgbSecondary.g) * 0.85);
    const lightSecondaryB = Math.min(255, rgbSecondary.b + (255 - rgbSecondary.b) * 0.85);
    
    let yPos = 15;
    
    // === CABEÇALHO ===
    doc.setDrawColor(rgbBorder.r, rgbBorder.g, rgbBorder.b);
    doc.setLineWidth(1.2);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 6;
    
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(rgbPrimary.r, rgbPrimary.g, rgbPrimary.b);
    doc.text('FATURA', pageWidth / 2, yPos + 2, { align: 'center' });
    yPos += 10;
    
    // Informações da empresa (esquerda)
    const leftStart = margin;
    let leftY = yPos;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(empresa?.nome_fantasia || 'Empresa', leftStart, leftY);
    leftY += 5;
    
    if (empresa?.razao_social && empresa.tipo_pessoa === 'juridica') {
      doc.setFontSize(8);
      doc.setTextColor(90, 90, 90);
      doc.text(empresa.razao_social, leftStart, leftY);
      leftY += 4;
    }
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    if (empresa?.endereco) { doc.text(empresa.endereco, leftStart, leftY); leftY += 3.5; }
    if (empresa?.cep || empresa?.cidade || empresa?.estado) {
      let addr = '';
      if (empresa.cep) addr += empresa.cep + ' ';
      if (empresa.cidade) addr += empresa.cidade;
      if (empresa.estado) addr += ' - ' + empresa.estado;
      doc.text(addr, leftStart, leftY);
      leftY += 3.5;
    }
    if (empresa?.telefone) { doc.text('Tel: ' + empresa.telefone, leftStart, leftY); leftY += 3.5; }
    if (empresa?.email) { doc.text('E-mail: ' + empresa.email, leftStart, leftY); leftY += 3.5; }
    if (empresa?.cnpj) { 
      const label = empresa.tipo_pessoa === 'fisica' ? 'CPF' : 'CNPJ'; 
      doc.text(label + ': ' + empresa.cnpj, leftStart, leftY); 
      leftY += 3.5; 
    }
    
    // Informações da fatura (direita)
    const rightEnd = pageWidth - margin;
    let rightY = yPos;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('nº ' + fatura.numero, rightEnd, rightY, { align: 'right' });
    rightY += 7;
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text('Emissão:', rightEnd, rightY, { align: 'right' });
    rightY += 3.5;
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(fatura.data_emissao).toLocaleDateString('pt-BR'), rightEnd, rightY, { align: 'right' });
    rightY += 4.5;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Vencimento:', rightEnd, rightY, { align: 'right' });
    rightY += 3.5;
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(fatura.data_vencimento).toLocaleDateString('pt-BR'), rightEnd, rightY, { align: 'right' });
    rightY += 4.5;
    
    if (fatura.forma_pagamento) {
      doc.setFont('helvetica', 'bold');
      doc.text('Pagamento:', rightEnd, rightY, { align: 'right' });
      rightY += 3.5;
      doc.setFont('helvetica', 'normal');
      doc.text(fatura.forma_pagamento, rightEnd, rightY, { align: 'right' });
    }
    
    yPos = Math.max(leftY, rightY) + 8;
    
    doc.setDrawColor(rgbBorder.r, rgbBorder.g, rgbBorder.b);
    doc.setLineWidth(1.2);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;
    
    // === CLIENTE ===
    const clientBoxHeight = 26;
    doc.setFillColor(lightSecondaryR, lightSecondaryG, lightSecondaryB);
    doc.setDrawColor(rgbBorder.r, rgbBorder.g, rgbBorder.b);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, clientBoxHeight, 3, 3, 'FD');
    
    yPos += 5;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text('CLIENTE', margin + 4, yPos);
    yPos += 5;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(fatura.clientes.nome, margin + 4, yPos);
    yPos += 5;
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(90, 90, 90);
    if (fatura.clientes.endereco) {
      doc.text(fatura.clientes.endereco, margin + 4, yPos);
      yPos += 3.5;
    }
    if (fatura.clientes.cep || fatura.clientes.cidade || fatura.clientes.estado) {
      let clientAddr = '';
      if (fatura.clientes.cep) clientAddr += fatura.clientes.cep + ' ';
      if (fatura.clientes.cidade) clientAddr += fatura.clientes.cidade;
      if (fatura.clientes.estado) clientAddr += ' - ' + fatura.clientes.estado;
      doc.text(clientAddr, margin + 4, yPos);
    }
    
    yPos += clientBoxHeight - 13 + 8;
    
    // === TÍTULO E DESCRIÇÃO ===
    if (fatura.titulo) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(fatura.titulo, margin, yPos);
      yPos += 5;
      
      if (fatura.descricao) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(90, 90, 90);
        const splitDesc = doc.splitTextToSize(fatura.descricao, pageWidth - 2 * margin);
        doc.text(splitDesc, margin, yPos);
        yPos += splitDesc.length * 3.5 + 5;
      } else {
        yPos += 3;
      }
    }
    
    // === TABELA DE ITENS ===
    const tableData = (items || []).map((item: any) => [
      item.descricao,
      item.quantidade.toString(),
      item.unidade,
      'R$ ' + item.valor_unitario.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      'R$ ' + item.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Descrição', 'Qtd.', 'Unidade', 'Preço Un.', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [rgbPrimary.r, rgbPrimary.g, rgbPrimary.b],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [50, 50, 50]
      },
      columnStyles: {
        0: { cellWidth: 'auto', halign: 'left' },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' }
      },
      margin: { left: margin, right: margin }
    });

    yPos = (doc as any).lastAutoTable.finalY + 5;

    // === TOTAL ===
    const totalBoxWidth = 60;
    const totalBoxHeight = 10;
    const totalBoxX = pageWidth - margin - totalBoxWidth;
    doc.setFillColor(rgbPrimary.r, rgbPrimary.g, rgbPrimary.b);
    doc.roundedRect(totalBoxX, yPos, totalBoxWidth, totalBoxHeight, 2, 2, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('TOTAL:', totalBoxX + 4, yPos + 6.5);
    const valorTotal = 'R$ ' + Number(fatura.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    doc.text(valorTotal, totalBoxX + totalBoxWidth - 4, yPos + 6.5, { align: 'right' });
    
    yPos += totalBoxHeight + 8;
    
    // === OBSERVAÇÕES ===
    if (fatura.observacoes) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Observações:', margin, yPos);
      yPos += 5;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(90, 90, 90);
      const splitObs = doc.splitTextToSize(fatura.observacoes, pageWidth - 2 * margin);
      doc.text(splitObs, margin, yPos);
      yPos += splitObs.length * 3.5 + 8;
    }
    
    // === QR CODE PIX (EMVCo) ===
    if (empresa?.chave_pix) {
      try {
        // Helpers TLV + CRC16
        const pad = (n: number) => (n < 10 ? '0' + n : String(n));
        const tlv = (id: string, value: string) => id + pad(value.length) + value;
        const crc16 = (payload: string) => {
          let crc = 0xffff;
          for (let i = 0; i < payload.length; i++) {
            crc ^= payload.charCodeAt(i) << 8;
            for (let j = 0; j < 8; j++) {
              if ((crc & 0x8000) !== 0) crc = (crc << 1) ^ 0x1021;
              else crc <<= 1;
              crc &= 0xffff;
            }
          }
          return (crc >>> 0).toString(16).toUpperCase().padStart(4, '0');
        };
        
        const gui = tlv('00', 'br.gov.bcb.pix');
        const kvChave = tlv('01', empresa.chave_pix);
        const kvDesc = tlv('02', `Fatura ${fatura.numero}`.substring(0,50));
        const mai = tlv('26', gui + kvChave + kvDesc);
        const payload = (() => {
          const pf = tlv('00', '01');
          const method = tlv('01', '11');
          const mcc = tlv('52', '0000');
          const curr = tlv('53', '986');
          const amount = fatura.valor_total ? tlv('54', Number(fatura.valor_total).toFixed(2)) : '';
          const country = tlv('58', 'BR');
          const name = tlv('59', (empresa?.nome_fantasia || 'RECEBEDOR').substring(0,25));
          const city = tlv('60', (empresa?.cidade || 'BRASIL').substring(0,15));
          const additional = tlv('62', tlv('05', (fatura.numero || '***').toString().substring(0,25)));
          let withoutCRC = pf + method + mai + mcc + curr + amount + country + name + city + additional + '6304';
          const crc = crc16(withoutCRC);
          return withoutCRC + crc;
        })();
        
        const qrCodeDataUrl = await QRCode.toDataURL(payload, { width: 140, margin: 1, color: { dark: '#000000', light: '#FFFFFF' }});
        
        const qrSize = 40;
        const qrX = pageWidth - margin - qrSize;
        const qrY = yPos;
        
        // Título
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('Pague com PIX', qrX, qrY - 2);
        
        // QR
        doc.addImage(qrCodeDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
        
        // Copia e Cola ao lado
        const copyX = margin;
        const copyW = pageWidth - 2 * margin - qrSize - 10;
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(90, 90, 90);
        const copyLines = doc.splitTextToSize(payload, copyW);
        doc.text(copyLines, copyX, qrY + 6);
        
        yPos = Math.max(yPos + qrSize + 5, (qrY + copyLines.length * 3.5) + 8);
      } catch (error) {
        console.error('Erro ao gerar QR Code PIX:', error);
      }
    }
    
    // === RODAPÉ ===
    const footerY = doc.internal.pageSize.getHeight() - 15;
    doc.setDrawColor(rgbBorder.r, rgbBorder.g, rgbBorder.b);
    doc.setLineWidth(0.5);
    doc.line(margin, footerY, pageWidth - margin, footerY);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text(empresa?.nome_fantasia || 'EletroPro', pageWidth / 2, footerY + 4, { align: 'center' });
    if (empresa?.website) {
      doc.text(empresa.website, pageWidth / 2, footerY + 7.5, { align: 'center' });
    }
    
    // Converter PDF para base64
    const pdfOutput = doc.output('arraybuffer');
    const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfOutput)));

    // Enviar email com PDF em anexo
    const emailResponse = await resend.emails.send({
      from: fromEmail,
      to: [clienteEmail],
      subject: assunto,
      html: corpoHtml,
      attachments: [
        {
          filename: `Fatura_${fatura.numero}.pdf`,
          content: pdfBase64,
          contentType: 'application/pdf'
        }
      ]
    });

    console.log("Email enviado com sucesso:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Erro ao enviar fatura:", error);
    return new Response(
      JSON.stringify({ error: "Não foi possível enviar a fatura" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
