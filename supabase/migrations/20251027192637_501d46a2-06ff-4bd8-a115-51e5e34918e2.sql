-- Create storage bucket for company assets (logos)
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-assets', 'company-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their company logos
CREATE POLICY "Users can upload their company logos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'company-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update their company logos
CREATE POLICY "Users can update their company logos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'company-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their company logos
CREATE POLICY "Users can delete their company logos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'company-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public access to view company logos
CREATE POLICY "Company logos are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'company-assets');