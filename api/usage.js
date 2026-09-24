const redisUrl =
  process.env.KV_REST_API_URL ||
  process.env.UPSTASH_REDIS_REST_URL;

const redisToken =
  process.env.KV_REST_API_TOKEN ||
  process.env.UPSTASH_REDIS_REST_TOKEN;

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

  if (!/^[a-zA-Z0-9-]{20,100}$/.test(deviceId)) {
    return res.status(400).json({
      error: "Ungueltige Gerätekennung"
    });
  }

  try {
    await redisCommand([
      "SADD",
      "los:unique-devices",
      deviceId
    ]);

    const result = await redisCommand([
      "SCARD",
      "los:unique-devices"
    ]);

    return res.status(200).json({
      count: Number(result.result || 0)
    });
  } catch (error) {
    return res.status(503).json({
      error: "Gerätezahl momentan nicht verfügbar"
    });
  }
};
