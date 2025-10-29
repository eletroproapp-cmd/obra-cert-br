import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Building2, DollarSign, FileText, Settings as SettingsIcon, Save, Crown, Palette, Upload, Eye, EyeOff, Gift, Download } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { validarCNPJ, formatarCNPJ, formatarCPFouCNPJ } from "@/utils/validators";
import { PlansTab } from "@/components/subscription/PlansTab";
import { ReferralSection } from "@/components/configuracoes/ReferralSection";
import { useSearchParams } from "react-router-dom";

interface EmpresaData {
  tipo_pessoa: string;
  nome_fantasia: string;
  razao_social: string;
  cnpj: string;
  inscricao_estadual: string;
  inscricao_municipal: string;
  regime_tributario: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  telefone: string;
  email: string;
  website: string;
  chave_pix: string;
  logo_url: string;
  logo_position: string;
  slogan: string;
  cor_primaria: string;
  cor_secundaria: string;
  cor_borda_secoes: string;
  cor_borda_linhas: string;
  observacoes_padrao: string;
  termos_condicoes: string;
  certificado_digital_tipo: string;
  certificado_digital_validade: string;
  ambiente_nfe: string;
  serie_nfe: string;
  proximo_numero_nfe: number;
  proximo_numero_orcamento: number;
  proximo_numero_fatura: number;
  template_orcamento: string;
  template_fatura: string;
  fonte_documento: string;
  tamanho_fonte: number;
  estilo_borda: string;
  mostrar_logo: boolean;
  mostrar_nome_fantasia: boolean;
  mostrar_razao_social: boolean;
  mostrar_cnpj: boolean;
  mostrar_endereco: boolean;
  mostrar_telefone: boolean;
  mostrar_email: boolean;
  mostrar_website: boolean;
  mostrar_regime_tributario: boolean;
  mostrar_inscricao_estadual: boolean;
  mostrar_inscricao_municipal: boolean;
}

const Configuracoes = () => {
  const [loading, setLoading] = useState(false);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const { register, handleSubmit, reset, setValue, watch } = useForm<EmpresaData>();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'empresa';
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);

  const evaluatePassword = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    // optional special char could add more score, but we limit to 4 bars
    return Math.min(score, 4);
  };

  // Watch form values for live preview
  const formData = watch();

  useEffect(() => {
    loadEmpresa();
  }, []);

  const loadEmpresa = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setEmpresaId(data.id);
        reset(data);
      }
    } catch (error: any) {
      console.error('Erro ao carregar empresa:', error);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-logo-${Date.now()}.${fileExt}`;
      const filePath = `logos/${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('company-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('company-assets')
        .getPublicUrl(filePath);

      setValue('logo_url', publicUrl);
      toast.success('Logo enviado com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao enviar logo: ' + error.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const onSubmit = async (data: EmpresaData) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      if (empresaId) {
        const { error } = await supabase
          .from('empresas')
          .update(data)
          .eq('id', empresaId);
        
        if (error) throw error;
        toast.success('Dados da empresa atualizados com sucesso!');
      } else {
        const { data: newEmpresa, error } = await supabase
          .from('empresas')
          .insert([{ ...data, user_id: user.id }])
          .select()
          .single();
        
        if (error) throw error;
        setEmpresaId(newEmpresa.id);
        toast.success('Empresa cadastrada com sucesso!');
      }
    } catch (error: any) {
      toast.error('Erro ao salvar dados: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Configurações</h1>
          <p className="text-muted-foreground">Gerencie as informações da sua empresa e preferências do sistema</p>
        </div>

        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
            <TabsTrigger value="empresa">
              <Building2 className="mr-2 h-4 w-4" />
              Minha Empresa
            </TabsTrigger>
            <TabsTrigger value="plano">
              <Crown className="mr-2 h-4 w-4" />
              Plano
            </TabsTrigger>
            <TabsTrigger value="indicacoes">
              <Gift className="mr-2 h-4 w-4" />
              Indicações
            </TabsTrigger>
            <TabsTrigger value="financeiro">
              <DollarSign className="mr-2 h-4 w-4" />
              Financeiro
            </TabsTrigger>
            <TabsTrigger value="documentos">
              <FileText className="mr-2 h-4 w-4" />
              Documentos
            </TabsTrigger>
            <TabsTrigger value="sistema">
              <SettingsIcon className="mr-2 h-4 w-4" />
              Sistema
            </TabsTrigger>
          </TabsList>

          <TabsContent value="plano">
            <PlansTab />
          </TabsContent>

          <TabsContent value="indicacoes">
            <ReferralSection />
          </TabsContent>

          <form onSubmit={handleSubmit(onSubmit)}>
            <TabsContent value="empresa" className="space-y-6">
              <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Logo da Empresa</CardTitle>
                      <CardDescription>Adicione o logo que aparecerá nos documentos</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4">
                        {formData.logo_url && (
                          <div className="w-32 h-32 border rounded-lg overflow-hidden flex items-center justify-center bg-muted">
                            <img src={formData.logo_url} alt="Logo" className="max-w-full max-h-full object-contain" />
                          </div>
                        )}
                        <div className="flex-1 space-y-2">
                          <Label htmlFor="logo">Carregar Logo</Label>
                          <Input
                            id="logo"
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            disabled={uploadingLogo}
                          />
                          <p className="text-xs text-muted-foreground">
                            {uploadingLogo ? 'Enviando...' : 'Formatos: PNG, JPG, WEBP (máx. 2MB)'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="logo_position">Posição da Logo no Documento</Label>
                        <Select 
                          value={formData.logo_position || 'center'}
                          onValueChange={(value) => setValue('logo_position', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a posição" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="left">Esquerda</SelectItem>
                            <SelectItem value="center">Centro</SelectItem>
                            <SelectItem value="right">Direita</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Informações Gerais</CardTitle>
                      <CardDescription>Dados básicos e controle de visibilidade</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="tipo_pessoa">Tipo de Pessoa *</Label>
                          <Select 
                            value={formData.tipo_pessoa || 'juridica'}
                            onValueChange={(value) => setValue('tipo_pessoa', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fisica">Pessoa Física (CPF)</SelectItem>
                              <SelectItem value="juridica">Pessoa Jurídica (CNPJ)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="nome_fantasia">
                              {formData.tipo_pessoa === 'fisica' ? 'Nome Completo *' : 'Nome Fantasia *'}
                            </Label>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-2">
                                    <Switch
                                      checked={formData.mostrar_nome_fantasia !== false}
                                      onCheckedChange={(checked) => setValue('mostrar_nome_fantasia', checked)}
                                    />
                                    {formData.mostrar_nome_fantasia !== false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Mostrar/ocultar nos documentos</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <Input 
                            id="nome_fantasia" 
                            {...register('nome_fantasia')} 
                            required 
                            placeholder={formData.tipo_pessoa === 'fisica' ? 'Nome completo' : 'Nome fantasia da empresa'}
                          />
                        </div>

                        {formData.tipo_pessoa === 'juridica' && (
                          <div className="space-y-2">
                            <Label htmlFor="slogan">Slogan</Label>
                            <Input id="slogan" {...register('slogan')} placeholder="Seu slogan aqui" />
                          </div>
                        )}

                        {formData.tipo_pessoa === 'juridica' && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="razao_social">Razão Social</Label>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-2">
                                      <Switch
                                        checked={formData.mostrar_razao_social !== false}
                                        onCheckedChange={(checked) => setValue('mostrar_razao_social', checked)}
                                      />
                                      {formData.mostrar_razao_social !== false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Mostrar/ocultar nos documentos</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <Input id="razao_social" {...register('razao_social')} />
                          </div>
                        )}

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="cnpj">
                              {formData.tipo_pessoa === 'fisica' ? 'CPF' : 'CNPJ'}
                            </Label>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-2">
                                    <Switch
                                      checked={formData.mostrar_cnpj !== false}
                                      onCheckedChange={(checked) => setValue('mostrar_cnpj', checked)}
                                    />
                                    {formData.mostrar_cnpj !== false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Mostrar/ocultar nos documentos</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <Input 
                            id="cnpj" 
                            {...register('cnpj')} 
                            placeholder={formData.tipo_pessoa === 'fisica' ? '000.000.000-00' : '00.000.000/0000-00'}
                            onChange={(e) => {
                              const formatted = formatarCPFouCNPJ(e.target.value);
                              e.target.value = formatted;
                            }}
                          />
                        </div>

                        {formData.tipo_pessoa === 'juridica' && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="regime_tributario">Regime Tributário</Label>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-2">
                                      <Switch
                                        checked={formData.mostrar_regime_tributario !== false}
                                        onCheckedChange={(checked) => setValue('mostrar_regime_tributario', checked)}
                                      />
                                      {formData.mostrar_regime_tributario !== false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Mostrar/ocultar nos documentos</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <Select defaultValue="Simples Nacional" onValueChange={(value) => setValue('regime_tributario', value)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o regime" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Simples Nacional">Simples Nacional</SelectItem>
                                <SelectItem value="Lucro Presumido">Lucro Presumido</SelectItem>
                                <SelectItem value="Lucro Real">Lucro Real</SelectItem>
                                <SelectItem value="MEI">MEI</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {formData.tipo_pessoa === 'juridica' && (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label htmlFor="inscricao_estadual">Inscrição Estadual</Label>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center gap-2">
                                        <Switch
                                          checked={formData.mostrar_inscricao_estadual !== false}
                                          onCheckedChange={(checked) => setValue('mostrar_inscricao_estadual', checked)}
                                        />
                                        {formData.mostrar_inscricao_estadual !== false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Mostrar/ocultar nos documentos</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                              <Input id="inscricao_estadual" {...register('inscricao_estadual')} />
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label htmlFor="inscricao_municipal">Inscrição Municipal</Label>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center gap-2">
                                        <Switch
                                          checked={formData.mostrar_inscricao_municipal !== false}
                                          onCheckedChange={(checked) => setValue('mostrar_inscricao_municipal', checked)}
                                        />
                                        {formData.mostrar_inscricao_municipal !== false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Mostrar/ocultar nos documentos</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                              <Input id="inscricao_municipal" {...register('inscricao_municipal')} />
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Endereço e Contato</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="endereco">Endereço</Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={formData.mostrar_endereco !== false}
                                    onCheckedChange={(checked) => setValue('mostrar_endereco', checked)}
                                  />
                                  {formData.mostrar_endereco !== false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Mostrar/ocultar nos documentos</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <Input id="endereco" {...register('endereco')} />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="cidade">Cidade</Label>
                          <Input id="cidade" {...register('cidade')} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="estado">Estado</Label>
                          <Input id="estado" {...register('estado')} maxLength={2} placeholder="SP" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cep">CEP</Label>
                          <Input id="cep" {...register('cep')} placeholder="00000-000" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="telefone">Telefone</Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={formData.mostrar_telefone !== false}
                                    onCheckedChange={(checked) => setValue('mostrar_telefone', checked)}
                                  />
                                  {formData.mostrar_telefone !== false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Mostrar/ocultar nos documentos</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <Input id="telefone" {...register('telefone')} placeholder="(00) 00000-0000" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="email">E-mail (para envio de orçamentos e faturas)</Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={formData.mostrar_email !== false}
                                    onCheckedChange={(checked) => setValue('mostrar_email', checked)}
                                  />
                                  {formData.mostrar_email !== false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Mostrar/ocultar nos documentos</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <Input 
                          id="email" 
                          type="email" 
                          {...register('email')} 
                          placeholder="Deixe vazio para usar email padrão (recomendado)"
                        />
                        <p className="text-xs text-muted-foreground">
                          <strong>Deixe vazio:</strong> Usa email padrão do sistema (funciona sem configuração)<br/>
                          <strong>Email próprio:</strong> Você precisa verificar seu domínio em <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">resend.com/domains</a>
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="website">Website</Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={formData.mostrar_website !== false}
                                    onCheckedChange={(checked) => setValue('mostrar_website', checked)}
                                  />
                                  {formData.mostrar_website !== false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Mostrar/ocultar nos documentos</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <Input id="website" {...register('website')} placeholder="https://..." />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="chave_pix">Chave PIX (para QR Code em faturas)</Label>
                        <Input 
                          id="chave_pix" 
                          {...register('chave_pix')} 
                          placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória" 
                        />
                        <p className="text-xs text-muted-foreground">
                          A chave PIX será usada para gerar o QR Code de pagamento nas faturas
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-end">
                    <Button type="submit" size="lg" disabled={loading}>
                      <Save className="mr-2 h-4 w-4" />
                      {loading ? 'Salvando...' : 'Salvar Configurações'}
                    </Button>
                  </div>
              </div>
            </TabsContent>

            <TabsContent value="financeiro" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Nota Fiscal Eletrônica (NF-e)</CardTitle>
                  <CardDescription>Configure a emissão de NF-e</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="certificado_digital_tipo">Certificado Digital</Label>
                      <Select 
                        defaultValue="nenhum" 
                        onValueChange={(value) => setValue('certificado_digital_tipo', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nenhum">Nenhum</SelectItem>
                          <SelectItem value="A1">A1 (arquivo digital)</SelectItem>
                          <SelectItem value="A3">A3 (token/cartão)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="certificado_digital_validade">Validade do Certificado</Label>
                      <Input 
                        id="certificado_digital_validade" 
                        type="date" 
                        {...register('certificado_digital_validade')} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ambiente_nfe">Ambiente NF-e</Label>
                      <Select 
                        defaultValue="homologacao" 
                        onValueChange={(value) => setValue('ambiente_nfe', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o ambiente" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="homologacao">Homologação (Testes)</SelectItem>
                          <SelectItem value="producao">Produção</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="serie_nfe">Série NF-e</Label>
                      <Input 
                        id="serie_nfe" 
                        {...register('serie_nfe')} 
                        defaultValue="1" 
                        placeholder="1" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="proximo_numero_nfe">Próximo Número NF-e</Label>
                      <Input 
                        id="proximo_numero_nfe" 
                        type="number" 
                        {...register('proximo_numero_nfe')} 
                        defaultValue={1}
                      />
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted p-4 mt-4">
                    <p className="text-sm text-muted-foreground">
                      <strong>Atenção:</strong> Para emitir NF-e em produção, você precisa de um certificado digital válido (A1 ou A3) 
                      emitido por uma Autoridade Certificadora credenciada pela ICP-Brasil. Use o ambiente de homologação para testes.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Impostos e Taxas</CardTitle>
                  <CardDescription>Configure as alíquotas de impostos</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Funcionalidade em desenvolvimento. Em breve você poderá configurar ICMS, ISS, PIS e COFINS.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documentos" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Configurações */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Numeração de Documentos</CardTitle>
                      <CardDescription>
                        Configure o próximo número que será usado para orçamentos e faturas
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="proximo_numero_orcamento">Próximo Número - Orçamento</Label>
                          <Input 
                            id="proximo_numero_orcamento" 
                            type="number" 
                            {...register('proximo_numero_orcamento')} 
                            defaultValue={1}
                            min={1}
                          />
                          <p className="text-xs text-muted-foreground">
                            Próximo orçamento será: ORC-2025-{String(formData.proximo_numero_orcamento || 1).padStart(3, '0')}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="proximo_numero_fatura">Próximo Número - Fatura</Label>
                          <Input 
                            id="proximo_numero_fatura" 
                            type="number" 
                            {...register('proximo_numero_fatura')} 
                            defaultValue={1}
                            min={1}
                          />
                          <p className="text-xs text-muted-foreground">
                            Próxima fatura será: FAT-2025-{String(formData.proximo_numero_fatura || 1).padStart(3, '0')}
                          </p>
                        </div>
                      </div>
                      <div className="rounded-lg bg-muted p-4 mt-4">
                        <p className="text-sm text-muted-foreground">
                          <strong>Atenção:</strong> Altere estes números apenas se necessário. O sistema incrementa automaticamente a cada novo documento criado.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Palette className="h-5 w-5" />
                        Aparência dos Documentos
                      </CardTitle>
                      <CardDescription>
                        Personalize cores, fontes e estilo visual dos orçamentos e faturas em PDF
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="fonte_documento">Fonte do Documento</Label>
                          <Select 
                            value={formData.fonte_documento || 'Arial'}
                            onValueChange={(value) => setValue('fonte_documento', value)}
                          >
                            <SelectTrigger id="fonte_documento">
                              <SelectValue placeholder="Selecione a fonte" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Arial">Arial</SelectItem>
                              <SelectItem value="Helvetica">Helvetica</SelectItem>
                              <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                              <SelectItem value="Courier">Courier</SelectItem>
                              <SelectItem value="Verdana">Verdana</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="tamanho_fonte">Tamanho da Fonte</Label>
                          <Select 
                            value={String(formData.tamanho_fonte || 12)}
                            onValueChange={(value) => setValue('tamanho_fonte', parseInt(value))}
                          >
                            <SelectTrigger id="tamanho_fonte">
                              <SelectValue placeholder="Selecione o tamanho" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="10">10pt</SelectItem>
                              <SelectItem value="11">11pt</SelectItem>
                              <SelectItem value="12">12pt (Padrão)</SelectItem>
                              <SelectItem value="14">14pt</SelectItem>
                              <SelectItem value="16">16pt</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="estilo_borda">Estilo de Borda</Label>
                          <Select 
                            value={formData.estilo_borda || 'simples'}
                            onValueChange={(value) => setValue('estilo_borda', value)}
                          >
                            <SelectTrigger id="estilo_borda">
                              <SelectValue placeholder="Selecione o estilo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="simples">Simples</SelectItem>
                              <SelectItem value="dupla">Dupla</SelectItem>
                              <SelectItem value="arredondada">Arredondada</SelectItem>
                              <SelectItem value="sem_borda">Sem Borda</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="cor_primaria">Cor Principal (Cabeçalhos/Destaque)</Label>
                          <div className="flex gap-2">
                            <Input 
                              id="cor_primaria" 
                              type="color" 
                              {...register('cor_primaria')} 
                              defaultValue={formData.cor_primaria || '#6366F1'}
                              className="w-20 h-10"
                            />
                            <Input 
                              type="text" 
                              value={formData.cor_primaria || '#6366F1'}
                              onChange={(e) => setValue('cor_primaria', e.target.value)}
                              placeholder="#6366F1"
                              className="flex-1"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Usada em títulos, cabeçalhos de tabelas e botões
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="cor_secundaria">Cor Secundária (Fundos Alternados)</Label>
                          <div className="flex gap-2">
                            <Input 
                              id="cor_secundaria" 
                              type="color" 
                              {...register('cor_secundaria')} 
                              defaultValue={formData.cor_secundaria || '#E5E7EB'}
                              className="w-20 h-10"
                            />
                            <Input 
                              type="text" 
                              value={formData.cor_secundaria || '#E5E7EB'}
                              onChange={(e) => setValue('cor_secundaria', e.target.value)}
                              placeholder="#E5E7EB"
                              className="flex-1"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Usada em fundos alternados de tabelas
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="cor_borda_secoes">Cor de Bordas de Seções</Label>
                          <div className="flex gap-2">
                            <Input 
                              id="cor_borda_secoes" 
                              type="color" 
                              {...register('cor_borda_secoes')} 
                              defaultValue={formData.cor_borda_secoes || '#E5E7EB'}
                              className="w-20 h-10"
                            />
                            <Input 
                              type="text" 
                              value={formData.cor_borda_secoes || '#E5E7EB'}
                              onChange={(e) => setValue('cor_borda_secoes', e.target.value)}
                              placeholder="#E5E7EB"
                              className="flex-1"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Usada em bordas principais e divisórias de seções
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="cor_borda_linhas">Cor de Bordas de Linhas</Label>
                          <div className="flex gap-2">
                            <Input 
                              id="cor_borda_linhas" 
                              type="color" 
                              {...register('cor_borda_linhas')} 
                              defaultValue={formData.cor_borda_linhas || '#E5E7EB'}
                              className="w-20 h-10"
                            />
                            <Input 
                              type="text" 
                              value={formData.cor_borda_linhas || '#E5E7EB'}
                              onChange={(e) => setValue('cor_borda_linhas', e.target.value)}
                              placeholder="#E5E7EB"
                              className="flex-1"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Usada em bordas de linhas de tabelas
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="mostrar_logo">Logotipo EletroPro</Label>
                          <div className="flex items-center space-x-2 pt-2">
                            <Switch
                              id="mostrar_logo"
                              defaultChecked={true}
                              onCheckedChange={(checked) => setValue('mostrar_logo', checked)}
                            />
                            <Label htmlFor="mostrar_logo" className="font-normal cursor-pointer">
                              Mostrar logo nos documentos
                            </Label>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            ⭐ Remover o logo está disponível apenas em planos pagos
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column - Visualização do Documento */}
                <div className="lg:sticky lg:top-6 lg:self-start">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Visualização do Documento
                      </CardTitle>
                      <CardDescription>
                        Pré-visualização em tempo real de como os dados aparecerão nos PDFs
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div 
                        className="bg-white rounded-lg p-6 space-y-4 min-h-[600px]" 
                        style={{ 
                          border: `2px ${formData.estilo_borda === 'dupla' ? 'double' : formData.estilo_borda === 'sem_borda' ? 'none' : 'solid'} ${formData.cor_borda_secoes || formData.cor_primaria || '#6366F1'}`,
                          borderRadius: formData.estilo_borda === 'arredondada' ? '12px' : '8px',
                          fontFamily: formData.fonte_documento || 'Arial',
                          fontSize: `${formData.tamanho_fonte || 12}pt`
                        }}
                      >
                        {/* Logo e Nome da Empresa - Layout baseado na posição */}
                        {formData.logo_url && formData.mostrar_logo !== false ? (
                          <div 
                            className={`pb-4 ${
                              formData.logo_position === 'left' ? 'flex items-start gap-4' :
                              formData.logo_position === 'right' ? 'flex items-start gap-4 flex-row-reverse' :
                              'flex flex-col items-center'
                            }`}
                            style={{ borderBottom: `2px solid ${formData.cor_borda_secoes || '#E5E7EB'}` }}
                          >
                            <img 
                              src={formData.logo_url} 
                              alt="Logo Preview" 
                              className="h-16 object-contain flex-shrink-0" 
                            />
                            
                            {/* Nome da empresa ao lado da logo quando não está no centro */}
                            {(formData.logo_position === 'left' || formData.logo_position === 'right') && (
                              <div className="flex-1">
                                {formData.mostrar_nome_fantasia !== false && formData.nome_fantasia && (
                                  <h2 className="text-2xl font-bold" style={{ color: formData.cor_primaria || '#6366F1' }}>
                                    {formData.nome_fantasia}
                                  </h2>
                                )}
                                {formData.slogan && formData.tipo_pessoa === 'juridica' && (
                                  <p className="text-sm italic text-muted-foreground">{formData.slogan}</p>
                                )}
                              </div>
                            )}
                            
                            {/* Nome da empresa abaixo quando logo está no centro */}
                            {formData.logo_position === 'center' && (
                              <div className="text-center">
                                {formData.mostrar_nome_fantasia !== false && formData.nome_fantasia && (
                                  <h2 className="text-2xl font-bold" style={{ color: formData.cor_primaria || '#6366F1' }}>
                                    {formData.nome_fantasia}
                                  </h2>
                                )}
                                {formData.slogan && formData.tipo_pessoa === 'juridica' && (
                                  <p className="text-sm italic text-muted-foreground">{formData.slogan}</p>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          /* Apenas nome da empresa quando não tem logo */
                          formData.mostrar_nome_fantasia !== false && formData.nome_fantasia && (
                            <div className="pb-4" style={{ borderBottom: `2px solid ${formData.cor_borda_secoes || '#E5E7EB'}` }}>
                              <h2 className="text-2xl font-bold" style={{ color: formData.cor_primaria || '#6366F1' }}>
                                {formData.nome_fantasia}
                              </h2>
                              {formData.slogan && formData.tipo_pessoa === 'juridica' && (
                                <p className="text-sm italic text-muted-foreground">{formData.slogan}</p>
                              )}
                            </div>
                          )
                        )}

                        {/* Company Info Preview */}
                        <div className="space-y-2">
                          {formData.mostrar_razao_social !== false && formData.razao_social && formData.tipo_pessoa === 'juridica' && (
                            <p className="text-sm"><strong>Razão Social:</strong> {formData.razao_social}</p>
                          )}
                          {formData.mostrar_cnpj !== false && formData.cnpj && (
                            <p className="text-sm"><strong>{formData.tipo_pessoa === 'fisica' ? 'CPF' : 'CNPJ'}:</strong> {formData.cnpj}</p>
                          )}
                          {formData.tipo_pessoa === 'juridica' && formData.mostrar_regime_tributario !== false && formData.regime_tributario && (
                            <p className="text-sm"><strong>Regime:</strong> {formData.regime_tributario}</p>
                          )}
                          {formData.tipo_pessoa === 'juridica' && formData.mostrar_inscricao_estadual !== false && formData.inscricao_estadual && (
                            <p className="text-sm"><strong>IE:</strong> {formData.inscricao_estadual}</p>
                          )}
                          {formData.tipo_pessoa === 'juridica' && formData.mostrar_inscricao_municipal !== false && formData.inscricao_municipal && (
                            <p className="text-sm"><strong>IM:</strong> {formData.inscricao_municipal}</p>
                          )}
                        </div>

                        <Separator />

                        {/* Contact Info Preview */}
                        <div className="space-y-1 text-sm">
                          {formData.mostrar_endereco !== false && formData.endereco && (
                            <p>📍 {formData.endereco}{formData.cidade && `, ${formData.cidade}`}{formData.estado && ` - ${formData.estado}`}</p>
                          )}
                          {formData.mostrar_telefone !== false && formData.telefone && (
                            <p>📞 {formData.telefone}</p>
                          )}
                          {formData.mostrar_email !== false && formData.email && (
                            <p>✉️ {formData.email}</p>
                          )}
                          {formData.mostrar_website !== false && formData.website && (
                            <p>🌐 {formData.website}</p>
                          )}
                        </div>

                        <Separator />

                        {/* Sample Document Content */}
                        <div className="space-y-3">
                          <h3 className="font-bold text-lg" style={{ color: formData.cor_primaria || '#6366F1' }}>
                            ORÇAMENTO Nº ORC-2025-{String(formData.proximo_numero_orcamento || 1).padStart(3, '0')}
                          </h3>
                          <p className="text-sm text-muted-foreground">Data: {new Date().toLocaleDateString('pt-BR')}</p>
                          
                          <div className="p-3 rounded" style={{ 
                            border: `1px solid ${formData.cor_borda_secoes || '#E5E7EB'}`,
                            backgroundColor: `${formData.cor_secundaria || '#E5E7EB'}20`
                          }}>
                            <p className="text-sm font-semibold mb-2">Cliente: João Silva</p>
                            <p className="text-xs text-muted-foreground">exemplo@cliente.com.br</p>
                          </div>

                          <div className="rounded overflow-hidden" style={{ border: `1px solid ${formData.cor_borda_linhas || '#E5E7EB'}` }}>
                            <div className="p-2 text-xs font-semibold text-white" style={{ backgroundColor: formData.cor_primaria || '#6366F1' }}>
                              ITENS DO ORÇAMENTO
                            </div>
                            <div className="space-y-1 text-xs p-2">
                              <div className="flex justify-between p-1" style={{ 
                                backgroundColor: `${formData.cor_secundaria || '#E5E7EB'}10`,
                                borderBottom: `1px solid ${formData.cor_borda_linhas || '#E5E7EB'}`
                              }}>
                                <span>1. Instalação elétrica completa</span>
                                <span>R$ 5.000,00</span>
                              </div>
                              <div className="flex justify-between p-1" style={{ 
                                borderBottom: `1px solid ${formData.cor_borda_linhas || '#E5E7EB'}`
                              }}>
                                <span>2. Material elétrico</span>
                                <span>R$ 2.500,00</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end">
                            <div className="rounded px-4 py-2 text-white" style={{ backgroundColor: formData.cor_primaria || '#6366F1' }}>
                              <div className="flex justify-between items-center gap-4">
                                <span className="text-sm font-semibold">TOTAL:</span>
                                <span className="text-lg font-bold">R$ 7.500,00</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" size="lg" disabled={loading}>
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? 'Salvando...' : 'Salvar Configurações'}
                </Button>
              </div>
            </TabsContent>
          </form>

          <TabsContent value="sistema" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notificações por Email</CardTitle>
                <CardDescription>Controle quando você deseja receber emails</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Novos Orçamentos</Label>
                    <p className="text-sm text-muted-foreground">
                      Receber email quando um novo orçamento for criado
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Faturas Vencendo</Label>
                    <p className="text-sm text-muted-foreground">
                      Alertas 3 dias antes do vencimento de faturas
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Estoque Baixo</Label>
                    <p className="text-sm text-muted-foreground">
                      Notificar quando materiais atingirem estoque mínimo
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Atualizações do Sistema</Label>
                    <p className="text-sm text-muted-foreground">
                      Novidades e melhorias da plataforma
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Segurança</CardTitle>
                <CardDescription>Configurações de segurança da conta</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Alterar Senha</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Mantenha sua conta segura alterando sua senha periodicamente
                  </p>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        Alterar Senha
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Alterar Senha</DialogTitle>
                        <DialogDescription>
                          Digite sua nova senha
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-password">Nova Senha</Label>
                        <Input 
                          id="new-password" 
                          type="password" 
                          placeholder="Digite sua nova senha"
                          value={newPassword}
                          onChange={(e) => {
                            const v = e.target.value;
                            setNewPassword(v);
                            setPasswordStrength(evaluatePassword(v));
                          }}
                        />
                        <div className="mt-2">
                          <div className="flex gap-1">
                            {[0,1,2,3].map((i) => (
                              <div key={i} className={`h-1.5 flex-1 rounded ${passwordStrength > i ? 'bg-primary' : 'bg-muted'}`}></div>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Use pelo menos 8 caracteres, incluindo letra maiúscula, minúscula e número.
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirmar Senha</Label>
                        <Input 
                          id="confirm-password" 
                          type="password" 
                          placeholder="Confirme sua nova senha"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                      </div>
                        <Button 
                          className="w-full"
                          onClick={async () => {
                            const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
                            if (!strongRegex.test(newPassword)) {
                              toast.error('A senha deve ter ao menos 8 caracteres, com letra maiúscula, minúscula e número.');
                              return;
                            }
                            if (newPassword !== confirmPassword) {
                              toast.error('As senhas não coincidem');
                              return;
                            }
                            const { error } = await supabase.auth.updateUser({ password: newPassword });
                            if (error) {
                              toast.error('Erro ao alterar senha: ' + error.message);
                            } else {
                              toast.success('Senha alterada com sucesso!');
                              setNewPassword('');
                              setConfirmPassword('');
                              setPasswordStrength(0);
                              (document.querySelector('[data-state="open"]') as HTMLElement)?.click();
                            }
                          }}
                        >
                          Alterar Senha
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Sessões Ativas</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Encerre todas as sessões ativas (exceto a atual)
                  </p>
                  <Button 
                    variant="outline"
                    onClick={async () => {
                      const { error } = await supabase.auth.signOut({ scope: 'others' });
                      if (error) {
                        toast.error('Erro ao encerrar sessões: ' + error.message);
                      } else {
                        toast.success('Sessões encerradas com sucesso!');
                      }
                    }}
                  >
                    Encerrar Outras Sessões
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dados e Privacidade</CardTitle>
                <CardDescription>Controle seus dados pessoais</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Excluir Conta</Label>
                  <p className="text-sm text-muted-foreground mb-3 text-destructive">
                    ⚠️ Ação permanente. Todos os seus dados serão deletados
                  </p>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="destructive">
                        Excluir Minha Conta
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Confirmar Exclusão de Conta</DialogTitle>
                        <DialogDescription>
                          Esta ação é permanente e não pode ser desfeita. Digite sua senha para confirmar.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="delete-password">Sua Senha</Label>
                          <Input 
                            id="delete-password" 
                            type="password" 
                            placeholder="Digite sua senha para confirmar"
                          />
                        </div>
                        <Button 
                          variant="destructive"
                          className="w-full"
                          onClick={async () => {
                            const password = (document.getElementById('delete-password') as HTMLInputElement)?.value;
                            
                            if (!password) {
                              toast.error('Digite sua senha para confirmar');
                              return;
                            }

                              try {
                              const { data: { user } } = await supabase.auth.getUser();
                              if (!user?.email) return;

                              // Tentar fazer login novamente para verificar senha
                              const { error: signInError } = await supabase.auth.signInWithPassword({
                                email: user.email,
                                password: password
                              });

                              if (signInError) {
                                toast.error('Senha incorreta');
                                return;
                              }

                              // Avisar usuário para contatar suporte
                              toast.error('Para excluir sua conta, entre em contato com o suporte através da página Suporte');
                              (document.querySelector('[data-state="open"]') as HTMLElement)?.click();
                            } catch (error: any) {
                              toast.error('Erro ao processar exclusão: ' + error.message);
                            }
                          }}
                        >
                          Confirmar Exclusão
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informações do Sistema</CardTitle>
                <CardDescription>Versão e status da aplicação</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Versão:</span>
                  <span className="font-medium">1.0.0</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Última Atualização:</span>
                  <span className="font-medium">{new Date().toLocaleDateString('pt-BR')}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant="outline" className="bg-success/10 text-success">
                    ● Operacional
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Configuracoes;
