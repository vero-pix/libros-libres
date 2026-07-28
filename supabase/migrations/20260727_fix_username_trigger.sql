-- Arregla el trigger de username: se comía la primera letra de cada palabra.
--
-- El bug: lower() se aplicaba DESPUÉS del regexp_replace, así que el patrón
-- '[^a-z0-9]+' —que significa "todo lo que no sea minúscula o dígito"— matcheaba
-- las MAYÚSCULAS y las reemplazaba por punto:
--
--   'Ignacio Vallejos' -> '.gnacio.allejos' -> 'gnacio.allejos'
--   'Nico'             -> '.ico'            -> 'ico'
--
-- Solo afectaba a los registros por Google OAuth: el registro por email pasa
-- por components/auth/RegisterForm.tsx -> /api/users/generate-username, que
-- slugifica en JS y sí lo hacía bien. Google inserta directo y cae en el trigger.
-- Vivo desde que Google OAuth entró a producción (17 jul 2026); 9 usuarios.
--
-- El arreglo: lower() ANTES del regexp. Como ya viene en minúsculas, la tabla
-- de translate() solo necesita las vocales acentuadas minúsculas.

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

  -- Slugify: minúsculas PRIMERO, luego sin tildes, luego alfanumérico + puntos
  base_slug := regexp_replace(
    translate(
      lower(trim(NEW.full_name)),
      'áéíóúàèìòùâêîôûäëïöüãõñ',
      'aeiouaeiouaeiouaeiouaon'
    ),
    '[^a-z0-9]+', '.', 'g'
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
