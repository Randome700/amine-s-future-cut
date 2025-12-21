-- Create cancellation_records table to track cancellations per phone
CREATE TABLE public.cancellation_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  cancelled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  banned_until TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.cancellation_records ENABLE ROW LEVEL SECURITY;

-- Policies for cancellation_records
CREATE POLICY "Anyone can view cancellation records"
ON public.cancellation_records
FOR SELECT
USING (true);

CREATE POLICY "Anyone can create cancellation records"
ON public.cancellation_records
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update cancellation records"
ON public.cancellation_records
FOR UPDATE
USING (true);

-- Add index on phone for faster lookups
CREATE INDEX idx_cancellation_records_phone ON public.cancellation_records (phone);

-- Enable realtime for cancellation_records
ALTER PUBLICATION supabase_realtime ADD TABLE public.cancellation_records;