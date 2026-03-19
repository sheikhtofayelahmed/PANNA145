const WATCHED = [
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
  // Allow CORS for client-side polling
  res.setHeader("Cache-Control", "no-store");

  try {
    const response = await fetch("https://dpboss.boston", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!response.ok) {
      return res.status(502).json({ error: "Failed to fetch dpboss.boston" });
    }

    const html = await response.text();

    // Extract all sta-div blocks (handles multiline)
    const blockRegex = /<div[^>]*class="[^"]*sta-[^"]*"[^>]*>([\s\S]*?)<\/div>/g;
    const results = [];
    let match;

    while ((match = blockRegex.exec(html)) !== null) {
      const block = match[0];

      const nameMatch = block.match(/<h6[^>]*>([\s\S]*?)<\/h6>/i);
      const resultMatch = block.match(/<a[^>]*>([\s\S]*?)<\/a>/i);
      const timeMatch = block.match(/<p[^>]*>([\s\S]*?)<\/p>/i);

      if (!nameMatch) continue;

      // Strip any HTML tags inside h6 (e.g. <span>)
      const rawName = nameMatch[1].replace(/<[^>]+>/g, "").trim().toUpperCase();

      // Exact match only — prevents KALYAN MORNING matching KALYAN
      if (!WATCHED.includes(rawName)) continue;

      // Avoid duplicates (take first occurrence)
      if (results.find((r) => r.name === rawName)) continue;

      const rawResult = resultMatch
        ? resultMatch[1].replace(/<[^>]+>/g, "").trim()
        : "—";
      const rawTime = timeMatch
        ? timeMatch[1].replace(/<[^>]+>/g, "").trim().replace(/\s+/g, " ")
        : "";

      results.push({ name: rawName, result: rawResult, time: rawTime });
    }

    // Sort by WATCHED order
    results.sort(
      (a, b) => WATCHED.indexOf(a.name) - WATCHED.indexOf(b.name)
    );

    // Fill in any missing watched markets as placeholder
    const final = WATCHED.map((w) => {
      const found = results.find((r) => r.name === w);
      return found || { name: w, result: "—", time: "" };
    });

    return res.status(200).json({
      results: final,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
