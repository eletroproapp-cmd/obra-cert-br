import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Send, Loader2, Pencil, Receipt, Download, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { EmailDialog } from '@/components/shared/EmailDialog';

interface FaturaDialogProps {
  faturaId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

interface EmpresaInfo {
  nome_fantasia: string;
  razao_social: string;
  cnpj: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  telefone: string;
  email: string;
  website: string;
  logo_url: string;
  logo_position: string;
  cor_primaria: string;
  cor_secundaria: string;
  cor_borda_secoes: string;
  cor_borda_linhas: string;
  chave_pix?: string; // opcional
}


interface Fatura {
  id: string;
  numero: string;
  titulo: string;
  descricao: string;
  status: string;
  valor_total: number;
  data_vencimento: string;
  data_pagamento: string | null;
  forma_pagamento: string | null;
  observacoes: string;
  created_at: string;
  nfe_status?: string;
  nfe_numero?: string;
  nfe_serie?: string;
  nfe_chave_acesso?: string;
  nfe_protocolo?: string;
  nfe_data_emissao?: string;
  nfe_xml?: string;
  cliente: {
    nome: string;
    email: string;
    telefone: string;
  };
  items: Array<{
    descricao: string;
    quantidade: number;
    unidade: string;
    valor_unitario: number;
    valor_total: number;
  }>;
}

export const FaturaDialog = ({ faturaId, open, onOpenChange, onEdit, onDelete }: FaturaDialogProps) => {
  const [fatura, setFatura] = useState<Fatura | null>(null);
  const [empresaInfo, setEmpresaInfo] = useState<EmpresaInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emitindoNFe, setEmitindoNFe] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);

  useEffect(() => {
    if (faturaId && open) {
      loadFatura();
      loadEmpresaInfo();
    }
  }, [faturaId, open]);

  const loadEmpresaInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      if (data) setEmpresaInfo(data);
    } catch (error: any) {
      console.error('Erro ao carregar empresa:', error);
    }
  };

  const loadFatura = async () => {
    if (!faturaId) return;

    setLoading(true);
    try {
      const { data: faturaData, error: faturaError } = await supabase
        .from('faturas')
        .select(`
          id,
          numero,
          titulo,
          descricao,
          status,
          valor_total,
          data_vencimento,
          data_pagamento,
          forma_pagamento,
          observacoes,
          created_at,
          nfe_status,
          nfe_numero,
          nfe_serie,
          nfe_chave_acesso,
          nfe_protocolo,
          nfe_data_emissao,
          nfe_xml,
          clientes:cliente_id (
            nome,
            email,
            telefone
          )
        `)
        .eq('id', faturaId)
        .single();

      if (faturaError) throw faturaError;

      const { data: itemsData, error: itemsError } = await supabase
        .from('fatura_items')
        .select('*')
        .eq('fatura_id', faturaId)
        .order('ordem');

      if (itemsError) throw itemsError;

      setFatura({
        ...faturaData,
        cliente: faturaData.clientes,
        items: itemsData || [],
      });
    } catch (error: any) {
      toast.error('Erro ao carregar fatura: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEmailDialog = () => {
    setEmailDialogOpen(true);
  };

  const handleSendEmail = async (email: string, subject: string, body: string) => {
    if (!fatura) return;

    const { error } = await supabase.functions.invoke('enviar-fatura', {
      body: {
        clienteEmail: email,
        faturaId: faturaId,
        customSubject: subject,
        customBody: body,
      }
    });

    if (error) throw error;
  };

  const handleEmitirNFe = async () => {
    if (!faturaId) return;

    setEmitindoNFe(true);
    try {
      const { data, error } = await supabase.functions.invoke('emitir-nfe', {
        body: { faturaId },
      });

      if (error) throw error;

      toast.success('NF-e emitida com sucesso!');
      await loadFatura();
    } catch (error: any) {
      console.error('Erro ao emitir NF-e:', error);
      toast.error('Não foi possível emitir a NF-e. Verifique CNPJ, certificado digital e CPF/CNPJ do cliente nas Configurações.');
    } finally {
      setEmitindoNFe(false);
    }
  };


  // Utilidades de cor
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 99, g: 102, b: 241 };
  };

  // Funções para gerar o payload BR Code (PIX) com CRC16
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

  const buildPixPayload = ({
    chave,
    nome,
    cidade,
    valor,
    txid,
    descricao,
  }: { chave: string; nome: string; cidade: string; valor?: number; txid?: string; descricao?: string }) => {
    const gui = tlv('00', 'br.gov.bcb.pix');
    const kvChave = tlv('01', chave);
    const kvDesc = descricao ? tlv('02', descricao.substring(0, 50)) : '';
    const merchantAccountInfo = tlv('26', gui + kvChave + kvDesc);

    const payloadFormatIndicator = tlv('00', '01');
    const initiationMethod = tlv('01', '11');
    const merchantCategoryCode = tlv('52', '0000');
    const transactionCurrency = tlv('53', '986');
    const transactionAmount = valor ? tlv('54', valor.toFixed(2)) : '';
    const countryCode = tlv('58', 'BR');
    const merchantName = tlv('59', (nome || 'RECEBEDOR').substring(0, 25));
    const merchantCity = tlv('60', (cidade || 'BRASIL').substring(0, 15));
    const additional = tlv('62', (txid ? tlv('05', txid.substring(0, 25)) : tlv('05', '***')));

    // CRC será calculado sobre todo payload + ID(63) + len(04)
    let withoutCRC =
      payloadFormatIndicator +
      initiationMethod +
      merchantAccountInfo +
      merchantCategoryCode +
      transactionCurrency +
      transactionAmount +
      countryCode +
      merchantName +
      merchantCity +
      additional +
      '6304';

    const crc = crc16(withoutCRC);
    return withoutCRC + crc;
  };

  const handleGeneratePDF = async () => {
    if (!fatura) return;
    if (!empresaInfo) {
      toast.error('Configure os dados da empresa para gerar o PDF');
      return;
    }

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;

      const primary = empresaInfo.cor_primaria || '#6366F1';
      const secondary = empresaInfo.cor_secundaria || '#E5E7EB';
      const border = empresaInfo.cor_borda_secoes || primary;
      const rgbPrimary = hexToRgb(primary);
      const rgbBorder = hexToRgb(border);
      const rgbSecondary = hexToRgb(secondary);

      const lightSec = [
        Math.min(255, rgbSecondary.r + (255 - rgbSecondary.r) * 0.85),
        Math.min(255, rgbSecondary.g + (255 - rgbSecondary.g) * 0.85),
        Math.min(255, rgbSecondary.b + (255 - rgbSecondary.b) * 0.85),
      ];

      let y = 16;
      
      // === CARREGAR LOGO SE EXISTIR ===
      const loadLogo = async (url: string): Promise<HTMLImageElement | null> => {
        try {
          const img1 = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('img onerror'));
            img.src = url;
          });
          return img1;
        } catch (_) {}
        
        try {
          const res = await fetch(url, { mode: 'cors' });
          const blob = await res.blob();
          const dataUrl: string = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          const img2 = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('img2 onerror'));
            img.src = dataUrl;
          });
          return img2;
        } catch (e) {
          console.error('Falha ao carregar logo (fetch):', e);
          return null;
        }
      };

      let logoImg: HTMLImageElement | null = null;
      const logoHeight = 20;
      const logoPosition = empresaInfo.logo_position || 'right';
      
      if (empresaInfo.logo_url) {
        logoImg = await loadLogo(empresaInfo.logo_url);
      }
      
      // Top line
      doc.setDrawColor(rgbBorder.r, rgbBorder.g, rgbBorder.b);
      doc.setLineWidth(1.2);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;

      // LAYOUT: LOGO À DIREITA/ESQUERDA COM TÍTULO CENTRALIZADO
      const leftColStart = margin;
      const rightColEnd = pageWidth - margin;
      const logoWidth = logoImg ? (logoImg.width / logoImg.height) * logoHeight : 0;
      const hasLogo = logoImg !== null;

      // 1) Título centralizado acima
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(28);
      doc.setTextColor(rgbPrimary.r, rgbPrimary.g, rgbPrimary.b);
      doc.text('FATURA', pageWidth / 2, y + 2, { align: 'center' });
      y += 10;

      const logoX = hasLogo && logoPosition === 'right' ? (rightColEnd - logoWidth) : rightColEnd;
      const rightTextMaxX = hasLogo && logoPosition === 'right' ? (logoX - 6) : rightColEnd;
      const leftTextStartX = hasLogo && logoPosition === 'left' ? (leftColStart + logoWidth + 6) : leftColStart;

      // 2) Coluna Esquerda - Informações da Empresa
      let leftYPos = y;
      doc.setFontSize(16);
      doc.setTextColor(rgbPrimary.r, rgbPrimary.g, rgbPrimary.b);
      doc.text(empresaInfo.nome_fantasia, leftTextStartX, leftYPos);
      leftYPos += 5;
      
      if (empresaInfo.razao_social) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(90, 90, 90);
        doc.text(empresaInfo.razao_social, leftTextStartX, leftYPos);
        leftYPos += 4;
      }
      
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      
      if (empresaInfo.endereco) { doc.text(empresaInfo.endereco, leftTextStartX, leftYPos); leftYPos += 3.5; }
      let addrLine = '';
      if (empresaInfo.cep) addrLine += empresaInfo.cep + ' ';
      if (empresaInfo.cidade) addrLine += empresaInfo.cidade;
      if (empresaInfo.estado) addrLine += ' - ' + empresaInfo.estado;
      if (addrLine) { doc.text(addrLine, leftTextStartX, leftYPos); leftYPos += 3.5; }
      if (empresaInfo.telefone) { doc.text('Tel: ' + empresaInfo.telefone, leftTextStartX, leftYPos); leftYPos += 3.5; }
      if (empresaInfo.email) { doc.text('E-mail: ' + empresaInfo.email, leftTextStartX, leftYPos); leftYPos += 3.5; }
      if (empresaInfo.website) { doc.text('Site: ' + empresaInfo.website, leftTextStartX, leftYPos); leftYPos += 3.5; }
      if (empresaInfo.cnpj) { doc.text('CNPJ: ' + empresaInfo.cnpj, leftTextStartX, leftYPos); }

      // 3) Coluna Direita - Nº e Datas
      let rightYPos = y;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('nº ' + fatura.numero, rightTextMaxX, rightYPos, { align: 'right' });
      rightYPos += 7;

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(80, 80, 80);
      doc.text('Em data de:', rightTextMaxX, rightYPos, { align: 'right' });
      rightYPos += 3.5;
      doc.setFont('helvetica', 'normal');
      doc.text(new Date(fatura.created_at).toLocaleDateString('pt-BR'), rightTextMaxX, rightYPos, { align: 'right' });
      rightYPos += 4.5;

      doc.setFont('helvetica', 'bold');
      doc.text('Vencimento:', rightTextMaxX, rightYPos, { align: 'right' });
      rightYPos += 3.5;
      doc.setFont('helvetica', 'normal');
      doc.text(new Date(fatura.data_vencimento).toLocaleDateString('pt-BR'), rightTextMaxX, rightYPos, { align: 'right' });

      // 4) Desenhar logo
      let logoBottom = y;
      if (hasLogo && logoImg) {
        if (logoPosition === 'right') {
          const x = rightColEnd - logoWidth;
          doc.addImage(logoImg, 'PNG', x, y - 2, logoWidth, logoHeight);
          logoBottom = Math.max(logoBottom, y - 2 + logoHeight);
        } else if (logoPosition === 'left') {
          const x = leftColStart;
          doc.addImage(logoImg, 'PNG', x, y - 2, logoWidth, logoHeight);
          logoBottom = Math.max(logoBottom, y - 2 + logoHeight);
        }
      }

      // 5) Ajusta yPos
      y = Math.max(leftYPos, rightYPos, logoBottom) + 8;

      // Separator
      doc.setDrawColor(rgbBorder.r, rgbBorder.g, rgbBorder.b);
      doc.setLineWidth(1.2);
      doc.line(margin, y, pageWidth - margin, y);
      y += 8;

      // Cliente box
      doc.setFillColor(lightSec[0], lightSec[1], lightSec[2]);
      doc.setLineWidth(0.3);
      const clientH = 22;
      doc.roundedRect(margin, y, pageWidth - 2 * margin, clientH, 3, 3, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(fatura.cliente.nome, margin + 4, y + 9);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(90, 90, 90);
      doc.text(fatura.cliente.email || '', margin + 4, y + 14);
      if (fatura.cliente.telefone) doc.text(fatura.cliente.telefone, margin + 4, y + 18);
      y += clientH + 8;

      // Itens
      const body = fatura.items.map(i => [
        i.descricao,
        String(i.quantidade),
        i.unidade,
        'R$ ' + i.valor_unitario.toFixed(2),
        'R$ ' + i.valor_total.toFixed(2),
      ]);

      autoTable(doc, {
        startY: y,
        head: [['Descrição', 'Qtd.', 'Unidade', 'Preço Un.', 'Total']],
        body,
        theme: 'grid',
        headStyles: { fillColor: [rgbPrimary.r, rgbPrimary.g, rgbPrimary.b], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
        styles: { fontSize: 8.5, lineColor: [rgbBorder.r, rgbBorder.g, rgbBorder.b], lineWidth: 0.3 },
        columnStyles: { 1: { halign: 'center', cellWidth: 18 }, 2: { halign: 'center', cellWidth: 22 }, 3: { halign: 'right', cellWidth: 30 }, 4: { halign: 'right', cellWidth: 30 } },
        alternateRowStyles: { fillColor: [lightSec[0], lightSec[1], lightSec[2]] },
      });

      y = (doc as any).lastAutoTable.finalY + 10;

      // Total box
      const totalW = 75, totalH = 14, totalX = pageWidth - margin - totalW;
      doc.setFillColor(rgbPrimary.r, rgbPrimary.g, rgbPrimary.b);
      doc.roundedRect(totalX, y, totalW, totalH, 3, 3, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.text('Total a Pagar', totalX + 4, y + 6);
      doc.setFontSize(14);
      doc.text('R$ ' + fatura.valor_total.toFixed(2), totalX + totalW - 4, y + 10.5, { align: 'right' });

      // PIX QR Code (se houver chave) - posicionado abaixo do total
      const pixY = y + totalH + 12; // Adiciona espaço após o total
      if (empresaInfo.chave_pix) {
        const payload = buildPixPayload({
          chave: empresaInfo.chave_pix,
          nome: empresaInfo.nome_fantasia,
          cidade: empresaInfo.cidade || 'BRASIL',
          valor: fatura.valor_total,
          txid: fatura.numero,
          descricao: `Fatura ${fatura.numero}`,
        });
        const dataUrl = await QRCode.toDataURL(payload, { errorCorrectionLevel: 'M', width: 180 });

        const boxW = 70, boxH = 70;
        const boxX = margin;
        doc.setDrawColor(rgbBorder.r, rgbBorder.g, rgbBorder.b);
        doc.roundedRect(boxX, pixY, boxW, boxH, 3, 3);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text('Pague com PIX', boxX + 4, pixY + 6);
        doc.addImage(dataUrl, 'PNG', boxX + 6, pixY + 10, 58, 58);

        // Copia e cola - posicionado ao lado do QR code
        const copy = doc.splitTextToSize(payload, 100); // Reduzido para 100 para evitar sobreposição
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(90, 90, 90);
        doc.text(copy, boxX + boxW + 6, pixY + 10);
      } else {
        // Mensagem para configurar PIX
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(110, 110, 110);
        doc.text('Configure sua chave PIX em Configurações para exibir o QR Code.', margin, pixY);
      }

      // Rodapé
      const footerY = pageHeight - 18;
      doc.setDrawColor(rgbBorder.r, rgbBorder.g, rgbBorder.b);
      doc.line(margin, footerY, pageWidth - margin, footerY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(110, 110, 110);
      doc.text(empresaInfo.nome_fantasia, pageWidth / 2, footerY + 4, { align: 'center' });

      doc.save(`Fatura_${fatura.numero}.pdf`);
      toast.success('PDF gerado com sucesso!');
    } catch (e: any) {
      console.error('Erro ao gerar PDF da fatura:', e);
      toast.error('Erro ao gerar PDF: ' + e.message);
    }
  };

  const getNFeStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      'nao_emitida': { label: 'Não Emitida', variant: 'outline' },
      'processando': { label: 'Processando', variant: 'secondary' },
      'emitida': { label: 'Emitida', variant: 'default' },
      'cancelada': { label: 'Cancelada', variant: 'destructive' },
      'erro': { label: 'Erro', variant: 'destructive' },
    };

    const config = statusMap[status] || statusMap['nao_emitida'];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'Pago': 'text-success',
      'Pendente': 'text-accent',
      'Vencido': 'text-destructive',
      'Cancelado': 'text-muted-foreground',
    };
    return colors[status as keyof typeof colors] || 'text-muted-foreground';
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!fatura) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        {/* Layout customizado estilo documento */}
        
        <div className="space-y-6 p-2">
          {/* Cabeçalho estilo documento - Logo e Empresa */}
          <div 
            className={`pb-4 border-b-2 ${
              empresaInfo?.logo_url && empresaInfo?.logo_position === 'left' ? 'flex items-start gap-6' :
              empresaInfo?.logo_url && empresaInfo?.logo_position === 'right' ? 'flex items-start gap-6 flex-row-reverse' :
              ''
            }`}
            style={{ borderColor: empresaInfo?.cor_borda_secoes || empresaInfo?.cor_primaria || '#6366F1' }}
          >
            {/* Logo */}
            {empresaInfo?.logo_url && (
              <div className={`flex-shrink-0 ${empresaInfo.logo_position === 'center' ? 'w-full flex justify-center mb-4' : ''}`}>
                <img 
                  src={empresaInfo.logo_url} 
                  alt="Logo" 
                  className="h-20 object-contain"
                />
              </div>
            )}
            
            {/* Informações da Empresa */}
            <div className="flex-1">
              {empresaInfo && (
                <>
                  <h2 className="text-2xl font-bold mb-1" style={{ color: empresaInfo.cor_primaria || '#6366F1' }}>
                    {empresaInfo.nome_fantasia}
                  </h2>
                  {empresaInfo.razao_social && (
                    <p className="text-sm font-medium text-muted-foreground">
                      {empresaInfo.razao_social}
                    </p>
                  )}
                  {empresaInfo.endereco && (
                    <p className="text-xs text-muted-foreground mt-2">{empresaInfo.endereco}</p>
                  )}
                  {(empresaInfo.cidade || empresaInfo.estado || empresaInfo.cep) && (
                    <p className="text-xs text-muted-foreground">
                      {empresaInfo.cep && `${empresaInfo.cep} `}
                      {empresaInfo.cidade && `${empresaInfo.cidade}`}
                      {empresaInfo.estado && ` - ${empresaInfo.estado}`}
                    </p>
                  )}
                  <div className="mt-2 space-y-0.5">
                    {empresaInfo.telefone && (
                      <p className="text-xs text-muted-foreground">Tel: {empresaInfo.telefone}</p>
                    )}
                    {empresaInfo.email && (
                      <p className="text-xs text-muted-foreground">E-mail: {empresaInfo.email}</p>
                    )}
                    {empresaInfo.website && (
                      <p className="text-xs text-muted-foreground">Site: {empresaInfo.website}</p>
                    )}
                    {empresaInfo.cnpj && (
                      <p className="text-xs text-muted-foreground">CNPJ: {empresaInfo.cnpj}</p>
                    )}
                  </div>
                </>
              )}
            </div>
            
            {/* Informações da Fatura - Lado Direito (quando logo não está no centro) */}
            {(!empresaInfo?.logo_url || empresaInfo?.logo_position !== 'center') && (
              <div className="text-right flex-shrink-0">
                <h1 className="text-4xl font-bold mb-2" style={{ color: empresaInfo?.cor_primaria || '#6366F1' }}>FATURA</h1>
                <p className="text-lg font-semibold">nº {fatura.numero}</p>
                <div className="mt-4 space-y-1 text-sm">
                  <p className="text-muted-foreground">
                    <span className="font-medium">Em data de:</span>{' '}
                    {new Date(fatura.created_at).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-muted-foreground">
                    <span className="font-medium">Vencimento:</span>{' '}
                    {new Date(fatura.data_vencimento).toLocaleDateString('pt-BR')}
                  </p>
                  <p className={`font-medium ${getStatusColor(fatura.status)}`}>
                    Status: {fatura.status}
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Informações da Fatura - Abaixo (quando logo está no centro) */}
          {empresaInfo?.logo_url && empresaInfo?.logo_position === 'center' && (
            <div className="text-center pb-4 border-b-2" style={{ borderColor: empresaInfo?.cor_secundaria || '#E5E7EB' }}>
              <h1 className="text-4xl font-bold mb-2" style={{ color: empresaInfo?.cor_primaria || '#6366F1' }}>FATURA</h1>
              <p className="text-lg font-semibold">nº {fatura.numero}</p>
              <div className="mt-4 space-y-1 text-sm">
                <p className="text-muted-foreground">
                  <span className="font-medium">Emitida em:</span>{' '}
                  {new Date(fatura.created_at).toLocaleDateString('pt-BR')}
                </p>
                <p className="text-muted-foreground">
                  <span className="font-medium">Vencimento:</span>{' '}
                  {new Date(fatura.data_vencimento).toLocaleDateString('pt-BR')}
                </p>
                <p className={`font-medium ${getStatusColor(fatura.status)}`}>
                  Status: {fatura.status}
                </p>
              </div>
            </div>
          )}

          {/* Cliente */}
          <div 
            className="p-4 rounded-lg"
            style={{ 
              backgroundColor: empresaInfo?.cor_secundaria || '#E5E7EB',
              borderLeft: `4px solid ${empresaInfo?.cor_borda_secoes || empresaInfo?.cor_primaria || '#6366F1'}`
            }}
          >
            <h3 className="font-semibold mb-2">Cliente</h3>
            <p className="text-lg">{fatura.cliente.nome}</p>
            <p className="text-sm text-muted-foreground">{fatura.cliente.email}</p>
            {fatura.cliente.telefone && (
              <p className="text-sm text-muted-foreground">{fatura.cliente.telefone}</p>
            )}
          </div>

          {/* Detalhes */}
          <div>
            <h3 className="font-semibold mb-2">Detalhes</h3>
            <p className="text-lg font-medium">{fatura.titulo}</p>
            {fatura.descricao && (
              <p className="text-sm text-muted-foreground mt-1">{fatura.descricao}</p>
            )}
            <div className="flex gap-4 mt-2 flex-wrap">
              <span className="text-sm">
                Status: <span className={`font-medium ${getStatusColor(fatura.status)}`}>{fatura.status}</span>
              </span>
              <span className="text-sm">
                Vencimento: <span className="font-medium">
                  {new Date(fatura.data_vencimento).toLocaleDateString('pt-BR')}
                </span>
              </span>
              {fatura.forma_pagamento && (
                <span className="text-sm">
                  Forma: <span className="font-medium">{fatura.forma_pagamento}</span>
                </span>
              )}
              {fatura.data_pagamento && (
                <span className="text-sm">
                  Pago em: <span className="font-medium">
                    {new Date(fatura.data_pagamento).toLocaleDateString('pt-BR')}
                  </span>
                </span>
              )}
            </div>
          </div>

          {/* Itens */}
          <div>
            <h3 className="font-semibold mb-3">Itens</h3>
            <div className="border rounded-lg overflow-hidden" style={{ borderColor: empresaInfo?.cor_borda_linhas || '#E5E7EB' }}>
              <table className="w-full">
                <thead style={{ backgroundColor: empresaInfo?.cor_primaria || '#6366F1' }}>
                  <tr>
                    <th className="text-left p-3 text-sm font-medium text-white">Descrição</th>
                    <th className="text-center p-3 text-sm font-medium text-white">Qtd</th>
                    <th className="text-center p-3 text-sm font-medium text-white">Und</th>
                    <th className="text-right p-3 text-sm font-medium text-white">Valor Unit.</th>
                    <th className="text-right p-3 text-sm font-medium text-white">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {fatura.items.map((item, index) => (
                    <tr 
                      key={index}
                      style={{ 
                        backgroundColor: index % 2 === 0 ? 'white' : (empresaInfo?.cor_secundaria || '#E5E7EB'),
                        borderTop: `1px solid ${empresaInfo?.cor_borda_linhas || '#E5E7EB'}`
                      }}
                    >
                      <td className="p-3">{item.descricao}</td>
                      <td className="text-center p-3">{item.quantidade}</td>
                      <td className="text-center p-3">{item.unidade}</td>
                      <td className="text-right p-3">R$ {item.valor_unitario.toFixed(2)}</td>
                      <td className="text-right p-3 font-medium">
                        R$ {item.valor_total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: empresaInfo?.cor_primaria || '#6366F1' }}>
                    <td colSpan={4} className="text-right p-3 font-semibold text-white">
                      Valor Total:
                    </td>
                    <td className="text-right p-3 font-bold text-white text-lg">
                      R$ {fatura.valor_total.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Observações */}
          {fatura.observacoes && (
            <div 
              className="p-4 rounded-lg"
              style={{ 
                backgroundColor: empresaInfo?.cor_secundaria || '#E5E7EB',
                borderLeft: `4px solid ${empresaInfo?.cor_borda_secoes || empresaInfo?.cor_primaria || '#6366F1'}`
              }}
            >
              <h3 className="font-semibold mb-2">Observações</h3>
              <p className="text-sm whitespace-pre-wrap">{fatura.observacoes}</p>
            </div>
          )}

          {/* Seção QR Code PIX */}
          {empresaInfo?.chave_pix && (
            <div className="border rounded-lg p-6" style={{ borderColor: empresaInfo?.cor_borda_secoes || '#E5E7EB' }}>
              <h3 className="text-lg font-semibold mb-4">Pague com PIX</h3>
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-shrink-0">
                  <div className="w-48 h-48 border rounded-lg flex items-center justify-center bg-white">
                    <p className="text-sm text-center text-muted-foreground px-4">
                      QR Code será gerado no PDF
                    </p>
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-1">Chave PIX:</p>
                    <code className="text-xs bg-muted p-2 rounded block break-all">
                      {empresaInfo.chave_pix}
                    </code>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Escaneie o QR Code no PDF ou copie a chave PIX acima para fazer o pagamento.
                    </p>
                  </div>
                  <div className="bg-muted/50 p-3 rounded">
                    <p className="text-sm font-semibold">Valor: R$ {fatura.valor_total.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Vencimento: {new Date(fatura.data_vencimento).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Seção NF-e */}
          <div className="border-t pt-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Nota Fiscal Eletrônica
                </h3>
                <p className="text-sm text-muted-foreground">
                  Emita a NF-e referente a esta fatura
                </p>
              </div>
              {fatura.nfe_status && getNFeStatusBadge(fatura.nfe_status)}
            </div>

            {fatura.nfe_status === 'emitida' && (
              <div className="bg-muted rounded-lg p-4 mb-4 space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">NF-e Emitida com Sucesso</p>
                    <div className="text-sm text-muted-foreground mt-2 space-y-1">
                      <p><strong>Número:</strong> {fatura.nfe_numero} / <strong>Série:</strong> {fatura.nfe_serie}</p>
                      <p className="break-all"><strong>Chave de Acesso:</strong> {fatura.nfe_chave_acesso}</p>
                      <p><strong>Protocolo:</strong> {fatura.nfe_protocolo}</p>
                      <p><strong>Data de Emissão:</strong> {fatura.nfe_data_emissao && new Date(fatura.nfe_data_emissao).toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {fatura.nfe_status === 'erro' && (
              <div className="bg-destructive/10 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <p className="font-medium text-destructive">Erro ao Emitir NF-e</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Verifique os dados da fatura e suas configurações fiscais.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 flex-wrap">
              {(!fatura.nfe_status || fatura.nfe_status === 'nao_emitida' || fatura.nfe_status === 'erro') && (
                <Button 
                  onClick={handleEmitirNFe} 
                  disabled={emitindoNFe}
                  variant="default"
                >
                  <Receipt className="mr-2 h-4 w-4" />
                  {emitindoNFe ? 'Emitindo...' : 'Emitir NF-e'}
                </Button>
              )}
              
              {fatura.nfe_status === 'emitida' && fatura.nfe_xml && (
                <Button 
                  variant="outline"
                  onClick={() => {
                    const blob = new Blob([fatura.nfe_xml!], { type: 'application/xml' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `NFe_${fatura.nfe_chave_acesso}.xml`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                  }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Baixar XML
                </Button>
              )}
            </div>
          </div>

          {/* Ações */}
          <div className="flex gap-3 justify-end pt-4 border-t flex-wrap">
            {onEdit && (
              <Button variant="outline" onClick={() => {
                onEdit();
                onOpenChange(false);
              }}>
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </Button>
            )}
            {onDelete && (
              <Button variant="outline" onClick={() => {
                onDelete();
                onOpenChange(false);
              }} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            )}
            <Button variant="outline" onClick={handleGeneratePDF}>
              <FileText className="h-4 w-4 mr-2" />
              Gerar PDF
            </Button>
            <Button onClick={handleOpenEmailDialog} variant="hero">
              <Send className="h-4 w-4 mr-2" />
              Enviar por Email
            </Button>
          </div>
        </div>
      </DialogContent>

      {fatura && (
        <EmailDialog
          open={emailDialogOpen}
          onOpenChange={setEmailDialogOpen}
          recipientEmail={fatura.cliente.email}
          defaultSubject={`Fatura nº ${fatura.numero} - ${empresaInfo?.nome_fantasia || 'Sua Empresa'}`}
          defaultBody={`Prezado(a) ${fatura.cliente.nome},

Segue em anexo a fatura nº ${fatura.numero}.

Detalhes:
- Título: ${fatura.titulo}
- Valor Total: R$ ${fatura.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Vencimento: ${new Date(fatura.data_vencimento).toLocaleDateString('pt-BR')}

${fatura.forma_pagamento ? `Forma de Pagamento: ${fatura.forma_pagamento}` : ''}

Contamos com seu pagamento até a data de vencimento.

Atenciosamente,
${empresaInfo?.nome_fantasia || 'Sua Empresa'}`}
          onSend={handleSendEmail}
          onDownloadPDF={handleGeneratePDF}
          documentType="fatura"
        />
      )}
    </Dialog>
  );
};
