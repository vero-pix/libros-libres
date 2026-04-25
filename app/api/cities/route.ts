import { getCities } from "@/lib/cities";

export async function GET() {
  try {
    const cities = await getCities();
    return Response.json(cities, {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("Error in /api/cities:", error);
    return Response.json({ error: "Failed to fetch cities" }, { status: 500 });
  }
}
