-- Agregar 'rented' al enum listing_status para soportar arriendos activos
ALTER TYPE listing_status ADD VALUE IF NOT EXISTS 'rented' AFTER 'paused';
