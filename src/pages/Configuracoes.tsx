import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  Building2, 
  Users, 
  Settings, 
  Receipt, 
  CreditCard, 
  FolderOpen,
  FileText,
  Bell,
  Shield,
  Save,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";

interface ConfigSection {
  id: string;
  icon: any;
  title: string;
  description: string;
  items: {
    id: string;
    label: string;
    icon?: any;
  }[];
}

const Configuracoes = () => {
  const [selectedSection, setSelectedSection] = useState<string>("empresa");

  const sections: ConfigSection[] = [
    {
      id: "empresa",
      icon: Building2,
      title: "Minha Empresa",
      description: "Informações e configurações da empresa",
      items: [
        { id: "informacoes", label: "Informações Gerais" },
        { id: "equipe", label: "Equipe" },
        { id: "avancadas", label: "Configurações Avançadas" },
      ]
    },
    {
      id: "financeiro",
      icon: Receipt,
      title: "Financeiro",
      description: "Configurações fiscais e financeiras",
      items: [
        { id: "impostos", label: "Impostos" },
        { id: "pagamento", label: "Formas de Pagamento" },
        { id: "categorias", label: "Categorias" },
      ]
    },
    {
      id: "documentos",
      icon: FileText,
      title: "Documentos",
      description: "Modelos e configurações de documentos",
      items: [
        { id: "orcamentos", label: "Modelos de Orçamentos" },
        { id: "faturas", label: "Modelos de Faturas" },
        { id: "assinatura", label: "Assinatura Digital" },
      ]
    },
    {
      id: "sistema",
      icon: Settings,
      title: "Sistema",
      description: "Configurações gerais do sistema",
      items: [
        { id: "notificacoes", label: "Notificações" },
        { id: "backup", label: "Backup e Restauração" },
        { id: "seguranca", label: "Segurança" },
      ]
    }
  ];

  const handleSave = () => {
    toast.success("Configurações salvas com sucesso!");
  };

  const renderContent = () => {
    switch (selectedSection) {
      case "informacoes":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Informações da Empresa</CardTitle>
              <CardDescription>Dados cadastrais da sua empresa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="razao">Razão Social *</Label>
                  <Input id="razao" placeholder="Eletro Pro Ltda" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fantasia">Nome Fantasia</Label>
                  <Input id="fantasia" placeholder="Eletro Pro" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ *</Label>
                  <Input id="cnpj" placeholder="00.000.000/0000-00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ie">Inscrição Estadual</Label>
                  <Input id="ie" placeholder="000.000.000.000" />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input id="endereco" placeholder="Rua, número, complemento" />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input id="cidade" placeholder="São Paulo" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Input id="estado" placeholder="SP" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <Input id="cep" placeholder="00000-000" />
                </div>
              </div>

              <Separator />

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input id="telefone" placeholder="(11) 0000-0000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" placeholder="contato@eletropro.com" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="site">Site</Label>
                <Input id="site" placeholder="www.eletropro.com" />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSave} variant="hero">
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case "notificacoes":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Notificações</CardTitle>
              <CardDescription>Configure como deseja receber notificações</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Notificações por E-mail</Label>
                  <p className="text-sm text-muted-foreground">
                    Receba atualizações importantes por e-mail
                  </p>
                </div>
                <Switch />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Vencimento de Faturas</Label>
                  <p className="text-sm text-muted-foreground">
                    Alertas quando faturas estiverem próximas do vencimento
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Novos Orçamentos</Label>
                  <p className="text-sm text-muted-foreground">
                    Notificação quando novos orçamentos forem criados
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Estoque Baixo</Label>
                  <p className="text-sm text-muted-foreground">
                    Alertas quando materiais atingirem estoque mínimo
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Agendamentos</Label>
                  <p className="text-sm text-muted-foreground">
                    Lembretes de compromissos agendados
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSave} variant="hero">
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Preferências
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case "pagamento":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Formas de Pagamento</CardTitle>
              <CardDescription>Configure as formas de pagamento aceitas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Dinheiro</p>
                      <p className="text-sm text-muted-foreground">Pagamento em espécie</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">PIX</p>
                      <p className="text-sm text-muted-foreground">Transferência instantânea</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Cartão de Crédito</p>
                      <p className="text-sm text-muted-foreground">Parcelamento disponível</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Cartão de Débito</p>
                      <p className="text-sm text-muted-foreground">Débito à vista</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Boleto</p>
                      <p className="text-sm text-muted-foreground">Pagamento via boleto bancário</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Transferência Bancária</p>
                      <p className="text-sm text-muted-foreground">TED/DOC</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="chave-pix">Chave PIX</Label>
                <Input id="chave-pix" placeholder="email@exemplo.com ou CNPJ" />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSave} variant="hero">
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Configurações
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case "assinatura":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Assinatura Digital</CardTitle>
              <CardDescription>Configure a assinatura para seus documentos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome-responsavel">Nome do Responsável</Label>
                <Input id="nome-responsavel" placeholder="Nome completo" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cargo">Cargo</Label>
                <Input id="cargo" placeholder="Ex: Eletricista Responsável" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="crea">CREA / Registro Profissional</Label>
                <Input id="crea" placeholder="CREA-SP 000000" />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="assinatura">Texto da Assinatura</Label>
                <Textarea 
                  id="assinatura" 
                  rows={4}
                  placeholder="Este documento foi assinado digitalmente por..."
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="auto-assinar" defaultChecked />
                <Label htmlFor="auto-assinar">Assinar automaticamente orçamentos e faturas</Label>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSave} variant="hero">
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Assinatura
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Selecione uma opção</CardTitle>
              <CardDescription>Escolha uma seção no menu ao lado para configurar</CardDescription>
            </CardHeader>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Settings className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>Selecione uma das opções disponíveis para começar</p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as configurações do sistema</p>
      </div>

      <div className="grid md:grid-cols-[300px_1fr] gap-6">
        {/* Menu lateral */}
        <div className="space-y-1">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <div key={section.id}>
                <div className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-muted-foreground">
                  <Icon className="h-4 w-4" />
                  <span>{section.title}</span>
                </div>
                <div className="space-y-0.5">
                  {section.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedSection(item.id)}
                      className={`w-full flex items-center justify-between px-6 py-2 text-sm rounded-md transition-colors ${
                        selectedSection === item.id
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      <span>{item.label}</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Conteúdo */}
        <div>{renderContent()}</div>
      </div>
    </div>
  );
};

export default Configuracoes;