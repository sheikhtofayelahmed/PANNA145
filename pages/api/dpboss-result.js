const WATCHED_MARKETS = [
  "KALYAN",
  "KALYAN NIGHT",
  "RAJDHANI DAY",
  "RAJDHANI NIGHT",
  "MILAN DAY",
  "MILAN NIGHT",
  "KAALI",
  "TEEN PATTI",
  "DURGA NIGHT",
];

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, no-cache");

  const debug = req.query.debug === "1";

  try {
    const response = await fetch("https://dpboss.boston", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://dpboss.boston/",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return res.status(502).json({ error: `HTTP ${response.status} from dpboss.boston` });
    }

    const html = await response.text();

    if (debug) {
      return res.status(200).json({ snippet: html.slice(0, 5000) });
    }

    const markets = [];

    // Real structure: <h4>MARKET NAME</h4><span>RESULT</span><p>TIME</p>
    const blockRe = /<h4>([^<]+)<\/h4>\s*<span>([^<]*)<\/span>\s*<p>([^<]*)<\/p>/g;
    let match;
    while ((match = blockRe.exec(html)) !== null) {
      const name = match[1].trim().toUpperCase();
      const result = match[2].trim();
      const time = match[3].replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
      if (WATCHED_MARKETS.includes(name)) {
        if (!markets.find((m) => m.name === name)) {
          markets.push({ name, result: result || null, time });
        }
      }
    }

    // Sort by WATCHED order, fill missing
    const final = WATCHED_MARKETS.map((w) => {
      const found = markets.find((m) => m.name === w);
      return found || { name: w, result: null, time: "" };
    });

    return res.status(200).json({
      markets: final,
      fetchedAt: new Date().toISOString(),
      source: "live",
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
