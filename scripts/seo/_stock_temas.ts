import { loadEnv, searchConsole, siteUrl, dateNDaysAgo } from "./_shared";
import { createClient } from "@supabase/supabase-js";
loadEnv();

const TEMAS: Record<string, RegExp> = {
  "TEXTO ESCOLAR": /texto del estudiante|educaci[oó]n ciudadana|\b[1-4]\D{0,3}\s*medio\b|santillana|ministerio de educaci|mineduc|texto escolar|cuaderno de actividades/i,
  "FANTASÍA": /sanderson|tolkien|rowling|sarah j\.? maas|neil gaiman|terry pratchett|ursula k\.? le ?guin|patrick rothfuss|george r\.?r\.? martin|cassandra clare|rick riordan|c\.?s\.? lewis|christopher paolini|leigh bardugo|holly black|marissa meyer/i,
  "ROMANCE/ROMANTASY": /alice kellen|ariana godoy|mercedes ron|flor m\.? salvador|megan maxwell|elísabet benavent|elisabet benavent|colleen hoover|anna todd|jane austen|danielle steel|corín tellado|corin tellado|nicholas sparks/i,
  "TERROR": /stephen king|lovecraft|clive barker|anne rice|edgar allan poe|bram stoker|mary shelley|terror\b/i,
  "MEDICINA/SALUD": /medicina|anatom[ií]a|fisiolog[ií]a|fisiopatolog|cardiolog|psiquiatr|enfermer[ií]a|pediatr|farmacolog|cirug[ií]a|patolog[ií]a/i,
  "DERECHO": /derecho |c[oó]digo civil|c[oó]digo penal|constituci[oó]n pol[ií]tica|jurídic|procesal|tributario/i,
  "COCINA": /cocina|recetas|reposter[ií]a|gastronom|culinari/i,
  "AUTOAYUDA": /autoayuda|autoestima|coaching|h[aá]bitos|superaci[oó]n personal|motivaci[oó]n|mindfulness|inteligencia emocional/i,
  "RELIGIÓN/BIBLIA": /biblia|cristian|cat[oó]lic|evangel|teolog|espiritual|jesucristo|oraci[oó]n/i,
  "POESÍA": /poes[ií]a|poemas|antolog[ií]a po[eé]tica|versos/i,
  "TEATRO": /teatro|dramaturg|obra dram/i,
  "ARTE": /arte\b|pintura|escultura|arquitectura|fotograf[ií]a|historia del arte|museo/i,
  "INGLÉS/IDIOMAS": /english|ingl[eé]s|franc[eé]s|alem[aá]n|gram[aá]tica|diccionario biling/i,
  "HISTORIA DE CHILE": /historia de chile|chile\b.*(historia|pol[ií]tic)|pinochet|allende, salvador|dictadura|golpe de estado|unidad popular/i,
  "INFANTIL": /infantil|cuentos para ni|papelucho|barco de vapor|el principito/i,
  "CIENCIA": /f[ií]sica|astronom|astrof[ií]s|matem[aá]tic|qu[ií]mica|biolog[ií]a|universo|cosmos|divulgaci[oó]n cient/i,
  "FILOSOFÍA": /filosof|plat[oó]n|arist[oó]teles|nietzsche|kant|hegel|heidegger|s[oó]crates|[eé]tica\b/i,
  "POLICIAL/THRILLER": /john grisham|agatha christie|simenon|camilleri|mankell|jo nesb|thriller|policial|novela negra|patricia highsmith/i,
};

async function main() {
  const api = await searchConsole();
  const filas: any[] = [];
  for (let startRow = 0; startRow < 25000; startRow += 1000) {
    const res: any = await api.searchanalytics.query({
      siteUrl: siteUrl(),
      requestBody: { startDate: dateNDaysAgo(31), endDate: dateNDaysAgo(3), dimensions: ["page"], rowLimit: 1000, startRow },
    });
    const rows = res.data.rows ?? [];
    filas.push(...rows);
    if (rows.length < 1000) break;
  }
  const visto = new Map<string, { impr: number; clics: number }>();
  for (const f of filas) {
    if (!/\/libro\/|\/listings\//.test(f.keys[0])) continue;
    const slug = decodeURIComponent(f.keys[0].replace(/\/$/, "").split("/").pop() ?? "");
    const v = visto.get(slug) ?? { impr: 0, clics: 0 };
    v.impr += f.impressions; v.clics += f.clicks;
    visto.set(slug, v);
  }

  const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const listings: any[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await s.from("listings")
      .select("id, slug, price, book:books(title, author, publisher, category, subcategory, tags)")
      .eq("status", "active").range(from, from + 999);
    if (error) throw error;
    if (!data?.length) break;
    listings.push(...data);
    if (data.length < 1000) break;
  }

  const res: Record<string, { total: number; invis: number; impr: number; clics: number; ejemplos: string[] }> = {};
  for (const [tema, re] of Object.entries(TEMAS)) res[tema] = { total: 0, invis: 0, impr: 0, clics: 0, ejemplos: [] };

  for (const l of listings) {
    const b = l.book ?? {};
    const texto = [b.title, b.author, b.publisher, (b.tags ?? []).join(" ")].filter(Boolean).join(" | ");
    const v = visto.get(l.slug ?? l.id);
    for (const [tema, re] of Object.entries(TEMAS)) {
      if (!re.test(texto)) continue;
      const r = res[tema];
      r.total++;
      if (!v) r.invis++;
      r.impr += v?.impr ?? 0; r.clics += v?.clics ?? 0;
      if (r.ejemplos.length < 4) r.ejemplos.push(`${b.title} — ${b.author}`);
    }
  }

  console.log("stock  invis   impr  clics  tema");
  for (const [tema, r] of Object.entries(res).sort((a, b) => b[1].total - a[1].total)) {
    console.log(`${String(r.total).padStart(5)} ${String(r.invis).padStart(6)} ${String(r.impr).padStart(6)} ${String(r.clics).padStart(6)}  ${tema}`);
    console.log(`        · ${r.ejemplos.join(" · ").slice(0, 150)}`);
  }
}
main();
