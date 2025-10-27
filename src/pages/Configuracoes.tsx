import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, DollarSign, FileText, Settings as SettingsIcon, Save, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { validarCNPJ, formatarCNPJ } from "@/utils/validators";
import { PlansTab } from "@/components/subscription/PlansTab";
import { useSearchParams } from "react-router-dom";

interface EmpresaData {
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
}

const Configuracoes = () => {
  const [loading, setLoading] = useState(false);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const { register, handleSubmit, reset, setValue } = useForm<EmpresaData>();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'empresa';

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
              <Card>
                <CardHeader>
                  <CardTitle>Informações Gerais</CardTitle>
                  <CardDescription>Dados básicos da sua empresa</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome_fantasia">Nome Fantasia *</Label>
                      <Input id="nome_fantasia" {...register('nome_fantasia')} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="razao_social">Razão Social</Label>
                      <Input id="razao_social" {...register('razao_social')} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cnpj">CNPJ</Label>
                      <Input 
                        id="cnpj" 
                        {...register('cnpj')} 
                        placeholder="00.000.000/0000-00"
                        onChange={(e) => {
                          const formatted = formatarCNPJ(e.target.value);
                          e.target.value = formatted;
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="regime_tributario">Regime Tributário</Label>
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
                    <div className="space-y-2">
                      <Label htmlFor="inscricao_estadual">Inscrição Estadual</Label>
                      <Input id="inscricao_estadual" {...register('inscricao_estadual')} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="inscricao_municipal">Inscrição Municipal</Label>
                      <Input id="inscricao_municipal" {...register('inscricao_municipal')} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Endereço e Contato</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="endereco">Endereço</Label>
                    <Input id="endereco" {...register('endereco')} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="telefone">Telefone</Label>
                      <Input id="telefone" {...register('telefone')} placeholder="(00) 00000-0000" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input id="email" type="email" {...register('email')} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input id="website" {...register('website')} placeholder="https://..." />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Personalização</CardTitle>
                  <CardDescription>Cores e identidade visual dos documentos</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cor_primaria">Cor Primária</Label>
                      <Input id="cor_primaria" type="color" {...register('cor_primaria')} defaultValue="#1EAEDB" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cor_secundaria">Cor Secundária</Label>
                      <Input id="cor_secundaria" type="color" {...register('cor_secundaria')} defaultValue="#33C3F0" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Termos e Observações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="observacoes_padrao">Observações Padrão</Label>
                    <Textarea 
                      id="observacoes_padrao" 
                      {...register('observacoes_padrao')}
                      placeholder="Texto que aparecerá por padrão em orçamentos e faturas"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="termos_condicoes">Termos e Condições</Label>
                    <Textarea 
                      id="termos_condicoes" 
                      {...register('termos_condicoes')}
                      placeholder="Termos e condições gerais"
                      rows={5}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button type="submit" size="lg" disabled={loading}>
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? 'Salvando...' : 'Salvar Configurações'}
                </Button>
              </div>
            </TabsContent>
          </form>

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

          <form onSubmit={handleSubmit(onSubmit)}>
            <TabsContent value="documentos" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Template de Orçamento</CardTitle>
                  <CardDescription>Personalize o layout do PDF de orçamentos</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="template_orcamento">Conteúdo do Template</Label>
                    <Textarea 
                      id="template_orcamento" 
                      {...register('template_orcamento')}
                      placeholder="Use as variáveis disponíveis para personalizar"
                      rows={15}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="rounded-lg bg-muted p-4">
                    <p className="text-sm font-semibold mb-2">Variáveis disponíveis:</p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground font-mono">
                      <div>{"{numero}"} - Número do orçamento</div>
                      <div>{"{data}"} - Data de criação</div>
                      <div>{"{validade}"} - Validade (dias)</div>
                      <div>{"{cliente_nome}"} - Nome do cliente</div>
                      <div>{"{cliente_endereco}"} - Endereço do cliente</div>
                      <div>{"{cliente_contato}"} - Contato do cliente</div>
                      <div>{"{itens}"} - Lista de itens</div>
                      <div>{"{observacoes}"} - Observações</div>
                      <div>{"{valor_total}"} - Valor total</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Template de Fatura</CardTitle>
                  <CardDescription>Personalize o layout do PDF de faturas</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="template_fatura">Conteúdo do Template</Label>
                    <Textarea 
                      id="template_fatura" 
                      {...register('template_fatura')}
                      placeholder="Use as variáveis disponíveis para personalizar"
                      rows={15}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="rounded-lg bg-muted p-4">
                    <p className="text-sm font-semibold mb-2">Variáveis disponíveis:</p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground font-mono">
                      <div>{"{numero}"} - Número da fatura</div>
                      <div>{"{data_emissao}"} - Data de emissão</div>
                      <div>{"{data_vencimento}"} - Data de vencimento</div>
                      <div>{"{cliente_nome}"} - Nome do cliente</div>
                      <div>{"{cliente_endereco}"} - Endereço do cliente</div>
                      <div>{"{cliente_contato}"} - Contato do cliente</div>
                      <div>{"{itens}"} - Lista de itens</div>
                      <div>{"{observacoes}"} - Observações</div>
                      <div>{"{valor_total}"} - Valor total</div>
                      <div>{"{forma_pagamento}"} - Forma de pagamento</div>
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
