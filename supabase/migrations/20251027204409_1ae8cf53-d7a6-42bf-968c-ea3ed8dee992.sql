-- Criar políticas RLS para o bucket company-assets
-- Permitir usuários autenticados fazerem upload de suas logos

-- Política para upload (INSERT)
CREATE POLICY "Usuários podem fazer upload de logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'company-assets' 
  AND (storage.foldername(name))[1] = 'logos'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- Política para visualização (SELECT) - logos são públicas
CREATE POLICY "Logos são públicas"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'company-assets'
  AND (storage.foldername(name))[1] = 'logos'
);

-- Política para atualização (UPDATE)
CREATE POLICY "Usuários podem atualizar suas próprias logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'company-assets'
  AND (storage.foldername(name))[1] = 'logos'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- Política para exclusão (DELETE)
CREATE POLICY "Usuários podem deletar suas próprias logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'company-assets'
  AND (storage.foldername(name))[1] = 'logos'
  AND auth.uid()::text = (storage.foldername(name))[2]
);