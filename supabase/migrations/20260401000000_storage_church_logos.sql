-- Create storage bucket for church logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('church-logos', 'church-logos', true);

-- Policy to allow authenticated users to upload their own logos
-- The folder structure is {user_id}/{filename}
CREATE POLICY "Allow individual upload" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'church-logos' 
    AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Policy to allow public to view logos
CREATE POLICY "Allow public view" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'church-logos');
