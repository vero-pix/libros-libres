import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const title = "150 Años De Honor Y Gloria";
  
  // 1. Find the book
  const { data: books, error: bookError } = await supabase
    .from('books')
    .select('id, title')
    .ilike('title', `%${title}%`);

  if (bookError || !books || books.length === 0) {
    console.log("No se encontró el libro.");
    return;
  }

  console.log(`Encontrados ${books.length} libros:`, books);

  for (const book of books) {
    // 2. Find listings for this book
    const { data: listings, error: listError } = await supabase
      .from('listings')
      .select('id, seller_id, status, created_at')
      .eq('book_id', book.id);

    if (listError || !listings) continue;

    for (const listing of listings) {
      console.log(`\nProcesando publicación ${listing.id} del libro "${book.title}"`);
      
      // Check if it's Carlos's
      const { data: user } = await supabase.from('users').select('full_name').eq('id', listing.seller_id).single();
      console.log(`Vendedor: ${user?.full_name || 'Desconocido'}`);

      // 3. Attempt manual cleanup and deletion
      console.log("Limpiando dependencias...");
      await supabase.from('listing_images').delete().eq('listing_id', listing.id);
      await supabase.from('page_views').delete().eq('listing_id', listing.id);
      await supabase.from('cart').delete().eq('listing_id', listing.id);
      
      console.log("Eliminando publicación...");
      const { error: delError } = await supabase.from('listings').delete().eq('id', listing.id);
      
      if (delError) {
        console.error(`Error al eliminar: ${delError.message}`);
        console.log("Intentando marcar como pausado como plan B...");
        await supabase.from('listings').update({ status: 'paused' }).eq('id', listing.id);
      } else {
        console.log("¡Publicación eliminada con éxito!");
      }
    }
  }
}

main();
