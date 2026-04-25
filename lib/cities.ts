import { createPublicClient } from "@/lib/supabase/public";

let citiesCache: Array<{ id: string; name: string; region: string; lat: number; lng: number }> | null = null;
let cacheTime = 0;
const CACHE_DURATION = 3600000; // 1 hora

export async function getCities() {
  const now = Date.now();
  if (citiesCache && now - cacheTime < CACHE_DURATION) {
    return citiesCache;
  }

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("cities")
    .select("id, name, region, lat, lng")
    .order("region", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching cities:", error);
    return [];
  }

  citiesCache = data || [];
  cacheTime = now;
  return citiesCache;
}

export async function getCitiesByRegion(region: string) {
  const cities = await getCities();
  return cities.filter((c) => c.region === region);
}
