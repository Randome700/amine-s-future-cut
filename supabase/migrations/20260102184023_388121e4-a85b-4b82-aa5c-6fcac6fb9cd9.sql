-- Allow anyone to delete reservations (for cleanup and cancellation)
CREATE POLICY "Anyone can delete reservations" 
ON public.reservations 
FOR DELETE 
USING (true);