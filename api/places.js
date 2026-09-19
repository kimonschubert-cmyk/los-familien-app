export default async function handler(request) {
  try {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Google API Key fehlt." }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const url = new URL(request.url);

    const query =
      url.searchParams.get("query") ||
      "Familienaktivitäten in Bad Kissingen";

    const body = {
      textQuery: query,
      languageCode: "de",
      regionCode: "DE",
      maxResultCount: 5
    };

    const googleResponse = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.location,places.photos,places.googleMapsUri,places.currentOpeningHours,places.websiteUri,places.rating,places.userRatingCount"
        },
        body: JSON.stringify(body)
      }
    );

    const data = await googleResponse.json();

    if (!googleResponse.ok) {
      return new Response(
        JSON.stringify({
          error: "Google Places Fehler",
          details: data
        }),
        {
          status: googleResponse.status,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const places = (data.places || []).map((place) => {
      const photo = place.photos?.[0];

      return {
        id: place.id,
        name: place.displayName?.text || "Unbekannter Ort",
        address: place.formattedAddress || "",
        location: place.location || null,
        rating: place.rating || null,
        ratingCount: place.userRatingCount || 0,
        website: place.websiteUri || null,
        googleMapsUri: place.googleMapsUri || null,
        openingHours:
          place.currentOpeningHours?.weekdayDescriptions || [],
        photo: photo
          ? {
              name: photo.name,
              width: photo.widthPx,
              height: photo.heightPx,
              authorAttributions:
                photo.authorAttributions || []
            }
          : null
      };
    });

    return new Response(
      JSON.stringify({ places }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store"
        }
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Serverfehler",
        details: error.message
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
