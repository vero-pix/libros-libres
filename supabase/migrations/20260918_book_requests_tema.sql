-- "Se busca" por TEMA, no solo por título (18-09-2026).
-- Quien pide un tema no quiere UN libro: quiere que le avisen cada vez que
-- entre algo de lo suyo. Por eso el pedido NO se cierra al primer match y se
-- limita el aviso con `last_notified_at` (como mucho uno cada 24 horas).
alter table book_requests
  add column if not exists tema text,
  add column if not exists last_notified_at timestamptz;

comment on column book_requests.tema is
  'Slug de categories (ej: no-ficcion-ensayo). Cuando está, el pedido es por tema y no por título: no se marca fulfilled.';
comment on column book_requests.last_notified_at is
  'Último aviso enviado por un match de tema. Corta el spam a uno por día.';

create index if not exists book_requests_tema_idx
  on book_requests (tema) where tema is not null and fulfilled = false;
