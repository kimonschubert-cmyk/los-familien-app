module.exports = async (req, res) => {

  res.setHeader(
    "Access-Control-Allow-Origin",
    "*"
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  try {

    const apiKey =
      process.env.GOOGLE_PLACES_API_KEY;

    if (!apiKey) {

      return res.status(500).json({
        error: "GOOGLE_PLACES_API_KEY fehlt"
      });

    }

    const query =
      req.query.query ||
      "Spielplätze in Bad Kissingen";

    const response =
      await fetch(
        "https://places.googleapis.com/v1/places:searchText",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",

            "X-Goog-Api-Key":
              apiKey,

            "X-Goog-FieldMask":
              "places.id,places.displayName,places.formattedAddress,places.location,places.googleMapsUri,places.rating,places.websiteUri,places.businessStatus,places.regularOpeningHours,places.currentOpeningHours,places.priceLevel,places.priceRange"
          },

          body: JSON.stringify({

            textQuery: query,

            languageCode: "de",

            regionCode: "DE",

            pageSize: 20

          })
        }
      );

    const data =
      await response.json();

    return res
      .status(response.status)
      .json(data);

  } catch (error) {

    return res.status(500).json({

      error: "Google Places Fehler",

      details: error.message

    });

  }

};
