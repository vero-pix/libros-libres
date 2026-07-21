import { foldAccents } from "./accentSearch";

// Autores con landing dedicada. La ficha de un libro de estos autores enlaza a
// su landing (concentra autoridad SEO en el hub del autor y evita que la ficha
// individual le canibalice el ranking a la landing). El match es sobre el nombre
// del autor, insensible a tildes/mayúsculas.
const AUTHOR_LANDINGS: { match: string; slug: string; label: string }[] = [
  { match: "neruda", slug: "/pablo-neruda", label: "Pablo Neruda" },
  { match: "vargas llosa", slug: "/mario-vargas-llosa", label: "Mario Vargas Llosa" },
  { match: "marcela paz", slug: "/marcela-paz-libros", label: "Marcela Paz" },
  { match: "megan maxwell", slug: "/megan-maxwell-libros", label: "Megan Maxwell" },
  { match: "simenon", slug: "/georges-simenon", label: "Georges Simenon" },
  { match: "baldor", slug: "/algebra-de-baldor", label: "Baldor" },
];

export function authorLanding(author?: string | null): { slug: string; label: string } | null {
  if (!author) return null;
  const a = foldAccents(author);
  const hit = AUTHOR_LANDINGS.find((x) => a.includes(x.match));
  return hit ? { slug: hit.slug, label: hit.label } : null;
}
