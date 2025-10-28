import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Mail, Save } from 'lucide-react';

interface EmailTemplate {
  id: string;
  nome: string;
  tipo: string;
  assunto: string;
  corpo_html: string;
  variaveis_disponiveis: string[];
  ativo: boolean;
}

interface TemplateFields {
  saudacao: string;
  mensagem_principal: string;
  mensagem_anexo: string;
  despedida: string;
  assinatura: string;
}

const tiposTemplate = [
  { value: 'novo_orcamento', label: 'Novo Orçamento' },
  { value: 'reenvio_orcamento', label: 'Reenvio de Orçamento' },
  { value: 'nova_fatura', label: 'Nova Fatura' },
  { value: 'reenvio_fatura', label: 'Reenvio de Fatura' },
  { value: 'fatura_liquidada', label: 'Fatura Liquidada' },
];

const defaultFields: TemplateFields = {
  saudacao: 'Olá,',
  mensagem_principal: 'Obrigado por entrar em contato com nossa empresa.',
  mensagem_anexo: 'O orçamento está em anexo.',
  despedida: 'Desde já agradeço a atenção.',
  assinatura: 'Atenciosamente,\nSua Empresa',
};

export default function EmailTemplates() {
  const [selectedTipo, setSelectedTipo] = useState<string>('novo_orcamento');
  const [fields, setFields] = useState<TemplateFields>(defaultFields);
  const [anexarPDF, setAnexarPDF] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (selectedTipo) {
      loadTemplateByTipo(selectedTipo);
    }
  }, [selectedTipo]);

  const parseHtmlToFields = (html: string): TemplateFields => {
    // Tenta extrair os campos do HTML salvo
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const paragraphs = tempDiv.querySelectorAll('p');
    
    if (paragraphs.length >= 4) {
      return {
        saudacao: paragraphs[0].textContent?.replace('{{cliente_nome}}', '').trim() || defaultFields.saudacao,
        mensagem_principal: paragraphs[1].textContent || defaultFields.mensagem_principal,
        mensagem_anexo: paragraphs[2].textContent || defaultFields.mensagem_anexo,
        despedida: paragraphs[3].textContent || defaultFields.despedida,
        assinatura: tempDiv.querySelector('div')?.textContent?.trim() || defaultFields.assinatura,
      };
    }
    
    return defaultFields;
  };

  const buildHtmlFromFields = (fields: TemplateFields): string => {
    return `<p>${fields.saudacao} <strong>{{cliente_nome}}</strong>,</p>

<p>${fields.mensagem_principal}</p>

<p>${fields.mensagem_anexo}</p>

<p>${fields.despedida}</p>

<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
  <p style="color: #6b7280; white-space: pre-line;">${fields.assinatura}</p>
</div>`;
  };

  const loadTemplateByTipo = async (tipo: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('user_id', user.id)
        .eq('tipo', tipo)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data && data.corpo_html) {
        setFields(parseHtmlToFields(data.corpo_html));
      } else {
        setFields(defaultFields);
      }
    } catch (error: any) {
      console.error('Erro ao carregar template:', error);
      toast.error('Erro ao carregar template');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!fields.saudacao || !fields.mensagem_principal) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const tipoLabel = tiposTemplate.find(t => t.value === selectedTipo)?.label || selectedTipo;
      const corpo_html = buildHtmlFromFields(fields);

      const templateData = {
        user_id: user.id,
        nome: tipoLabel,
        tipo: selectedTipo,
        assunto: `Seu Orçamento {{numero}}`,
        corpo_html,
        variaveis_disponiveis: ['numero', 'cliente_nome'],
        ativo: true,
      };

      const { error } = await supabase
        .from('email_templates')
        .upsert(templateData, {
          onConflict: 'user_id,tipo',
        });

      if (error) throw error;

      toast.success('Template salvo com sucesso!');
    } catch (error: any) {
      console.error('Erro ao salvar template:', error);
      toast.error('Erro ao salvar template');
    } finally {
      setSaving(false);
    }
  };

  const renderPreview = () => {
    const html = buildHtmlFromFields(fields);
    const previewHtml = html
      .replace(/{{numero}}/g, '<span style="background-color: #e0e7ff; color: #4338ca; padding: 2px 6px; border-radius: 3px; font-weight: 500;">Número do Orçamento</span>')
      .replace(/{{cliente_nome}}/g, '<span style="background-color: #e0e7ff; color: #4338ca; padding: 2px 6px; border-radius: 3px; font-weight: 500;">Nome do Cliente</span>');
    
    return { __html: previewHtml };
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Mail className="h-8 w-8" />
              Modelos de Email
            </h1>
            <p className="text-muted-foreground mt-1">
              Personalize os templates de email enviados para seus clientes
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Selecione o Tipo de Email</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedTipo} onValueChange={setSelectedTipo}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {tiposTemplate.map((tipo) => (
                  <SelectItem key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {!loading && (
          <Card>
            <CardHeader>
              <CardTitle>Personalize seu Template de Email</CardTitle>
              <CardDescription>
                Preencha os campos abaixo. As variáveis {'{numero}'} e {'{cliente_nome}'} serão substituídas automaticamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6">
                {/* Saudação */}
                <div className="space-y-2">
                  <Label htmlFor="saudacao">Saudação Inicial</Label>
                  <Input
                    id="saudacao"
                    value={fields.saudacao}
                    onChange={(e) => setFields({ ...fields, saudacao: e.target.value })}
                    placeholder="Ex: Olá,"
                  />
                  <p className="text-sm text-muted-foreground">
                    Será seguido automaticamente por: <strong>Nome do Cliente</strong>
                  </p>
                </div>

                {/* Mensagem Principal */}
                <div className="space-y-2">
                  <Label htmlFor="mensagem-principal">Mensagem Principal</Label>
                  <Textarea
                    id="mensagem-principal"
                    value={fields.mensagem_principal}
                    onChange={(e) => setFields({ ...fields, mensagem_principal: e.target.value })}
                    placeholder="Ex: Obrigado por entrar em contato com nossa empresa."
                    rows={2}
                  />
                </div>

                {/* Mensagem sobre Anexo */}
                <div className="space-y-2">
                  <Label htmlFor="mensagem-anexo">Mensagem sobre o Anexo</Label>
                  <Textarea
                    id="mensagem-anexo"
                    value={fields.mensagem_anexo}
                    onChange={(e) => setFields({ ...fields, mensagem_anexo: e.target.value })}
                    placeholder="Ex: O orçamento está em anexo."
                    rows={2}
                  />
                </div>

                {/* Despedida */}
                <div className="space-y-2">
                  <Label htmlFor="despedida">Despedida</Label>
                  <Input
                    id="despedida"
                    value={fields.despedida}
                    onChange={(e) => setFields({ ...fields, despedida: e.target.value })}
                    placeholder="Ex: Desde já agradeço a atenção."
                  />
                </div>

                {/* Assinatura */}
                <div className="space-y-2">
                  <Label htmlFor="assinatura">Assinatura da Empresa</Label>
                  <Textarea
                    id="assinatura"
                    value={fields.assinatura}
                    onChange={(e) => setFields({ ...fields, assinatura: e.target.value })}
                    placeholder="Ex: Atenciosamente,&#10;Sua Empresa"
                    rows={3}
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <Label>Pré-visualização</Label>
                <div 
                  className="border rounded-lg p-6 bg-muted/50 min-h-[200px]"
                  dangerouslySetInnerHTML={renderPreview()}
                />
              </div>

              {/* Anexar PDF */}
              <div className="flex items-center justify-between py-4 border-t">
                <Label htmlFor="anexar-pdf" className="text-base">
                  Anexar PDF do documento ao email
                </Label>
                <Switch 
                  id="anexar-pdf"
                  checked={anexarPDF} 
                  onCheckedChange={setAnexarPDF}
                />
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setFields(defaultFields)}
                >
                  Restaurar Padrão
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Salvando...' : 'Salvar Template'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
