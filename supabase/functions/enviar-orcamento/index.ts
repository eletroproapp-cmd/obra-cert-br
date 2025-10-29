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

interface OrcamentoEmailRequest {
  orcamentoId: string;
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
        _function_name: 'enviar-orcamento',
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

    const { orcamentoId, clienteEmail, customSubject, customBody }: OrcamentoEmailRequest = await req.json();

    if (!orcamentoId || typeof orcamentoId !== 'string' || orcamentoId.length !== 36) {
      return new Response(
        JSON.stringify({ error: "ID de orçamento inválido" }),
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

    const { data: orcamento, error: orcamentoError } = await supabaseClient
      .from("orcamentos")
      .select(`
        *,
        clientes:cliente_id (nome, email, telefone, endereco, cidade, estado, cep)
      `)
      .eq("id", orcamentoId)
      .eq("user_id", user.id)
      .single();

    if (orcamentoError || !orcamento) {
      return new Response(
        JSON.stringify({ error: "Orçamento não encontrado ou acesso negado" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Buscar itens do orçamento
    const { data: items, error: itemsError } = await supabaseClient
      .from("orcamento_items")
      .select("*")
      .eq("orcamento_id", orcamentoId)
      .order("ordem");

    if (itemsError) {
      console.error("Erro ao buscar itens:", itemsError);
      return new Response(
        JSON.stringify({ error: "Erro ao buscar itens do orçamento" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Buscar empresa info completa
    const { data: empresa } = await supabaseClient
      .from("empresas")
      .select("*")
      .eq("user_id", user.id)
      .single();

    let assunto = customSubject || `Seu Orçamento ${sanitize(orcamento.numero)}`;
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
        .eq("tipo", "novo_orcamento")
        .eq("ativo", true)
        .single();

      if (template) {
        // Usar template personalizado
        if (!customSubject) {
          assunto = template.assunto
            .replace(/{{numero}}/g, sanitize(orcamento.numero))
            .replace(/{{cliente_nome}}/g, sanitize(orcamento.clientes.nome));
        }

        corpoHtml = template.corpo_html
          .replace(/{{numero}}/g, sanitize(orcamento.numero))
          .replace(/{{cliente_nome}}/g, sanitize(orcamento.clientes.nome))
          .replace(/{{titulo}}/g, sanitize(orcamento.titulo || ''))
          .replace(/{{status}}/g, sanitize(orcamento.status || ''))
          .replace(/{{validade_dias}}/g, String(orcamento.validade_dias || 30))
          .replace(/{{valor_total}}/g, `R$ ${Number(orcamento.valor_total || 0).toFixed(2)}`);
      } else {
      // Template padrão profissional
      corpoHtml = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Prezado(a) <strong>${sanitize(orcamento.clientes.nome)}</strong>,</p>
            
            <p style="font-size: 14px; color: #555; line-height: 1.6; margin-bottom: 15px;">
              Agradecemos o seu contato e a oportunidade de apresentar nossa proposta comercial.
            </p>
            
            <p style="font-size: 14px; color: #555; line-height: 1.6; margin-bottom: 15px;">
              Segue em anexo o orçamento <strong>${sanitize(orcamento.numero)}</strong> conforme solicitado.
            </p>
            
            <div style="background-color: #f5f5f5; border-left: 4px solid #6366f1; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 5px 0; font-size: 14px; color: #333;"><strong>Orçamento:</strong> ${sanitize(orcamento.numero)}</p>
              <p style="margin: 5px 0; font-size: 14px; color: #333;"><strong>Valor:</strong> R$ ${Number(orcamento.valor_total || 0).toFixed(2)}</p>
              <p style="margin: 5px 0; font-size: 14px; color: #333;"><strong>Validade:</strong> ${orcamento.validade_dias || 30} dias</p>
            </div>
            
            <p style="font-size: 14px; color: #555; line-height: 1.6; margin-bottom: 15px;">
              Estamos à disposição para esclarecimentos adicionais e aguardamos seu retorno.
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
    
    // Função auxiliar para converter hex em RGB
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
    
    // Título centralizado
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(rgbPrimary.r, rgbPrimary.g, rgbPrimary.b);
    doc.text('ORÇAMENTO', pageWidth / 2, yPos + 2, { align: 'center' });
    yPos += 10;
    
    // Informações da empresa (esquerda)
    const leftStart = margin;
    let leftY = yPos;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(rgbPrimary.r, rgbPrimary.g, rgbPrimary.b);
    doc.text(empresa?.nome_fantasia || 'Empresa', leftStart, leftY);
    leftY += 5;
    
    if (empresa?.razao_social && empresa.tipo_pessoa === 'juridica') {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
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
    
    // Informações do orçamento (direita)
    const rightEnd = pageWidth - margin;
    let rightY = yPos;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('nº ' + orcamento.numero, rightEnd, rightY, { align: 'right' });
    rightY += 7;
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text('Em data de:', rightEnd, rightY, { align: 'right' });
    rightY += 3.5;
    doc.setFont('helvetica', 'normal');
    const dataEmissao = new Date(orcamento.created_at).toLocaleDateString('pt-BR');
    doc.text(dataEmissao, rightEnd, rightY, { align: 'right' });
    rightY += 4.5;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Válido até:', rightEnd, rightY, { align: 'right' });
    rightY += 3.5;
    doc.setFont('helvetica', 'normal');
    const dataValidade = new Date(new Date(orcamento.created_at).getTime() + orcamento.validade_dias * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR');
    doc.text(dataValidade, rightEnd, rightY, { align: 'right' });
    rightY += 4.5;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Validade:', rightEnd, rightY, { align: 'right' });
    rightY += 3.5;
    doc.setFont('helvetica', 'normal');
    doc.text(orcamento.validade_dias + ' dias', rightEnd, rightY, { align: 'right' });
    
    yPos = Math.max(leftY, rightY) + 8;
    
    // Linha separadora
    doc.setDrawColor(rgbBorder.r, rgbBorder.g, rgbBorder.b);
    doc.setLineWidth(1.2);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;
    
    // === SEÇÃO DO CLIENTE ===
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
    doc.text(orcamento.clientes.nome, margin + 4, yPos);
    yPos += 5;
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(90, 90, 90);
    if (orcamento.clientes.endereco) {
      doc.text(orcamento.clientes.endereco, margin + 4, yPos);
      yPos += 3.5;
    }
    if (orcamento.clientes.cep || orcamento.clientes.cidade || orcamento.clientes.estado) {
      let clientAddr = '';
      if (orcamento.clientes.cep) clientAddr += orcamento.clientes.cep + ' ';
      if (orcamento.clientes.cidade) clientAddr += orcamento.clientes.cidade;
      if (orcamento.clientes.estado) clientAddr += ' - ' + orcamento.clientes.estado;
      doc.text(clientAddr, margin + 4, yPos);
    }
    
    yPos += clientBoxHeight - 13 + 8;
    
    // === TÍTULO E DESCRIÇÃO ===
    if (orcamento.titulo) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(orcamento.titulo, margin, yPos);
      yPos += 5;
      
      if (orcamento.descricao) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(90, 90, 90);
        const splitDesc = doc.splitTextToSize(orcamento.descricao, pageWidth - 2 * margin);
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
    const totalBoxHeight = 12;
    const totalBoxX = pageWidth - margin - totalBoxWidth;
    doc.setFillColor(rgbPrimary.r, rgbPrimary.g, rgbPrimary.b);
    doc.roundedRect(totalBoxX, yPos, totalBoxWidth, totalBoxHeight, 2, 2, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('TOTAL:', totalBoxX + 4, yPos + 5);
    const valorTotal = 'R$ ' + Number(orcamento.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    doc.text(valorTotal, totalBoxX + totalBoxWidth - 4, yPos + 5, { align: 'right' });
    doc.setFontSize(7);
    doc.text('(Valor válido por ' + orcamento.validade_dias + ' dias)', totalBoxX + 4, yPos + 9);
    
    yPos += totalBoxHeight + 8;

    // === DADOS DE PAGAMENTO (se houver) ===
    if (empresa?.banco_nome || empresa?.chave_pix || empresa?.instrucoes_pagamento) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Dados de Pagamento', margin, yPos);
      yPos += 5;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(90, 90, 90);
      const payLines: string[] = [];
      if (empresa?.chave_pix) payLines.push('PIX: ' + empresa.chave_pix);
      if (empresa?.banco_nome) {
        let linhaBanco = `Banco: ${empresa.banco_nome}`;
        if (empresa.banco_codigo) linhaBanco += ` (${empresa.banco_codigo})`;
        payLines.push(linhaBanco);
      }
      if (empresa?.agencia || empresa?.conta) {
        const ag = empresa?.agencia ? `Agência: ${empresa.agencia}` : '';
        const ct = empresa?.conta ? ` Conta: ${empresa.conta}` : '';
        const tp = empresa?.tipo_conta ? ` (${empresa.tipo_conta})` : '';
        payLines.push((ag + (ag && ct ? ' | ' : '') + ct + tp).trim());
      }
      if (empresa?.titular_nome) {
        let t = `Titular: ${empresa.titular_nome}`;
        if (empresa?.titular_documento) t += ` • Doc: ${empresa.titular_documento}`;
        payLines.push(t);
      }
      if (empresa?.instrucoes_pagamento) payLines.push('Instruções: ' + empresa.instrucoes_pagamento);
      const splitPay = doc.splitTextToSize(payLines.join('\n'), pageWidth - 2 * margin - 50);
      doc.text(splitPay, margin, yPos);
      yPos += splitPay.length * 3.5 + 8;
    }

    // === OBSERVAÇÕES ===
    if (orcamento.observacoes) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Observações:', margin, yPos);
      yPos += 5;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(90, 90, 90);
      const splitObs = doc.splitTextToSize(orcamento.observacoes, pageWidth - 2 * margin);
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
        const kvDesc = tlv('02', `Orcamento ${orcamento.numero}`.substring(0,50));
        const mai = tlv('26', gui + kvChave + kvDesc);
        const payload = (() => {
          const pf = tlv('00', '01');
          const method = tlv('01', '11');
          const mcc = tlv('52', '0000');
          const curr = tlv('53', '986');
          const amount = orcamento.valor_total ? tlv('54', Number(orcamento.valor_total).toFixed(2)) : '';
          const country = tlv('58', 'BR');
          const name = tlv('59', (empresa?.nome_fantasia || 'RECEBEDOR').substring(0,25));
          const city = tlv('60', (empresa?.cidade || 'BRASIL').substring(0,15));
          const additional = tlv('62', tlv('05', (orcamento.numero || '***').toString().substring(0,25)));
          let withoutCRC = pf + method + mai + mcc + curr + amount + country + name + city + additional + '6304';
          const crc = crc16(withoutCRC);
          return withoutCRC + crc;
        })();
        
        const qrCodeDataUrl = await QRCode.toDataURL(payload, { width: 140, margin: 1, color: { dark: '#000000', light: '#FFFFFF' }});
        
        const qrSize = 40;
        const pageHeight = doc.internal.pageSize.getHeight();
        if (yPos + qrSize + 20 > pageHeight - 20) {
          doc.addPage();
          yPos = 20;
        }
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
          filename: `Orcamento_${orcamento.numero}.pdf`,
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
    console.error("Erro ao enviar orçamento:", error);
    return new Response(
      JSON.stringify({ error: "Não foi possível enviar o orçamento" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
