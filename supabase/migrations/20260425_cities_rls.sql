-- RLS Policies for cities table
-- Lectura pública (todos ven las ciudades)
CREATE POLICY "Public can read cities" ON public.cities
  FOR SELECT USING (true);

-- Escritura solo admin
CREATE POLICY "Admin can write cities" ON public.cities
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin can update cities" ON public.cities
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin can delete cities" ON public.cities
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );
