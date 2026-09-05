-- Normaliza cities.region a los 16 nombres cortos oficiales (claves de
-- REGIONES_CHILE en lib/comunas.ts). Había 22 variantes para 16 regiones:
-- "Metropolitana" y "Región Metropolitana de Santiago", "Bío Bío" / "Biobío" /
-- "Región del Biobío", "Lagos" / "Los Lagos" / "Región de Los Lagos", etc.
-- /tiendas mostraba un filtro por cada variante. Aplicado en prod el 05-09-2026
-- desde script; este archivo deja el cambio versionado y es idempotente.
update public.cities set region = 'Metropolitana'      where region in ('Región Metropolitana de Santiago', 'Región Metropolitana', 'RM');
update public.cities set region = 'Biobío'             where region in ('Bío Bío', 'Bio Bio', 'Región del Biobío', 'Región del Bío Bío');
update public.cities set region = 'Los Lagos'          where region in ('Lagos', 'Región de Los Lagos');
update public.cities set region = 'Los Ríos'           where region in ('Ríos', 'Región de Los Ríos');
update public.cities set region = 'La Araucanía'       where region in ('Araucanía', 'Región de La Araucanía');
update public.cities set region = 'O''Higgins'         where region in ('Región de O''Higgins', 'Región del Libertador General Bernardo O''Higgins');
update public.cities set region = 'Maule'              where region in ('Región del Maule');
update public.cities set region = 'Valparaíso'         where region in ('Región de Valparaíso');
update public.cities set region = 'Coquimbo'           where region in ('Región de Coquimbo');
update public.cities set region = 'Antofagasta'        where region in ('Región de Antofagasta');
update public.cities set region = 'Atacama'            where region in ('Región de Atacama');
update public.cities set region = 'Magallanes'         where region in ('Región de Magallanes y de la Antártica Chilena', 'Región de Magallanes');
update public.cities set region = 'Ñuble'              where region in ('Región de Ñuble');
update public.cities set region = 'Aysén'              where region in ('Región de Aysén', 'Región de Aysén del General Carlos Ibáñez del Campo');
update public.cities set region = 'Tarapacá'           where region in ('Región de Tarapacá');
update public.cities set region = 'Arica y Parinacota' where region in ('Región de Arica y Parinacota');
