-- Identifica libros con descripción probable en inglés.
-- Criterio: contiene palabras comunes en inglés Y NO tiene suficientes palabras en español.
-- Ejecutar en Supabase SQL Editor (solo lectura, no modifica nada).

SELECT
  b.id,
  b.title,
  b.author,
  b.isbn,
  LEFT(b.description, 200) AS description_preview,
  -- Conteo aproximado de palabras en inglés usando REGEXP_COUNT (Postgres 15+)
  -- En Postgres < 15 usamos length - replace trick
  (
    LENGTH(REGEXP_REPLACE(LOWER(b.description), '\y(the|and|this|with|that|from|have|been|their|which|about|into|through|when|where|author|novel|story|world|life|his|her|its|they|them|will|would|could|should|shall|may|might|must|does|did|had|has|was|were|are|him|she|who|what|how|our|your|we|he|it)\y', 'X', 'g'))
    - LENGTH(REGEXP_REPLACE(LOWER(b.description), '\y(the|and|this|with|that|from|have|been|their|which|about|into|through|when|where|author|novel|story|world|life|his|her|its|they|them|will|would|could|should|shall|may|might|must|does|did|had|has|was|were|are|him|she|who|what|how|our|your|we|he|it)\y', '', 'g'))
  ) AS english_word_hits,
  (
    LENGTH(REGEXP_REPLACE(LOWER(b.description), '\y(el|la|los|las|del|por|una|con|que|en|de|su|este|esta|como|para|más|entre|sobre|desde|hasta|pero|sino|también|tiene|puede|hace|sido|está|fue|ser|hay|sus|nos|muy|cuando|donde|quien|autor|libro|obra|vida|mundo|historia|tiempo|años)\y', 'X', 'g'))
    - LENGTH(REGEXP_REPLACE(LOWER(b.description), '\y(el|la|los|las|del|por|una|con|que|en|de|su|este|esta|como|para|más|entre|sobre|desde|hasta|pero|sino|también|tiene|puede|hace|sido|está|fue|ser|hay|sus|nos|muy|cuando|donde|quien|autor|libro|obra|vida|mundo|historia|tiempo|años)\y', '', 'g'))
  ) AS spanish_word_hits
FROM books b
WHERE
  b.description IS NOT NULL
  AND b.description <> ''
  -- Tiene palabras en inglés
  AND b.description ~* '\y(the |and |this |with |that |from |have |been |their |which )\y'
  -- NO tiene suficientes palabras en español (menos de 3 hits de palabras clave)
  AND NOT (
    b.description ~* '\y(el|la|los|las|del|por|una|con|que)\y'
    AND b.description ~* '\y(para|más|sobre|también|tiene|puede|fue|ser|hay)\y'
    AND b.description ~* '\y(este|esta|como|desde|hasta|pero|sino|sus|nos|muy)\y'
  )
ORDER BY english_word_hits DESC NULLS LAST;

-- Para limpiarlos directamente (descomentar cuando estés segura):
-- UPDATE books
-- SET description = NULL
-- WHERE id IN (
--   SELECT b.id FROM books b
--   WHERE
--     b.description IS NOT NULL
--     AND b.description <> ''
--     AND b.description ~* '\y(the |and |this |with |that |from |have |been |their |which )\y'
--     AND NOT (
--       b.description ~* '\y(el|la|los|las|del|por|una|con|que)\y'
--       AND b.description ~* '\y(para|más|sobre|también|tiene|puede|fue|ser|hay)\y'
--       AND b.description ~* '\y(este|esta|como|desde|hasta|pero|sino|sus|nos|muy)\y'
--     )
-- );
