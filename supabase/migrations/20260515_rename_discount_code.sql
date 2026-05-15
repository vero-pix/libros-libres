-- Renombra el código de descuento VECINOS20 a MIDESCUENTO.
-- La descripción se actualiza para reflejar el nuevo nombre.
UPDATE discount_codes
SET
    code        = 'MIDESCUENTO',
    description = '20% dcto. código de descuento'
WHERE code = 'VECINOS20';
