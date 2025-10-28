import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Send, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface EmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientEmail: string;
  defaultSubject: string;
  defaultBody: string;
  onSend: (email: string, subject: string, body: string) => Promise<void>;
  onDownloadPDF: () => void;
  documentType: 'orçamento' | 'fatura';
}

export const EmailDialog = ({
  open,
  onOpenChange,
  recipientEmail,
  defaultSubject,
  defaultBody,
  onSend,
  onDownloadPDF,
  documentType,
}: EmailDialogProps) => {
  const [email, setEmail] = useState(recipientEmail);
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!email) {
      toast.error('Por favor, informe o email do destinatário');
      return;
    }

    setSending(true);
    try {
      await onSend(email, subject, body);
      toast.success(`${documentType === 'orçamento' ? 'Orçamento' : 'Fatura'} enviado com sucesso!`);
      onOpenChange(false);
    } catch (error: any) {
      toast.error('Erro ao enviar email: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Enviar {documentType === 'orçamento' ? 'Orçamento' : 'Fatura'} por Email
          </DialogTitle>
          <DialogDescription>
            Edite o conteúdo do email antes de enviar. O PDF será anexado automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email do destinatário</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cliente@exemplo.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Assunto</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Assunto do email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Mensagem</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Corpo do email"
              rows={12}
              className="font-mono text-sm"
            />
          </div>

          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm text-muted-foreground">
              💡 <strong>Dica:</strong> Você pode baixar o PDF primeiro para verificar se está correto antes de enviar.
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onDownloadPDF}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Baixar PDF
          </Button>
          <Button
            type="button"
            onClick={handleSend}
            disabled={sending}
            className="gap-2"
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Enviar Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
