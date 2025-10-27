import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, DollarSign, FileText, Settings as SettingsIcon, Save, Crown, Palette, Upload, Eye, EyeOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { validarCNPJ, formatarCNPJ, formatarCPFouCNPJ } from "@/utils/validators";
import { PlansTab } from "@/components/subscription/PlansTab";
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
  logo_url: string;
  slogan: string;
  cor_primaria: string;
  cor_secundaria: string;
  observacoes_padrao: string;
  termos_condicoes: string;
  certificado_digital_tipo: string;
  certificado_digital_validade: string;
  ambiente_nfe: string;
  serie_nfe: string;
  proximo_numero_nfe: number;
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
      const filePath = `logos/${fileName}`;

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
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
            <TabsTrigger value="empresa">
              <Building2 className="mr-2 h-4 w-4" />
              Minha Empresa
            </TabsTrigger>
            <TabsTrigger value="plano">
              <Crown className="mr-2 h-4 w-4" />
              Plano
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

          <form onSubmit={handleSubmit(onSubmit)}>
            <TabsContent value="empresa" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Form Fields */}
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
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={formData.mostrar_nome_fantasia !== false}
                                onCheckedChange={(checked) => setValue('mostrar_nome_fantasia', checked)}
                              />
                              {formData.mostrar_nome_fantasia !== false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            </div>
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
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={formData.mostrar_razao_social !== false}
                                  onCheckedChange={(checked) => setValue('mostrar_razao_social', checked)}
                                />
                                {formData.mostrar_razao_social !== false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                              </div>
                            </div>
                            <Input id="razao_social" {...register('razao_social')} />
                          </div>
                        )}

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="cnpj">
                              {formData.tipo_pessoa === 'fisica' ? 'CPF' : 'CNPJ'}
                            </Label>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={formData.mostrar_cnpj !== false}
                                onCheckedChange={(checked) => setValue('mostrar_cnpj', checked)}
                              />
                              {formData.mostrar_cnpj !== false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            </div>
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
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={formData.mostrar_regime_tributario !== false}
                                  onCheckedChange={(checked) => setValue('mostrar_regime_tributario', checked)}
                                />
                                {formData.mostrar_regime_tributario !== false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                              </div>
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
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={formData.mostrar_inscricao_estadual !== false}
                                    onCheckedChange={(checked) => setValue('mostrar_inscricao_estadual', checked)}
                                  />
                                </div>
                              </div>
                              <Input id="inscricao_estadual" {...register('inscricao_estadual')} />
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label htmlFor="inscricao_municipal">Inscrição Municipal</Label>
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={formData.mostrar_inscricao_municipal !== false}
                                    onCheckedChange={(checked) => setValue('mostrar_inscricao_municipal', checked)}
                                  />
                                </div>
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
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={formData.mostrar_endereco !== false}
                              onCheckedChange={(checked) => setValue('mostrar_endereco', checked)}
                            />
                            {formData.mostrar_endereco !== false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </div>
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
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={formData.mostrar_telefone !== false}
                              onCheckedChange={(checked) => setValue('mostrar_telefone', checked)}
                            />
                            {formData.mostrar_telefone !== false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </div>
                        </div>
                        <Input id="telefone" {...register('telefone')} placeholder="(00) 00000-0000" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="email">E-mail</Label>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={formData.mostrar_email !== false}
                              onCheckedChange={(checked) => setValue('mostrar_email', checked)}
                            />
                            {formData.mostrar_email !== false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </div>
                        </div>
                        <Input id="email" type="email" {...register('email')} />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="website">Website</Label>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={formData.mostrar_website !== false}
                              onCheckedChange={(checked) => setValue('mostrar_website', checked)}
                            />
                            {formData.mostrar_website !== false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </div>
                        </div>
                        <Input id="website" {...register('website')} placeholder="https://..." />
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

                {/* Right Column - Live Preview */}
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
                      <div className="bg-white border-2 rounded-lg p-6 space-y-4 min-h-[600px]" style={{ borderColor: formData.cor_primaria || '#1EAEDB' }}>
                        {/* Logo Preview */}
                        {formData.logo_url && formData.mostrar_logo !== false && (
                          <div className="flex justify-center pb-4 border-b" style={{ borderColor: formData.cor_secundaria || '#33C3F0' }}>
                            <img src={formData.logo_url} alt="Logo Preview" className="h-16 object-contain" />
                          </div>
                        )}

                        {/* Company Info Preview */}
                        <div className="space-y-2">
                          {formData.mostrar_nome_fantasia !== false && formData.nome_fantasia && (
                            <h2 className="text-2xl font-bold" style={{ color: formData.cor_primaria || '#1EAEDB' }}>
                              {formData.nome_fantasia}
                            </h2>
                          )}
                          {formData.slogan && (
                            <p className="text-sm italic text-muted-foreground">{formData.slogan}</p>
                          )}
                          {formData.mostrar_razao_social !== false && formData.razao_social && (
                            <p className="text-sm"><strong>Razão Social:</strong> {formData.razao_social}</p>
                          )}
                          {formData.mostrar_cnpj !== false && formData.cnpj && (
                            <p className="text-sm"><strong>CNPJ:</strong> {formData.cnpj}</p>
                          )}
                          {formData.mostrar_regime_tributario !== false && formData.regime_tributario && (
                            <p className="text-sm"><strong>Regime:</strong> {formData.regime_tributario}</p>
                          )}
                          {formData.mostrar_inscricao_estadual !== false && formData.inscricao_estadual && (
                            <p className="text-sm"><strong>IE:</strong> {formData.inscricao_estadual}</p>
                          )}
                          {formData.mostrar_inscricao_municipal !== false && formData.inscricao_municipal && (
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
                          <h3 className="font-bold text-lg" style={{ color: formData.cor_primaria || '#1EAEDB' }}>
                            ORÇAMENTO Nº 001/2025
                          </h3>
                          <p className="text-sm text-muted-foreground">Data: {new Date().toLocaleDateString('pt-BR')}</p>
                          
                          <div className="bg-muted p-3 rounded">
                            <p className="text-sm font-semibold mb-2">Cliente: João Silva</p>
                            <p className="text-xs text-muted-foreground">exemplo@cliente.com.br</p>
                          </div>

                          <div className="border rounded p-3">
                            <p className="text-xs font-semibold mb-2">ITENS DO ORÇAMENTO</p>
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span>1. Instalação elétrica completa</span>
                                <span>R$ 5.000,00</span>
                              </div>
                              <div className="flex justify-between">
                                <span>2. Material elétrico</span>
                                <span>R$ 2.500,00</span>
                              </div>
                            </div>
                            <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                              <span>TOTAL:</span>
                              <span style={{ color: formData.cor_primaria || '#1EAEDB' }}>R$ 7.500,00</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
                        defaultValue="Arial" 
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
                        defaultValue="12" 
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
                        defaultValue="simples" 
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

              <Separator />

              <Card>
                <CardHeader>
                  <CardTitle>Template de Orçamento</CardTitle>
                  <CardDescription>
                    Personalize o template de PDF para orçamentos. Use as variáveis entre chaves para dados dinâmicos.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="template_orcamento">Template de Orçamento</Label>
                    <Textarea
                      id="template_orcamento"
                      {...register('template_orcamento')}
                      rows={12}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="rounded-lg bg-muted p-4">
                    <p className="text-sm font-semibold mb-2">Variáveis disponíveis:</p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <code>{'{numero}'}</code> <span>- Número do orçamento</span>
                      <code>{'{data}'}</code> <span>- Data de emissão</span>
                      <code>{'{validade}'}</code> <span>- Validade em dias</span>
                      <code>{'{cliente_nome}'}</code> <span>- Nome do cliente</span>
                      <code>{'{cliente_endereco}'}</code> <span>- Endereço do cliente</span>
                      <code>{'{cliente_contato}'}</code> <span>- Contato do cliente</span>
                      <code>{'{itens}'}</code> <span>- Lista de itens</span>
                      <code>{'{observacoes}'}</code> <span>- Observações</span>
                      <code>{'{valor_total}'}</code> <span>- Valor total</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Template de Fatura</CardTitle>
                  <CardDescription>
                    Personalize o template de PDF para faturas. Use as variáveis entre chaves para dados dinâmicos.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="template_fatura">Template de Fatura</Label>
                    <Textarea
                      id="template_fatura"
                      {...register('template_fatura')}
                      rows={12}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="rounded-lg bg-muted p-4">
                    <p className="text-sm font-semibold mb-2">Variáveis disponíveis:</p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <code>{'{numero}'}</code> <span>- Número da fatura</span>
                      <code>{'{data_emissao}'}</code> <span>- Data de emissão</span>
                      <code>{'{data_vencimento}'}</code> <span>- Data de vencimento</span>
                      <code>{'{cliente_nome}'}</code> <span>- Nome do cliente</span>
                      <code>{'{cliente_endereco}'}</code> <span>- Endereço do cliente</span>
                      <code>{'{cliente_contato}'}</code> <span>- Contato do cliente</span>
                      <code>{'{itens}'}</code> <span>- Lista de itens</span>
                      <code>{'{observacoes}'}</code> <span>- Observações</span>
                      <code>{'{valor_total}'}</code> <span>- Valor total</span>
                      <code>{'{forma_pagamento}'}</code> <span>- Forma de pagamento</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button type="submit" size="lg" disabled={loading}>
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? 'Salvando...' : 'Salvar Templates'}
                </Button>
              </div>
            </TabsContent>
          </form>

          <TabsContent value="sistema" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Preferências do Sistema</CardTitle>
                <CardDescription>Configurações gerais da aplicação</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Funcionalidade em desenvolvimento. Em breve você poderá configurar notificações e backups.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Configuracoes;
