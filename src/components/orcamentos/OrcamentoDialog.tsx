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
import { FileText, Send, Loader2, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface OrcamentoDialogProps {
  orcamentoId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
}

interface Orcamento {
  id: string;
  numero: string;
  titulo: string;
  descricao: string;
  status: string;
  valor_total: number;
  validade_dias: number;
  observacoes: string;
  created_at: string;
  cliente: {
    nome: string;
    email: string;
    telefone: string;
    endereco?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
  };
  items: Array<{
    descricao: string;
    quantidade: number;
    unidade: string;
    valor_unitario: number;
    valor_total: number;
  }>;
}

interface EmpresaInfo {
  nome_fantasia: string;
  tipo_pessoa?: string;
  razao_social?: string;
  cnpj?: string;
  regime_tributario?: string;
  inscricao_estadual?: string;
  inscricao_municipal?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  telefone?: string;
  email?: string;
  website?: string;
  logo_url?: string;
  logo_position?: string;
  cor_primaria?: string;
  cor_secundaria?: string;
  cor_borda_secoes?: string;
  cor_borda_linhas?: string;
}

export const OrcamentoDialog = ({ orcamentoId, open, onOpenChange, onEdit }: OrcamentoDialogProps) => {
  const navigate = useNavigate();
  const [orcamento, setOrcamento] = useState<Orcamento | null>(null);
  const [empresaInfo, setEmpresaInfo] = useState<EmpresaInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [convertendo, setConvertendo] = useState(false);

  useEffect(() => {
    if (orcamentoId && open) {
      loadOrcamento();
      loadEmpresaInfo();
    }
  }, [orcamentoId, open]);

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
      setEmpresaInfo(data);
    } catch (error: any) {
      console.error('Erro ao carregar informações da empresa:', error);
    }
  };

  const loadOrcamento = async () => {
    if (!orcamentoId) return;

    setLoading(true);
    try {
      const { data: orcamentoData, error: orcamentoError } = await supabase
        .from('orcamentos')
        .select(`
          id,
          numero,
          titulo,
          descricao,
          status,
          valor_total,
          validade_dias,
          observacoes,
          created_at,
          clientes:cliente_id (
            nome,
            email,
            telefone,
            endereco,
            cidade,
            estado,
            cep
          )
        `)
        .eq('id', orcamentoId)
        .single();

      if (orcamentoError) throw orcamentoError;

      const { data: itemsData, error: itemsError } = await supabase
        .from('orcamento_items')
        .select('*')
        .eq('orcamento_id', orcamentoId)
        .order('ordem');

      if (itemsError) throw itemsError;

      setOrcamento({
        ...orcamentoData,
        cliente: orcamentoData.clientes,
        items: itemsData || [],
      });
    } catch (error: any) {
      toast.error('Erro ao carregar orçamento: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!orcamento) return;

    setSendingEmail(true);
    try {
      const { error } = await supabase.functions.invoke('enviar-orcamento', {
        body: {
          clienteEmail: orcamento.cliente.email,
          orcamentoId: orcamentoId,
        }
      });

      if (error) throw error;

      toast.success('Orçamento enviado por email!');
    } catch (error: any) {
      toast.error('Erro ao enviar email: ' + error.message);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleGeneratePDF = async () => {
    console.log('Iniciando geração de PDF', { orcamento, empresaInfo });
    
    if (!orcamento) {
      toast.error('Orçamento não carregado');
      return;
    }
    
    if (!empresaInfo) {
      toast.error('Configure as informações da empresa em Configurações antes de gerar o PDF');
      return;
    }

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      
      // Cores
      const primaryColor = empresaInfo.cor_primaria || '#6366F1';
      const secondaryColor = empresaInfo.cor_secundaria || '#E5E7EB';
      const borderColor = empresaInfo.cor_borda_secoes || primaryColor;
      const rgbPrimary = hexToRgb(primaryColor);
      const rgbSecondary = hexToRgb(secondaryColor);
      const rgbBorder = hexToRgb(borderColor);
      
      // Calcular cor mais clara para fundos
      const lightSecondaryR = Math.min(255, rgbSecondary.r + (255 - rgbSecondary.r) * 0.85);
      const lightSecondaryG = Math.min(255, rgbSecondary.g + (255 - rgbSecondary.g) * 0.85);
      const lightSecondaryB = Math.min(255, rgbSecondary.b + (255 - rgbSecondary.b) * 0.85);
      
      let yPos = 15;
      
      // === CARREGAR LOGO SE EXISTIR ===
      // Carrega a logo de forma resiliente (tenta via <img>, se falhar busca via fetch -> dataURL)
      const loadLogo = async (url: string): Promise<HTMLImageElement | null> => {
        // 1) Tenta carregar diretamente com <img>
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
        
        // 2) Fallback: busca como blob e converte em dataURL
        try {
          const res = await fetch(url, { mode: 'cors' });
          const blob = await res.blob();
          const dataUrl: string = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          // carrega novamente em <img> para sabermos dimensões
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

      // === CABEÇALHO COM LOGO ===
      // Linha de borda superior
      doc.setDrawColor(rgbBorder.r, rgbBorder.g, rgbBorder.b);
      doc.setLineWidth(1.2);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 6;
      
      // Determinar layout baseado na posição da logo
      const hasLogo = logoImg !== null;
      const isCenterLogo = hasLogo && logoPosition === 'center';
      
      if (isCenterLogo) {
        // LAYOUT: LOGO NO CENTRO
        // Adicionar logo centralizada
        if (logoImg) {
          const logoWidth = (logoImg.width / logoImg.height) * logoHeight;
          const logoX = (pageWidth - logoWidth) / 2;
          doc.addImage(logoImg, 'PNG', logoX, yPos, logoWidth, logoHeight);
          yPos += logoHeight + 5;
        }
        
        // Informações da empresa centralizadas
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(rgbPrimary.r, rgbPrimary.g, rgbPrimary.b);
        doc.text(empresaInfo.nome_fantasia, pageWidth / 2, yPos, { align: 'center' });
        yPos += 5;
        
        if (empresaInfo.razao_social && empresaInfo.tipo_pessoa === 'juridica') {
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(90, 90, 90);
          doc.text(empresaInfo.razao_social, pageWidth / 2, yPos, { align: 'center' });
          yPos += 4;
        }
        
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        
        const infoLines: string[] = [];
        if (empresaInfo.endereco) infoLines.push(empresaInfo.endereco);
        if (empresaInfo.cep || empresaInfo.cidade || empresaInfo.estado) {
          let line = '';
          if (empresaInfo.cep) line += empresaInfo.cep + ' ';
          if (empresaInfo.cidade) line += empresaInfo.cidade;
          if (empresaInfo.estado) line += ' - ' + empresaInfo.estado;
          if (line) infoLines.push(line);
        }
        if (empresaInfo.telefone || empresaInfo.email) {
          let line = '';
          if (empresaInfo.telefone) line += empresaInfo.telefone;
          if (empresaInfo.email) line += (line ? ' | ' : '') + empresaInfo.email;
          if (line) infoLines.push(line);
        }
        if (empresaInfo.cnpj) {
          const label = empresaInfo.tipo_pessoa === 'fisica' ? 'CPF' : 'CNPJ';
          infoLines.push(label + ': ' + empresaInfo.cnpj);
        }
        
        infoLines.forEach(line => {
          doc.text(line, pageWidth / 2, yPos, { align: 'center' });
          yPos += 3.5;
        });
        
        yPos += 3;
        
        // Linha separadora
        doc.setDrawColor(rgbBorder.r, rgbBorder.g, rgbBorder.b);
        doc.setLineWidth(0.8);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 6;
        
        // ORÇAMENTO centralizado
        doc.setFontSize(28);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(rgbPrimary.r, rgbPrimary.g, rgbPrimary.b);
        doc.text('ORÇAMENTO', pageWidth / 2, yPos, { align: 'center' });
        yPos += 8;
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('nº ' + orcamento.numero, pageWidth / 2, yPos, { align: 'center' });
        yPos += 7;
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(90, 90, 90);
        const dataEmissao = new Date(orcamento.created_at).toLocaleDateString('pt-BR');
        doc.text('Em data de: ' + dataEmissao, pageWidth / 2, yPos, { align: 'center' });
        yPos += 3.5;
        
        const dataValidade = new Date(new Date(orcamento.created_at).getTime() + orcamento.validade_dias * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR');
        doc.text('Válido até: ' + dataValidade, pageWidth / 2, yPos, { align: 'center' });
        yPos += 3.5;
        
        doc.text('Validade: ' + orcamento.validade_dias + ' dias', pageWidth / 2, yPos, { align: 'center' });
        yPos += 8;
        
      } else {
        // LAYOUT: LOGO À DIREITA/ESQUERDA COM TÍTULO CENTRALIZADO
        const leftColStart = margin;
        const rightColEnd = pageWidth - margin;
        const logoWidth = hasLogo && logoImg ? (logoImg.width / logoImg.height) * logoHeight : 0;

        // 1) Título centralizado acima das colunas (como no layout da imagem)
        doc.setFontSize(28);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(rgbPrimary.r, rgbPrimary.g, rgbPrimary.b);
        doc.text('ORÇAMENTO', pageWidth / 2, yPos + 2, { align: 'center' });

        // Ponto inicial das colunas abaixo do título
        yPos += 10;

        // Determinar posições das áreas à direita: reserva espaço para a logo
        const logoX = hasLogo && logoPosition === 'right' && logoImg ? (rightColEnd - logoWidth) : rightColEnd;
        const rightTextMaxX = hasLogo && logoPosition === 'right' && logoImg ? (logoX - 6) : rightColEnd;

        // Se a logo for à esquerda, reservar espaço no começo
        const leftTextStartX = hasLogo && logoPosition === 'left' && logoImg ? (leftColStart + logoWidth + 6) : leftColStart;

        // 2) Coluna Esquerda - Informações da Empresa
        let leftYPos = yPos;
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(rgbPrimary.r, rgbPrimary.g, rgbPrimary.b);
        doc.text(empresaInfo.nome_fantasia, leftTextStartX, leftYPos);
        leftYPos += 5;

        if (empresaInfo.razao_social && empresaInfo.tipo_pessoa === 'juridica') {
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(90, 90, 90);
          doc.text(empresaInfo.razao_social, leftTextStartX, leftYPos);
          leftYPos += 4;
        }

        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);

        if (empresaInfo.endereco) {
          doc.text(empresaInfo.endereco, leftTextStartX, leftYPos);
          leftYPos += 3.5;
        }
        if (empresaInfo.cep || empresaInfo.cidade || empresaInfo.estado) {
          let addressLine = '';
          if (empresaInfo.cep) addressLine += empresaInfo.cep + ' ';
          if (empresaInfo.cidade) addressLine += empresaInfo.cidade;
          if (empresaInfo.estado) addressLine += ' - ' + empresaInfo.estado;
          doc.text(addressLine, leftTextStartX, leftYPos);
          leftYPos += 3.5;
        }
        if (empresaInfo.telefone) { doc.text('Tel: ' + empresaInfo.telefone, leftTextStartX, leftYPos); leftYPos += 3.5; }
        if (empresaInfo.email)    { doc.text('E-mail: ' + empresaInfo.email, leftTextStartX, leftYPos); leftYPos += 3.5; }
        if (empresaInfo.website)  { doc.text('Site: ' + empresaInfo.website, leftTextStartX, leftYPos); leftYPos += 3.5; }
        if (empresaInfo.cnpj)     { const label = empresaInfo.tipo_pessoa === 'fisica' ? 'CPF' : 'CNPJ'; doc.text(label + ': ' + empresaInfo.cnpj, leftTextStartX, leftYPos); leftYPos += 3.5; }
        if (empresaInfo.tipo_pessoa === 'juridica' && empresaInfo.regime_tributario) { doc.text('Regime: ' + empresaInfo.regime_tributario, leftTextStartX, leftYPos); leftYPos += 3.5; }
        if (empresaInfo.tipo_pessoa === 'juridica' && empresaInfo.inscricao_estadual) { doc.text('IE: ' + empresaInfo.inscricao_estadual, leftTextStartX, leftYPos); leftYPos += 3.5; }
        if (empresaInfo.tipo_pessoa === 'juridica' && empresaInfo.inscricao_municipal) { doc.text('IM: ' + empresaInfo.inscricao_municipal, leftTextStartX, leftYPos); }

        // 3) Coluna Direita - Nº e Datas (alinhado à direita antes da logo)
        let rightYPos = yPos;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('nº ' + orcamento.numero, rightTextMaxX, rightYPos, { align: 'right' });
        rightYPos += 7;

        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(80, 80, 80);
        doc.text('Em data de:', rightTextMaxX, rightYPos, { align: 'right' });
        rightYPos += 3.5;
        doc.setFont('helvetica', 'normal');
        const dataEmissao2 = new Date(orcamento.created_at).toLocaleDateString('pt-BR');
        doc.text(dataEmissao2, rightTextMaxX, rightYPos, { align: 'right' });
        rightYPos += 4.5;

        doc.setFont('helvetica', 'bold');
        doc.text('Válido até:', rightTextMaxX, rightYPos, { align: 'right' });
        rightYPos += 3.5;
        doc.setFont('helvetica', 'normal');
        const dataValidade2 = new Date(new Date(orcamento.created_at).getTime() + orcamento.validade_dias * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR');
        doc.text(dataValidade2, rightTextMaxX, rightYPos, { align: 'right' });
        rightYPos += 4.5;

        doc.setFont('helvetica', 'bold');
        doc.text('Validade:', rightTextMaxX, rightYPos, { align: 'right' });
        rightYPos += 3.5;
        doc.setFont('helvetica', 'normal');
        doc.text(orcamento.validade_dias + ' dias', rightTextMaxX, rightYPos, { align: 'right' });

        // 4) Desenhar logo no canto direito ou esquerdo
        let logoBottom = yPos;
        if (hasLogo && logoImg) {
          if (logoPosition === 'right') {
            const x = rightColEnd - logoWidth;
            doc.addImage(logoImg, 'PNG', x, yPos - 2, logoWidth, logoHeight);
            logoBottom = Math.max(logoBottom, yPos - 2 + logoHeight);
          } else if (logoPosition === 'left') {
            const x = leftColStart;
            doc.addImage(logoImg, 'PNG', x, yPos - 2, logoWidth, logoHeight);
            logoBottom = Math.max(logoBottom, yPos - 2 + logoHeight);
          }
        }

        // 5) Ajusta yPos para o máximo entre as duas colunas e a logo
        yPos = Math.max(leftYPos, rightYPos, logoBottom) + 8;

        // Linha separadora após cabeçalho
        doc.setDrawColor(rgbBorder.r, rgbBorder.g, rgbBorder.b);
        doc.setLineWidth(1.2);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 8;
      }
      
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
      doc.text(orcamento.cliente.nome, margin + 4, yPos);
      yPos += 5;
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(90, 90, 90);
      if (orcamento.cliente.endereco) {
        doc.text(orcamento.cliente.endereco, margin + 4, yPos);
        yPos += 3.5;
      }
      if (orcamento.cliente.cep || orcamento.cliente.cidade || orcamento.cliente.estado) {
        let clientAddress = '';
        if (orcamento.cliente.cep) clientAddress += orcamento.cliente.cep + ' ';
        if (orcamento.cliente.cidade) clientAddress += orcamento.cliente.cidade;
        if (orcamento.cliente.estado) clientAddress += ' - ' + orcamento.cliente.estado;
        doc.text(clientAddress, margin + 4, yPos);
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
      const tableData = orcamento.items.map(item => [
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
          halign: 'left',
          cellPadding: { top: 3, right: 3, bottom: 3, left: 3 },
        },
        columnStyles: {
          0: { cellWidth: 'auto', halign: 'left' },
          1: { cellWidth: 18, halign: 'center' },
          2: { cellWidth: 22, halign: 'center' },
          3: { cellWidth: 28, halign: 'right' },
          4: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
        },
        styles: { 
          fontSize: 8.5,
          cellPadding: { top: 3, right: 3, bottom: 3, left: 3 },
          lineColor: [rgbBorder.r, rgbBorder.g, rgbBorder.b],
          lineWidth: 0.3,
        },
        alternateRowStyles: {
          fillColor: [lightSecondaryR, lightSecondaryG, lightSecondaryB],
        },
        bodyStyles: {
          textColor: [40, 40, 40],
        },
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;

      // === TOTAL COM DESTAQUE ===
      const totalBoxWidth = 75;
      const totalBoxHeight = 14;
      const totalBoxX = pageWidth - margin - totalBoxWidth;
      
      doc.setFillColor(rgbPrimary.r, rgbPrimary.g, rgbPrimary.b);
      doc.roundedRect(totalBoxX, yPos, totalBoxWidth, totalBoxHeight, 3, 3, 'F');
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('Total a Pagar', totalBoxX + 4, yPos + 6);
      
      doc.setFontSize(14);
      const valorTotal = 'R$ ' + orcamento.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      doc.text(valorTotal, totalBoxX + totalBoxWidth - 4, yPos + 10.5, { align: 'right' });
      
      yPos += totalBoxHeight + 10;

      // === OBSERVAÇÕES ===
      if (orcamento.observacoes && yPos < pageHeight - 40) {
        doc.setDrawColor(rgbBorder.r, rgbBorder.g, rgbBorder.b);
        doc.setFillColor(252, 252, 252);
        doc.setLineWidth(0.3);
        const obsLines = doc.splitTextToSize(orcamento.observacoes, pageWidth - 2 * margin - 8);
        const obsHeight = Math.min(25, Math.max(12, obsLines.length * 4 + 6));
        doc.roundedRect(margin, yPos, pageWidth - 2 * margin, obsHeight, 2, 2, 'FD');
        
        yPos += 5;
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(90, 90, 90);
        doc.text(obsLines, margin + 4, yPos);
      }

      // === RODAPÉ ===
      const footerY = pageHeight - 18;
      doc.setDrawColor(rgbBorder.r, rgbBorder.g, rgbBorder.b);
      doc.setLineWidth(0.5);
      doc.line(margin, footerY, pageWidth - margin, footerY);
      
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(110, 110, 110);
      let footerYPos = footerY + 4;
      
      doc.setFont('helvetica', 'bold');
      doc.text(empresaInfo.nome_fantasia, pageWidth / 2, footerYPos, { align: 'center' });
      footerYPos += 3.5;
      
      doc.setFont('helvetica', 'normal');
      if (empresaInfo.razao_social && empresaInfo.cnpj) {
        doc.text(empresaInfo.razao_social + ' - CNPJ: ' + empresaInfo.cnpj, pageWidth / 2, footerYPos, { align: 'center' });
        footerYPos += 3.5;
      }
      
      if (empresaInfo.endereco) {
        let footerAddress = empresaInfo.endereco;
        if (empresaInfo.cidade) footerAddress += ' - ' + empresaInfo.cidade;
        if (empresaInfo.estado) footerAddress += ' - ' + empresaInfo.estado;
        doc.text(footerAddress, pageWidth / 2, footerYPos, { align: 'center' });
      }

      doc.save(`Orcamento_${orcamento.numero}.pdf`);
      toast.success('PDF gerado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF: ' + error.message);
    }
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 99, g: 102, b: 241 };
  };

  const handleConvertToFatura = async () => {
    if (!orcamento) return;

    setConvertendo(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Gerar número da fatura
      const { data: numeroData, error: numeroError } = await supabase
        .rpc('generate_fatura_numero');
      
      if (numeroError) throw numeroError;

      // Buscar o cliente_id correto do orçamento
      const { data: orcamentoData } = await supabase
        .from('orcamentos')
        .select('cliente_id')
        .eq('id', orcamento.id)
        .single();

      // Criar fatura
      const { data: novaFatura, error: faturaError } = await supabase
        .from('faturas')
        .insert([{
          user_id: user.id,
          cliente_id: orcamentoData?.cliente_id || null,
          numero: numeroData,
          titulo: orcamento.titulo,
          descricao: orcamento.descricao,
          valor_total: orcamento.valor_total,
          status: 'Pendente',
          data_vencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          observacoes: orcamento.observacoes,
        }])
        .select()
        .single();

      if (faturaError) throw faturaError;

      // Copiar itens do orçamento para a fatura
      const faturaItems = orcamento.items.map((item, index) => ({
        fatura_id: novaFatura.id,
        descricao: item.descricao,
        quantidade: item.quantidade,
        unidade: item.unidade,
        valor_unitario: item.valor_unitario,
        valor_total: item.valor_total,
        ordem: index,
      }));

      const { error: itemsError } = await supabase
        .from('fatura_items')
        .insert(faturaItems);

      if (itemsError) throw itemsError;

      // Atualizar status do orçamento
      await supabase
        .from('orcamentos')
        .update({ status: 'Aprovado' })
        .eq('id', orcamento.id);

      toast.success('Fatura criada com sucesso!');
      onOpenChange(false);
      navigate('/faturas');
    } catch (error: any) {
      toast.error('Erro ao converter para fatura: ' + error.message);
    } finally {
      setConvertendo(false);
    }
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

  if (!orcamento) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sr-only">
          <DialogTitle>Orçamento {orcamento.numero}</DialogTitle>
          <DialogDescription>Detalhes do orçamento e ações</DialogDescription>
        </DialogHeader>
        {/* Layout customizado tipo documento */}
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
                  {empresaInfo.razao_social && empresaInfo.tipo_pessoa === 'juridica' && (
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
                      <p className="text-xs text-muted-foreground">
                        {empresaInfo.tipo_pessoa === 'fisica' ? 'CPF' : 'CNPJ'}: {empresaInfo.cnpj}
                      </p>
                    )}
                    {empresaInfo.tipo_pessoa === 'juridica' && empresaInfo.regime_tributario && (
                      <p className="text-xs text-muted-foreground">Regime: {empresaInfo.regime_tributario}</p>
                    )}
                    {empresaInfo.tipo_pessoa === 'juridica' && empresaInfo.inscricao_estadual && (
                      <p className="text-xs text-muted-foreground">IE: {empresaInfo.inscricao_estadual}</p>
                    )}
                    {empresaInfo.tipo_pessoa === 'juridica' && empresaInfo.inscricao_municipal && (
                      <p className="text-xs text-muted-foreground">IM: {empresaInfo.inscricao_municipal}</p>
                    )}
                  </div>
                </>
              )}
            </div>
            
            {/* Informações do Orçamento - Lado Direito (quando logo não está no centro) */}
            {(!empresaInfo?.logo_url || empresaInfo?.logo_position !== 'center') && (
              <div className="text-right flex-shrink-0">
                <h1 className="text-4xl font-bold mb-2" style={{ color: empresaInfo?.cor_primaria || '#6366F1' }}>ORÇAMENTO</h1>
                <p className="text-lg font-semibold">nº {orcamento.numero}</p>
                <div className="mt-4 space-y-1 text-sm">
                  <p className="text-muted-foreground">
                    <span className="font-medium">Em data de:</span>{' '}
                    {new Date(orcamento.created_at).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-muted-foreground">
                    <span className="font-medium">Válido até:</span>{' '}
                    {new Date(new Date(orcamento.created_at).getTime() + orcamento.validade_dias * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-muted-foreground">
                    <span className="font-medium">Validade:</span> {orcamento.validade_dias} dias
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Informações do Orçamento - Abaixo (quando logo está no centro) */}
          {empresaInfo?.logo_url && empresaInfo?.logo_position === 'center' && (
            <div className="text-center pb-4 border-b-2" style={{ borderColor: empresaInfo?.cor_secundaria || '#E5E7EB' }}>
              <h1 className="text-4xl font-bold mb-2" style={{ color: empresaInfo?.cor_primaria || '#6366F1' }}>ORÇAMENTO</h1>
              <p className="text-lg font-semibold">nº {orcamento.numero}</p>
              <div className="mt-4 space-y-1 text-sm">
                <p className="text-muted-foreground">
                  <span className="font-medium">Em data de:</span>{' '}
                  {new Date(orcamento.created_at).toLocaleDateString('pt-BR')}
                </p>
                <p className="text-muted-foreground">
                  <span className="font-medium">Válido até:</span>{' '}
                  {new Date(new Date(orcamento.created_at).getTime() + orcamento.validade_dias * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}
                </p>
                <p className="text-muted-foreground">
                  <span className="font-medium">Validade:</span> {orcamento.validade_dias} dias
                </p>
              </div>
            </div>
          )}

          {/* Seção do Cliente */}
          <div className="rounded-lg p-4" style={{ 
            border: `1px solid ${empresaInfo?.cor_borda_secoes || '#E5E7EB'}`,
            backgroundColor: `${empresaInfo?.cor_secundaria || '#E5E7EB'}20`
          }}>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2 uppercase">Cliente</h3>
            <p className="text-lg font-bold">{orcamento.cliente.nome}</p>
            {orcamento.cliente.endereco && (
              <p className="text-sm text-muted-foreground mt-1">{orcamento.cliente.endereco}</p>
            )}
            {(orcamento.cliente.cidade || orcamento.cliente.cep) && (
              <p className="text-sm text-muted-foreground">
                {orcamento.cliente.cep && `${orcamento.cliente.cep} `}
                {orcamento.cliente.cidade && `${orcamento.cliente.cidade}`}
                {orcamento.cliente.estado && ` - ${orcamento.cliente.estado}`}
              </p>
            )}
          </div>

          {/* Título/Descrição do Orçamento */}
          {orcamento.titulo && (
            <div className="text-sm">
              <p className="font-semibold">{orcamento.titulo}</p>
              {orcamento.descricao && (
                <p className="text-muted-foreground mt-1">{orcamento.descricao}</p>
              )}
            </div>
          )}

          {/* Tabela de Itens */}
          <div>
            <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${empresaInfo?.cor_borda_linhas || '#E5E7EB'}` }}>
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: empresaInfo?.cor_primaria || '#6366F1', color: 'white' }}>
                    <th className="text-left p-3 text-sm font-semibold">Descrição</th>
                    <th className="text-center p-3 text-sm font-semibold w-20">Qtd.</th>
                    <th className="text-center p-3 text-sm font-semibold w-24">Unidade</th>
                    <th className="text-right p-3 text-sm font-semibold w-32">Preço Un.</th>
                    <th className="text-right p-3 text-sm font-semibold w-32">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-card">
                  {orcamento.items.map((item, index) => (
                    <tr key={index} style={{ 
                      backgroundColor: index % 2 === 0 ? `${empresaInfo?.cor_secundaria || '#E5E7EB'}10` : 'transparent',
                      borderBottom: `1px solid ${empresaInfo?.cor_borda_linhas || '#E5E7EB'}`
                    }}>
                      <td className="p-3 text-sm">{item.descricao}</td>
                      <td className="text-center p-3 text-sm">{item.quantidade}</td>
                      <td className="text-center p-3 text-sm">{item.unidade}</td>
                      <td className="text-right p-3 text-sm">
                        R$ {item.valor_unitario.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="text-right p-3 text-sm font-medium">
                        R$ {item.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div className="flex justify-end mt-4">
              <div className="rounded-lg px-6 py-3 min-w-[280px]" style={{ 
                backgroundColor: empresaInfo?.cor_primaria || '#6366F1',
                color: 'white'
              }}>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total a Pagar</span>
                  <span className="text-2xl font-bold">
                    R$ {orcamento.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Observações */}
          {orcamento.observacoes && (
            <div className="border border-border rounded-lg p-4 bg-secondary/20">
              <p className="text-sm text-muted-foreground italic whitespace-pre-wrap">
                {orcamento.observacoes}
              </p>
            </div>
          )}

          {/* Rodapé com informações da empresa */}
          {empresaInfo && (
            <div className="pt-4 border-t border-border text-xs text-muted-foreground text-center space-y-1">
              <p className="font-medium">{empresaInfo.nome_fantasia}</p>
              {empresaInfo.razao_social && empresaInfo.cnpj && (
                <p>{empresaInfo.razao_social} - CNPJ: {empresaInfo.cnpj}</p>
              )}
              {empresaInfo.endereco && (
                <p>
                  {empresaInfo.endereco}
                  {empresaInfo.cidade && ` - ${empresaInfo.cidade}`}
                  {empresaInfo.estado && ` - ${empresaInfo.estado}`}
                </p>
              )}
            </div>
          )}

          {/* Ações */}
          <div className="flex flex-wrap gap-3 justify-end pt-4 border-t">
            {onEdit && (
              <Button variant="outline" onClick={() => {
                onEdit();
                onOpenChange(false);
              }}>
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </Button>
            )}
            <Button variant="outline" onClick={handleGeneratePDF}>
              <FileText className="h-4 w-4 mr-2" />
              Gerar PDF
            </Button>
            <Button variant="outline" onClick={handleSendEmail} disabled={sendingEmail}>
              <Send className="h-4 w-4 mr-2" />
              {sendingEmail ? 'Enviando...' : 'Enviar Email'}
            </Button>
            <Button 
              onClick={handleConvertToFatura}
              disabled={convertendo}
              className="bg-gradient-primary"
            >
              <FileText className="h-4 w-4 mr-2" />
              {convertendo ? 'Convertendo...' : 'Converter em Fatura'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
