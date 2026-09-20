module.exports = async (req, res) => {
try {
const apiKey = process.env.GOOGLE_PLACES_API_KEY;

if (!apiKey) {
  return res.status(500).json({
    error: String.fromCharCode(71,79,79,71,76,69) + " API KEY fehlt"
  });
}
const query =
  req.query?.query ||
  String.fromCharCode(83,112,105,101,108,112,108,97,101,116,122,101) +
  " in Bad Kissingen";
const response = await fetch(
  "https://places.googleapis.com/v1/places:searchText",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.location,places.photos,places.googleMapsUri,places.rating,places.websiteUri"
    },
    body: JSON.stringify({
      textQuery: query,
      languageCode: "de",
      regionCode: "DE",
      pageSize: 10
    })
  }
);
const data = await response.json();
return res.status(response.status).json(data);

} catch (error) {
return res.status(500).json({
error: “Google Places Anfrage fehlgeschlagen”,
details: error.message
});
}
};
