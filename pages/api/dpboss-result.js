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

function stripTags(str) {
  return str.replace(/<[^>]+>/g, "").trim();
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  // Debug mode — return raw HTML snippet
  const debug = req.query.debug === "1";

  try {
    const response = await fetch("https://dpboss.boston", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://dpboss.boston/",
      },
    });

    if (!response.ok) {
      return res.status(502).json({ error: `HTTP ${response.status} from dpboss.boston` });
    }

    const html = await response.text();

    if (debug) {
      // Return a 2000-char snippet so we can inspect the real structure
      return res.status(200).json({ snippet: html.slice(0, 3000) });
    }

    const results = [];

    // Strategy 1: <div class="my-table ..."> with <h4> name and <td> result
    const blockRegex1 = /<div[^>]*class="[^"]*my-table[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
    let m;
    while ((m = blockRegex1.exec(html)) !== null) {
      const block = m[0];
      const nameMatch = block.match(/<h4[^>]*>([\s\S]*?)<\/h4>/i);
      const resultMatch = block.match(/<td[^>]*>([\s\S]*?)<\/td>/i);
      const timeMatch = block.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
      if (!nameMatch) continue;
      const name = stripTags(nameMatch[1]).toUpperCase();
      if (!WATCHED.includes(name)) continue;
      if (results.find((r) => r.name === name)) continue;
      results.push({
        name,
        result: resultMatch ? stripTags(resultMatch[1]) || "—" : "—",
        time: timeMatch ? stripTags(timeMatch[1]).replace(/\s+/g, " ") : "",
      });
    }

    // Strategy 2: <div class="sta-div ..."> with <h6> name and <a> result
    if (results.length === 0) {
      const blockRegex2 = /<div[^>]*class="[^"]*sta-[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
      while ((m = blockRegex2.exec(html)) !== null) {
        const block = m[0];
        const nameMatch = block.match(/<h6[^>]*>([\s\S]*?)<\/h6>/i);
        const resultMatch = block.match(/<a[^>]*>([\s\S]*?)<\/a>/i);
        const timeMatch = block.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
        if (!nameMatch) continue;
        const name = stripTags(nameMatch[1]).toUpperCase();
        if (!WATCHED.includes(name)) continue;
        if (results.find((r) => r.name === name)) continue;
        results.push({
          name,
          result: resultMatch ? stripTags(resultMatch[1]) || "—" : "—",
          time: timeMatch ? stripTags(timeMatch[1]).replace(/\s+/g, " ") : "",
        });
      }
    }

    // Strategy 3: search for market name directly in text, grab nearby content
    if (results.length === 0) {
      for (const market of WATCHED) {
        // Find the market name in the HTML and grab surrounding 300 chars
        const idx = html.toUpperCase().indexOf(market);
        if (idx === -1) continue;
        const surrounding = html.slice(Math.max(0, idx - 50), idx + 300);
        // Look for result pattern like 123-45-678 or 123-4 or *** nearby
        const resultMatch = surrounding.match(/[\d*]{3}-[\d*]{1,2}(?:-[\d*]{3})?/);
        const timeMatch = surrounding.match(/\d{1,2}:\d{2}\s*[AP]M[\s\S]*?\d{1,2}:\d{2}\s*[AP]M/i);
        if (results.find((r) => r.name === market)) continue;
        results.push({
          name: market,
          result: resultMatch ? resultMatch[0] : "—",
          time: timeMatch ? timeMatch[0].replace(/\s+/g, " ").trim() : "",
        });
      }
    }

    // Fill missing
    const final = WATCHED.map((w) => {
      const found = results.find((r) => r.name === w);
      return found || { name: w, result: "—", time: "" };
    });

    return res.status(200).json({ results: final, fetchedAt: new Date().toISOString() });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
