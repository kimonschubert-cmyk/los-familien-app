const CODE_PATTERN =
  /(?:rabattcode|gutscheincode|promo(?:tion)?code|aktionscode)\s*[:=]?\s*([A-Z0-9][A-Z0-9-]{3,19})/i;

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

  const websiteUrl =
    req.query.url;

  if (!websiteUrl) {
    return res.status(400).json({
      error: "Offizielle Website fehlt"
    });
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(websiteUrl);
  } catch (error) {
    return res.status(400).json({
      error: "Ungültige Website-Adresse"
    });
  }

  if (
    !["http:", "https:"].includes(
      parsedUrl.protocol
    )
  ) {
    return res.status(400).json({
      error: "Website-Adresse muss http oder https verwenden"
    });
  }

  try {
    const response = await fetch(
      parsedUrl,
      {
        headers: {
          "User-Agent":
            "LOS-Familien-App-Rabattpruefung/1.0"
        },
        signal: AbortSignal.timeout(8000)
      }
    );

    if (!response.ok) {
      return res.status(200).json({
        verified: false,
        sourceUrl: parsedUrl.toString()
      });
    }

    const html =
      await response.text();

    const visibleText =
      html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ");

    const match =
      visibleText.match(
        CODE_PATTERN
      );

    if (!match) {
      return res.status(200).json({
        verified: false,
        sourceUrl: parsedUrl.toString(),
        checkedAt: new Date().toISOString()
      });
    }

    return res.status(200).json({
      verified: true,
      code: match[1].toUpperCase(),
      sourceUrl: parsedUrl.toString(),
      checkedAt: new Date().toISOString()
    });

  } catch (error) {
    return res.status(200).json({
      verified: false,
      sourceUrl: parsedUrl.toString(),
      checkedAt: new Date().toISOString()
    });
  }

};
