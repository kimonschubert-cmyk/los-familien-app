export default async function handler(request) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: "GOOGLE_PLACES_API_KEY fehlt"
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }

  const response = await fetch(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.location,places.photos,places.googleMapsUri"
      },

      body: JSON.stringify({
        textQuery: "Spielplatz Bad Kissingen",
        languageCode: "de",
        regionCode: "DE",
        maxResultCount: 5
      })
    }
  );

  const data = await response.json();

  return new Response(
    JSON.stringify(data),
    {
      status: response.status,
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
}
