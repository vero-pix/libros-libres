-- Agrega columna `language` a books (código ISO 639-1: 'es', 'en', 'de', 'fr'...)
-- Default 'es' porque la mayoría del catálogo está en español.
-- El sort de home prioriza 'es' → otros, y el badge en cards muestra idiomas no-es.

alter table public.books
  add column if not exists language text default 'es';

create index if not exists idx_books_language on public.books (language);

comment on column public.books.language is
  'ISO 639-1 del idioma del libro. Default es. Se muestra badge en listings cuando no es es.';
