#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Spanish words to match
const SPANISH_WORDS = [
  'el', 'la', 'los', 'las', 'del', 'por', 'una', 'con', 'que', 'en', 'de', 'su',
  'este', 'esta', 'como', 'para', 'más', 'entre', 'sobre', 'desde', 'hasta',
  'pero', 'sino', 'también', 'tiene', 'puede', 'hace', 'sido', 'está', 'fue',
  'ser', 'hay', 'sus', 'nos', 'muy'
];

// Create regex pattern from Spanish words
const spanishPattern = new RegExp(
  `\\b(${SPANISH_WORDS.join('|')})\\b`,
  'i'
);

async function cleanDescriptions() {
  // Get environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Error: Missing Supabase credentials');
    console.error('Make sure to run: export $(grep -E "^(NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY)" .env.local | xargs)');
    process.exit(1);
  }

  // Initialize Supabase client with service role key
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  console.log('Fetching books with descriptions...\n');

  try {
    // Fetch all books with descriptions
    const { data: books, error } = await supabase
      .from('books')
      .select('id, title, description')
      .not('description', 'is', null);

    if (error) {
      console.error('Error fetching books:', error);
      process.exit(1);
    }

    console.log(`Found ${books.length} books with descriptions\n`);

    const toClean = [];
    const toKeep = [];

    // Check each description
    for (const book of books) {
      if (book.description && !spanishPattern.test(book.description)) {
        toClean.push(book);
      } else {
        toKeep.push(book);
      }
    }

    console.log(`Books with Spanish descriptions (keeping): ${toKeep.length}`);
    console.log(`Books with non-Spanish descriptions (nulling): ${toClean.length}\n`);

    if (toClean.length === 0) {
      console.log('No non-Spanish descriptions found. All good!');
      return;
    }

    // Display books to be cleaned
    console.log('Books to be cleaned:');
    console.log('─'.repeat(80));
    for (const book of toClean) {
      console.log(`\nID: ${book.id}`);
      console.log(`Title: ${book.title}`);
      console.log(`Description: ${book.description.substring(0, 100)}${book.description.length > 100 ? '...' : ''}`);
    }
    console.log('\n' + '─'.repeat(80));

    // Null out non-Spanish descriptions
    if (toClean.length > 0) {
      const ids = toClean.map(b => b.id);

      console.log(`\nNulling ${toClean.length} description(s)...`);

      const { error: updateError } = await supabase
        .from('books')
        .update({ description: null })
        .in('id', ids);

      if (updateError) {
        console.error('Error updating books:', updateError);
        process.exit(1);
      }

      console.log(`✓ Successfully nulled ${toClean.length} non-Spanish description(s)`);
    }

    console.log('\nDone!');
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

cleanDescriptions();
