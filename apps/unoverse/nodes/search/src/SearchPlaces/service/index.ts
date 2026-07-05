import { searchApi } from "../../shared/searchApiClient";

export interface SearchPlacesConfig {
  query: string;
  numResults: number;
  location: string;
  language: string;
}

export interface PlaceResult {
  title: string;
  address: string;
  rating: number | null;
  reviews: number | null;
  type: string;
  phone: string;
  website: string;
  gpsCoordinates: { latitude: number; longitude: number } | null;
  placeId: string;
}

export interface SearchPlacesResult {
  placeResults: PlaceResult[];
}

/**
 * Local places / businesses via the Google Maps engine.
 *
 * `location` is the optional SearchAPI `ll` coordinate string, e.g.
 * "@40.7009973,-73.994778,12z" — when omitted, Maps infers a region from the query.
 */
export async function searchPlaces(
  config: SearchPlacesConfig,
  api: any,
  credentialContext: any
): Promise<SearchPlacesResult> {
  const data = await searchApi(api, credentialContext, "google_maps", {
    q: config.query,
    ll: config.location,
    hl: config.language,
  });

  const placeResults: PlaceResult[] = (data.local_results || [])
    .slice(0, config.numResults)
    .map((p: any) => ({
      title: p.title || "",
      address: p.address || "",
      rating: typeof p.rating === "number" ? p.rating : null,
      reviews: typeof p.reviews === "number" ? p.reviews : null,
      type: p.type || (Array.isArray(p.types) ? p.types[0] : "") || "",
      phone: p.phone || "",
      website: p.website || "",
      gpsCoordinates: p.gps_coordinates
        ? {
            latitude: p.gps_coordinates.latitude,
            longitude: p.gps_coordinates.longitude,
          }
        : null,
      placeId: p.place_id || "",
    }));

  return { placeResults };
}
