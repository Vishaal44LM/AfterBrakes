-- Create glovebox_documents table for storing vehicle documents
CREATE TABLE public.glovebox_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('rc', 'driving_licence', 'insurance', 'puc')),
  expiry_date DATE,
  in_app_reminder BOOLEAN DEFAULT false,
  email_reminder BOOLEAN DEFAULT false,
  reminder_email TEXT,
  file_url TEXT,
  file_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, document_type)
);

-- Enable RLS
ALTER TABLE public.glovebox_documents ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own documents"
ON public.glovebox_documents
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents"
ON public.glovebox_documents
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
ON public.glovebox_documents
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
ON public.glovebox_documents
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_glovebox_documents_updated_at
BEFORE UPDATE ON public.glovebox_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for document files
INSERT INTO storage.buckets (id, name, public) VALUES ('glovebox', 'glovebox', false);

-- Storage policies for glovebox bucket
CREATE POLICY "Users can view their own glovebox files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'glovebox' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own glovebox files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'glovebox' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own glovebox files"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'glovebox' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own glovebox files"
ON storage.objects
FOR DELETE
USING (bucket_id = 'glovebox' AND auth.uid()::text = (storage.foldername(name))[1]);