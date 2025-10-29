import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MessageSquare, Paperclip, X } from "lucide-react";

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Anexo {
  filename: string;
  content: string;
  contentType: string;
  size: number;
}

export const FeedbackDialog = ({ open, onOpenChange }: FeedbackDialogProps) => {
  const [assunto, setAssunto] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;

    // Limite de 5MB por arquivo
    const maxSize = 5 * 1024 * 1024;
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        toast.error(`${file.name} é muito grande (máx: 5MB)`);
        return false;
      }
      return true;
    });

    for (const file of validFiles) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        const content = base64.split(',')[1]; // Remove o prefixo "data:..."
        
        setAnexos(prev => [...prev, {
          filename: file.name,
          content,
          contentType: file.type,
          size: file.size
        }]);
      };
      reader.readAsDataURL(file);
    }

    // Limpar input
    e.target.value = '';
  };

  const removeAnexo = (index: number) => {
    setAnexos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!assunto.trim() || !mensagem.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.functions.invoke('enviar-suporte', {
        body: {
          tipo: 'feedback',
          assunto,
          mensagem,
          anexos: anexos.length > 0 ? anexos : undefined
        }
      });

      if (error) throw error;

      toast.success("Feedback enviado com sucesso!", {
        description: "Agradecemos sua contribuição. Vamos analisar suas sugestões."
      });
      
      setAssunto("");
      setMensagem("");
      setAnexos([]);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao enviar feedback:', error);
      toast.error("Erro ao enviar feedback", {
        description: error.message || "Tente novamente mais tarde"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle>Enviar Feedback</DialogTitle>
          </div>
          <DialogDescription>
            Compartilhe suas ideias para melhorar o EletroPro
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="assunto">Assunto *</Label>
            <Input
              id="assunto"
              value={assunto}
              onChange={(e) => setAssunto(e.target.value)}
              placeholder="Ex: Sugestão de nova funcionalidade"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mensagem">Mensagem *</Label>
            <Textarea
              id="mensagem"
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Descreva sua sugestão ou feedback..."
              rows={6}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="anexos">Anexos (opcional)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="anexos"
                type="file"
                onChange={handleFileChange}
                multiple
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('anexos')?.click()}
                disabled={isSubmitting}
              >
                <Paperclip className="h-4 w-4 mr-2" />
                Adicionar Arquivo
              </Button>
              <span className="text-xs text-muted-foreground">Máx: 5MB por arquivo</span>
            </div>
            
            {anexos.length > 0 && (
              <div className="space-y-2 mt-2">
                {anexos.map((anexo, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                    <div className="flex items-center gap-2">
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{anexo.filename}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(anexo.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAnexo(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Enviando...' : 'Enviar Feedback'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};