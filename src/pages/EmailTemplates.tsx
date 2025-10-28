import { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Mail, 
  Save, 
  Bold, 
  Italic, 
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link,
  FileText,
  X
} from 'lucide-react';

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

const variaveisPorTipo: Record<string, Array<{nome: string, descricao: string}>> = {
  novo_orcamento: [
    { nome: 'numero', descricao: 'Nº do documento' },
    { nome: 'titulo', descricao: 'Título' },
    { nome: 'cliente_nome', descricao: 'Prénom du client' },
    { nome: 'status', descricao: 'Status' },
    { nome: 'validade_dias', descricao: 'Validade (dias)' },
    { nome: 'valor_total', descricao: 'Valor total' },
    { nome: 'link_documento', descricao: 'Link de consulta' },
  ],
  reenvio_orcamento: [
    { nome: 'numero', descricao: 'Nº do documento' },
    { nome: 'titulo', descricao: 'Título' },
    { nome: 'cliente_nome', descricao: 'Prénom du client' },
    { nome: 'status', descricao: 'Status' },
    { nome: 'validade_dias', descricao: 'Validade (dias)' },
    { nome: 'valor_total', descricao: 'Valor total' },
    { nome: 'link_documento', descricao: 'Link de consulta' },
  ],
  nova_fatura: [
    { nome: 'numero', descricao: 'Nº do documento' },
    { nome: 'titulo', descricao: 'Título' },
    { nome: 'cliente_nome', descricao: 'Prénom du client' },
    { nome: 'status', descricao: 'Status' },
    { nome: 'data_vencimento', descricao: 'Data vencimento' },
    { nome: 'forma_pagamento', descricao: 'Forma pagamento' },
    { nome: 'valor_total', descricao: 'Valor total' },
    { nome: 'link_documento', descricao: 'Link de consulta' },
  ],
  reenvio_fatura: [
    { nome: 'numero', descricao: 'Nº do documento' },
    { nome: 'titulo', descricao: 'Título' },
    { nome: 'cliente_nome', descricao: 'Prénom du client' },
    { nome: 'status', descricao: 'Status' },
    { nome: 'data_vencimento', descricao: 'Data vencimento' },
    { nome: 'valor_total', descricao: 'Valor total' },
    { nome: 'link_documento', descricao: 'Link de consulta' },
  ],
  fatura_liquidada: [
    { nome: 'numero', descricao: 'Nº do documento' },
    { nome: 'cliente_nome', descricao: 'Prénom du client' },
    { nome: 'data_pagamento', descricao: 'Data pagamento' },
    { nome: 'valor_total', descricao: 'Valor total' },
    { nome: 'forma_pagamento', descricao: 'Forma pagamento' },
  ],
};

export default function EmailTemplates() {
  const [selectedTipo, setSelectedTipo] = useState<string>('novo_orcamento');
  const [currentTemplate, setCurrentTemplate] = useState<Partial<EmailTemplate>>({
    nome: '',
    assunto: '',
    corpo_html: '',
  });
  const [anexarPDF, setAnexarPDF] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const assuntoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedTipo) {
      loadTemplateByTipo(selectedTipo);
    }
  }, [selectedTipo]);

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

      if (data) {
        setCurrentTemplate(data);
      } else {
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
    const tipoLabel = tiposTemplate.find(t => t.value === tipo)?.label || tipo;
    
    return {
      nome: tipoLabel,
      assunto: `Seu Orçamento {{numero}}`,
      corpo_html: `<p>Olá, <strong>{{cliente_nome}}</strong>,</p>

<p>Obrigado por entrar em contato com nossa empresa.</p>

<p>O orçamento está em anexo.</p>

<p>Desde já agradeço a atenção.</p>

<div style="margin-top: 30px;">
  <p style="color: #6b7280; font-style: italic;">Assinatura da empresa</p>
</div>`,
    };
  };

  const insertVariable = (variavel: string, isAssunto = false) => {
    const placeholder = `{{${variavel}}}`;
    
    if (isAssunto && assuntoRef.current) {
      const start = assuntoRef.current.selectionStart;
      const end = assuntoRef.current.selectionEnd;
      const text = currentTemplate.assunto || '';
      const newText = text.substring(0, start) + placeholder + text.substring(end);
      setCurrentTemplate({ ...currentTemplate, assunto: newText });
      
      setTimeout(() => {
        assuntoRef.current?.focus();
        assuntoRef.current?.setSelectionRange(start + placeholder.length, start + placeholder.length);
      }, 0);
    } else if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const text = currentTemplate.corpo_html || '';
      const newText = text.substring(0, start) + placeholder + text.substring(end);
      setCurrentTemplate({ ...currentTemplate, corpo_html: newText });
      
      setTimeout(() => {
        textareaRef.current?.focus();
        textareaRef.current?.setSelectionRange(start + placeholder.length, start + placeholder.length);
      }, 0);
    }
  };

  const wrapSelection = (tag: string) => {
    if (!textareaRef.current) return;
    
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = currentTemplate.corpo_html || '';
    const selectedText = text.substring(start, end);
    
    if (!selectedText) {
      toast.error('Selecione o texto primeiro');
      return;
    }
    
    const wrapped = `<${tag}>${selectedText}</${tag}>`;
    const newText = text.substring(0, start) + wrapped + text.substring(end);
    setCurrentTemplate({ ...currentTemplate, corpo_html: newText });
    
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(start, start + wrapped.length);
    }, 0);
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
        variaveis_disponiveis: variaveisPorTipo[selectedTipo]?.map(v => v.nome) || [],
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
    let html = currentTemplate.corpo_html || '';
    
    variaveisPorTipo[selectedTipo]?.forEach(v => {
      const regex = new RegExp(`{{${v.nome}}}`, 'g');
      html = html.replace(regex, `<span style="background-color: #e0e7ff; color: #4338ca; padding: 2px 6px; border-radius: 3px; font-weight: 500;">${v.descricao}</span>`);
    });
    
    return { __html: html };
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Modèle d'email "{currentTemplate.nome}"</CardTitle>
                  <CardDescription className="mt-1">
                    Edite o template com variáveis dinâmicas
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      + Données dynamiques
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {variaveisPorTipo[selectedTipo]?.map((v) => (
                      <DropdownMenuItem 
                        key={v.nome}
                        onClick={() => insertVariable(v.nome)}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        {v.descricao}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Barra de Ferramentas */}
              <div className="flex items-center gap-1 p-2 bg-muted rounded-lg border">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => wrapSelection('strong')}
                  title="Negrito"
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => wrapSelection('em')}
                  title="Itálico"
                >
                  <Italic className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => wrapSelection('u')}
                  title="Sublinhado"
                >
                  <Underline className="h-4 w-4" />
                </Button>
                
                <Separator orientation="vertical" className="h-6 mx-2" />
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  title="Alinhar à esquerda"
                >
                  <AlignLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  title="Centralizar"
                >
                  <AlignCenter className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  title="Alinhar à direita"
                >
                  <AlignRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Assunto */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="assunto">Objet de l'email</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        Variáveis
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {variaveisPorTipo[selectedTipo]?.map((v) => (
                        <DropdownMenuItem 
                          key={v.nome}
                          onClick={() => insertVariable(v.nome, true)}
                        >
                          {v.descricao}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <Input
                  ref={assuntoRef}
                  id="assunto"
                  value={currentTemplate.assunto || ''}
                  onChange={(e) => setCurrentTemplate({ ...currentTemplate, assunto: e.target.value })}
                  placeholder="Ex: Votre devis n° {{numero}}"
                  className="font-medium"
                />
              </div>

              <Tabs defaultValue="editor" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="editor">Editor</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
                
                <TabsContent value="editor" className="space-y-4">
                  <div className="space-y-2">
                    <Textarea
                      ref={textareaRef}
                      value={currentTemplate.corpo_html || ''}
                      onChange={(e) => setCurrentTemplate({ ...currentTemplate, corpo_html: e.target.value })}
                      placeholder="Digite o conteúdo do email..."
                      rows={18}
                      className="font-mono text-sm"
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="preview" className="space-y-4">
                  <div 
                    className="border rounded-lg p-6 bg-white min-h-[400px]"
                    dangerouslySetInnerHTML={renderPreview()}
                  />
                </TabsContent>
              </Tabs>

              {/* Anexar PDF */}
              <div className="flex items-center justify-between py-4 border-t">
                <Label htmlFor="anexar-pdf" className="text-base">
                  Joindre le PDF du document à l'email
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
                  onClick={() => loadTemplateByTipo(selectedTipo)}
                >
                  Annuler
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Salvando...' : 'Enregistrer'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
