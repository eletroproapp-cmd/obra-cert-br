import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Mail, Save, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EmailTemplate {
  id: string;
  nome: string;
  tipo: string;
  assunto: string;
  corpo_html: string;
  variaveis_disponiveis: string[];
  ativo: boolean;
}

const tiposTemplate = [
  { value: 'novo_orcamento', label: 'Novo Orçamento' },
  { value: 'reenvio_orcamento', label: 'Reenvio de Orçamento' },
  { value: 'nova_fatura', label: 'Nova Fatura' },
  { value: 'reenvio_fatura', label: 'Reenvio de Fatura' },
  { value: 'fatura_liquidada', label: 'Fatura Liquidada' },
];

const variaveisPorTipo: Record<string, string[]> = {
  novo_orcamento: ['numero', 'titulo', 'cliente_nome', 'status', 'validade_dias', 'descricao', 'tabela_itens', 'valor_total', 'observacoes'],
  reenvio_orcamento: ['numero', 'titulo', 'cliente_nome', 'status', 'validade_dias', 'descricao', 'tabela_itens', 'valor_total', 'observacoes'],
  nova_fatura: ['numero', 'titulo', 'cliente_nome', 'status', 'data_vencimento', 'forma_pagamento', 'descricao', 'tabela_itens', 'valor_total', 'observacoes'],
  reenvio_fatura: ['numero', 'titulo', 'cliente_nome', 'status', 'data_vencimento', 'forma_pagamento', 'descricao', 'tabela_itens', 'valor_total', 'observacoes'],
  fatura_liquidada: ['numero', 'titulo', 'cliente_nome', 'data_pagamento', 'valor_total', 'forma_pagamento'],
};

export default function EmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTipo, setSelectedTipo] = useState<string>('novo_orcamento');
  const [currentTemplate, setCurrentTemplate] = useState<Partial<EmailTemplate>>({
    nome: '',
    assunto: '',
    corpo_html: '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    if (selectedTipo) {
      loadTemplateByTipo(selectedTipo);
    }
  }, [selectedTipo]);

  const loadTemplates = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar templates:', error);
      toast.error('Erro ao carregar templates');
    }
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
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setCurrentTemplate(data);
      } else {
        // Criar template padrão se não existir
        const defaultTemplate = getDefaultTemplate(tipo);
        setCurrentTemplate(defaultTemplate);
      }
    } catch (error: any) {
      console.error('Erro ao carregar template:', error);
      toast.error('Erro ao carregar template');
    } finally {
      setLoading(false);
    }
  };

  const getDefaultTemplate = (tipo: string): Partial<EmailTemplate> => {
    const templates: Record<string, any> = {
      novo_orcamento: {
        nome: 'Novo Orçamento',
        assunto: 'Orçamento {{numero}} - {{titulo}}',
        corpo_html: `<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
  <h1 style="color: #333;">Orçamento {{numero}}</h1>
  <h2 style="color: #666;">{{titulo}}</h2>
  <div style="margin: 20px 0;">
    <p><strong>Cliente:</strong> {{cliente_nome}}</p>
    <p><strong>Status:</strong> {{status}}</p>
    <p><strong>Validade:</strong> {{validade_dias}} dias</p>
    <p><strong>Descrição:</strong> {{descricao}}</p>
  </div>
  <h3>Itens do Orçamento:</h3>
  {{tabela_itens}}
  <div style="text-align: right; margin: 20px 0;">
    <h2 style="color: #333;">Total: R$ {{valor_total}}</h2>
  </div>
  <div style="margin: 20px 0; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #333;">
    <strong>Observações:</strong>
    <p>{{observacoes}}</p>
  </div>
  <p style="color: #666; font-size: 12px; margin-top: 40px;">
    Este é um e-mail automático. Para mais informações, entre em contato conosco.
  </p>
</div>`,
      },
      reenvio_orcamento: {
        nome: 'Reenvio de Orçamento',
        assunto: 'Lembrete: Orçamento {{numero}} - {{titulo}}',
        corpo_html: `<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
  <h1 style="color: #333;">Lembrete: Orçamento {{numero}}</h1>
  <p>Prezado(a) {{cliente_nome}},</p>
  <p>Gostaríamos de saber se você teve a oportunidade de analisar nosso orçamento.</p>
  <h2 style="color: #666;">{{titulo}}</h2>
  <div style="margin: 20px 0;">
    <p><strong>Status:</strong> {{status}}</p>
    <p><strong>Validade:</strong> {{validade_dias}} dias</p>
  </div>
  {{tabela_itens}}
  <div style="text-align: right; margin: 20px 0;">
    <h2 style="color: #333;">Total: R$ {{valor_total}}</h2>
  </div>
  <p style="margin-top: 20px;">Estamos à disposição para esclarecer qualquer dúvida.</p>
</div>`,
      },
      nova_fatura: {
        nome: 'Nova Fatura',
        assunto: 'Fatura {{numero}} - {{titulo}}',
        corpo_html: `<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
  <h1 style="color: #333;">Fatura {{numero}}</h1>
  <h2 style="color: #666;">{{titulo}}</h2>
  <div style="margin: 20px 0;">
    <p><strong>Cliente:</strong> {{cliente_nome}}</p>
    <p><strong>Status:</strong> {{status}}</p>
    <p><strong>Vencimento:</strong> {{data_vencimento}}</p>
    <p><strong>Forma de Pagamento:</strong> {{forma_pagamento}}</p>
  </div>
  {{tabela_itens}}
  <div style="text-align: right; margin: 20px 0;">
    <h2 style="color: #333;">Total: R$ {{valor_total}}</h2>
  </div>
  <div style="margin: 30px 0; padding: 15px; background-color: #fff3cd; border-left: 4px solid #ffc107;">
    <strong>⚠️ Atenção:</strong>
    <p>Pagamento deve ser realizado até {{data_vencimento}}</p>
  </div>
</div>`,
      },
      reenvio_fatura: {
        nome: 'Reenvio de Fatura',
        assunto: 'Lembrete: Fatura {{numero}} - Vencimento {{data_vencimento}}',
        corpo_html: `<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
  <h1 style="color: #d32f2f;">Lembrete: Fatura {{numero}}</h1>
  <p>Prezado(a) {{cliente_nome}},</p>
  <p>Informamos que a fatura abaixo ainda está <strong>{{status}}</strong>.</p>
  <div style="margin: 20px 0; padding: 15px; background-color: #ffebee; border-left: 4px solid #d32f2f;">
    <strong>⚠️ Vencimento:</strong> {{data_vencimento}}
  </div>
  {{tabela_itens}}
  <div style="text-align: right; margin: 20px 0;">
    <h2 style="color: #333;">Total: R$ {{valor_total}}</h2>
  </div>
  <p>Para evitar multas e juros, solicitamos que o pagamento seja efetuado o mais breve possível.</p>
</div>`,
      },
      fatura_liquidada: {
        nome: 'Fatura Liquidada',
        assunto: 'Pagamento Confirmado - Fatura {{numero}}',
        corpo_html: `<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
  <h1 style="color: #2e7d32;">✓ Pagamento Confirmado</h1>
  <p>Prezado(a) {{cliente_nome}},</p>
  <p>Confirmamos o recebimento do pagamento da fatura <strong>{{numero}}</strong>.</p>
  <div style="margin: 20px 0; padding: 15px; background-color: #e8f5e9; border-left: 4px solid #2e7d32;">
    <p><strong>Data de Pagamento:</strong> {{data_pagamento}}</p>
    <p><strong>Valor:</strong> R$ {{valor_total}}</p>
    <p><strong>Forma de Pagamento:</strong> {{forma_pagamento}}</p>
  </div>
  <p style="margin-top: 20px;">Agradecemos pela sua preferência!</p>
</div>`,
      },
    };

    return templates[tipo] || templates.novo_orcamento;
  };

  const handleSave = async () => {
    if (!currentTemplate.nome || !currentTemplate.assunto || !currentTemplate.corpo_html) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const templateData = {
        user_id: user.id,
        nome: currentTemplate.nome,
        tipo: selectedTipo,
        assunto: currentTemplate.assunto,
        corpo_html: currentTemplate.corpo_html,
        variaveis_disponiveis: variaveisPorTipo[selectedTipo],
        ativo: true,
      };

      const { error } = await supabase
        .from('email_templates')
        .upsert(templateData, {
          onConflict: 'user_id,tipo',
        });

      if (error) throw error;

      toast.success('Template salvo com sucesso!');
      loadTemplates();
    } catch (error: any) {
      console.error('Erro ao salvar template:', error);
      toast.error('Erro ao salvar template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
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

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Configure o Resend:</strong> Para enviar emails, você precisa configurar a chave RESEND_API_KEY.
            Crie uma conta em <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="underline">resend.com</a> e 
            adicione sua chave API nas configurações do projeto.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Selecione o Tipo de Email</CardTitle>
            <CardDescription>
              Escolha o tipo de email que deseja editar
            </CardDescription>
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
              <CardTitle>Editar Template</CardTitle>
              <CardDescription>
                Variáveis disponíveis: {variaveisPorTipo[selectedTipo]?.map(v => `{{${v}}}`).join(', ')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Template</Label>
                <Input
                  id="nome"
                  value={currentTemplate.nome || ''}
                  onChange={(e) => setCurrentTemplate({ ...currentTemplate, nome: e.target.value })}
                  placeholder="Ex: Novo Orçamento"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assunto">Assunto do Email</Label>
                <Input
                  id="assunto"
                  value={currentTemplate.assunto || ''}
                  onChange={(e) => setCurrentTemplate({ ...currentTemplate, assunto: e.target.value })}
                  placeholder="Ex: Orçamento {{numero}} - {{titulo}}"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="corpo">Corpo do Email (HTML)</Label>
                <Textarea
                  id="corpo"
                  value={currentTemplate.corpo_html || ''}
                  onChange={(e) => setCurrentTemplate({ ...currentTemplate, corpo_html: e.target.value })}
                  placeholder="Cole aqui o HTML do email..."
                  rows={20}
                  className="font-mono text-sm"
                />
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Salvando...' : 'Salvar Template'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
