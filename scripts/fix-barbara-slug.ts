import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import path from 'path';

// Cargar variables de entorno manualmente
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim().replace(/^"|"$/g, '');
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY; 

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixBarbara() {
  console.log('🔍 Buscando a Bárbara...');
  
  // 1. Buscar el usuario
  const { data: users, error: searchError } = await supabase
    .from('users')
    .select('id, full_name, username')
    .ilike('full_name', '%Barbara%');

  if (searchError) {
    console.error('Error buscando usuario:', searchError);
    return;
  }

  if (!users || users.length === 0) {
    console.log('❌ No se encontró ningún usuario con el nombre Barbara.');
    return;
  }

  const barbara = users[0];
  console.log(`✅ Encontrada: ${barbara.full_name} (ID: ${barbara.id})`);
  console.log(`Username actual: ${barbara.username || 'nulo'}`);

  if (!barbara.username) {
    console.log('🛠️ Asignando username "barbara"...');
    const { error: updateError } = await supabase
      .from('users')
      .update({ username: 'barbara' })
      .eq('id', barbara.id);

    if (updateError) {
      console.error('Error al actualizar username:', updateError);
    } else {
      console.log('✨ Username "barbara" asignado con éxito.');
    }
  } else {
    console.log('✅ Ya tiene un username asignado.');
  }

  // 2. Verificar los libros para asegurar que tengan slug
  console.log('📚 Verificando publicaciones de Bárbara...');
  const { data: listings, error: listingsError } = await supabase
    .from('listings')
    .select('id, slug, book:books(title)')
    .eq('seller_id', barbara.id);

  if (listingsError) {
    console.error('Error buscando publicaciones:', listingsError);
    return;
  }

  console.log(`Encontradas ${listings?.length || 0} publicaciones.`);

  for (const item of (listings || [])) {
    if (!item.slug) {
      const bookTitle = (item.book as any)?.title || 'libro';
      const newSlug = bookTitle
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
        .replace(/[^a-z0-9]+/g, '-')     // Cambiar espacios/especiales por guiones
        .replace(/^-+|-+$/g, '');        // Quitar guiones al inicio/final

      console.log(`🛠️ Generando slug para "${bookTitle}": ${newSlug}`);
      
      await supabase
        .from('listings')
        .update({ slug: newSlug })
        .eq('id', item.id);
    }
  }

  console.log('🎉 ¡Proceso terminado!');
}

fixBarbara();
