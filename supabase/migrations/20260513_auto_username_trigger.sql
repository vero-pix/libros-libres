-- Genera username automático desde full_name en cualquier INSERT a users.
-- Cubre registro email/password, Google OAuth, LinkedIn OAuth y cualquier
-- inserción futura. Se ejecuta AFTER INSERT para que el row ya exista.

CREATE OR REPLACE FUNCTION generate_username_from_name()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  candidate TEXT;
  suffix    INT := 2;
BEGIN
  -- Solo actuar si username es null y hay full_name
  IF NEW.username IS NOT NULL OR NEW.full_name IS NULL OR trim(NEW.full_name) = '' THEN
    RETURN NEW;
  END IF;

  -- Slugify: minúsculas, sin tildes, alfanumérico + puntos
  base_slug := lower(
    regexp_replace(
      translate(
        trim(NEW.full_name),
        'áéíóúàèìòùâêîôûäëïöüãõñÁÉÍÓÚÀÈÌÒÙÄËÏÖÜÃÕÑ',
        'aeiouaeiouaeiouaeiouaonaeiouaeiouaeiouaon'
      ),
      '[^a-z0-9]+', '.', 'g'
    )
  );
  base_slug := trim(both '.' from base_slug);
  base_slug := left(base_slug, 40);

  IF base_slug = '' THEN
    RETURN NEW;
  END IF;

  candidate := base_slug;

  -- Buscar primer candidato disponible
  LOOP
    IF NOT EXISTS (SELECT 1 FROM users WHERE username = candidate AND id != NEW.id) THEN
      EXIT;
    END IF;
    candidate := base_slug || suffix::text;
    suffix := suffix + 1;
    EXIT WHEN suffix > 99;
  END LOOP;

  IF suffix <= 99 THEN
    UPDATE users SET username = candidate WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS auto_username_on_insert ON users;

CREATE TRIGGER auto_username_on_insert
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION generate_username_from_name();
