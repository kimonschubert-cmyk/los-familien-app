const redisUrl =
  process.env.KV_REST_API_URL ||
  process.env.UPSTASH_REDIS_REST_URL;

const redisToken =
  process.env.KV_REST_API_TOKEN ||
  process.env.UPSTASH_REDIS_REST_TOKEN;

const deviceSetKey =
  "los:unique-devices";

const deviceRatingsKey =
  "los:device-ratings";

async function redisCommand(command) {
  const response = await fetch(redisUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${redisToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(command)
  });

  if (!response.ok) {
    throw new Error("Persistenter Zähler nicht erreichbar.");
  }

  return response.json();
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Methode nicht erlaubt"
    });
  }

  if (!redisUrl || !redisToken) {
    return res.status(503).json({
      error: "Gerätezaehler ist noch nicht konfiguriert"
    });
  }

  const deviceId =
    typeof req.body?.deviceId === "string"
      ? req.body.deviceId.trim()
      : "";

  const requestedRating =
    Number(req.body?.rating);

  const hasRating =
    Number.isInteger(requestedRating) &&
    requestedRating >= 1 &&
    requestedRating <= 5;

  if (!/^[a-zA-Z0-9-]{20,100}$/.test(deviceId)) {
    return res.status(400).json({
      error: "Ungueltige Gerätekennung"
    });
  }

  try {
    if (
      req.body?.rating !== undefined &&
      !hasRating
    ) {
      return res.status(400).json({
        error: "Bewertung muss zwischen 1 und 5 liegen"
      });
    }

    await redisCommand([
      "SADD",
      deviceSetKey,
      deviceId
    ]);

    if (hasRating) {
      await redisCommand([
        "HSET",
        deviceRatingsKey,
        deviceId,
        String(requestedRating)
      ]);
    }

    const countResult = await redisCommand([
      "SCARD",
      deviceSetKey
    ]);

    const ratingsResult = await redisCommand([
      "HGETALL",
      deviceRatingsKey
    ]);

    const deviceRatingResult = await redisCommand([
      "HGET",
      deviceRatingsKey,
      deviceId
    ]);

    const rawRatings =
      ratingsResult.result;

    const ratingValues =
      Array.isArray(rawRatings)
        ? rawRatings.filter((_, index) => index % 2 === 1)
        : Object.values(rawRatings || {});

    const ratings = ratingValues
      .map(value => Number(value))
      .filter(value => Number.isFinite(value) && value >= 1 && value <= 5);

    const average = ratings.length
      ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length
      : null;

    return res.status(200).json({
      count: Number(countResult.result || 0),
      average,
      rating: deviceRatingResult.result
        ? Number(deviceRatingResult.result)
        : null
    });
  } catch (error) {
    return res.status(503).json({
      error: "Gerätezahl momentan nicht verfügbar"
    });
  }
};
