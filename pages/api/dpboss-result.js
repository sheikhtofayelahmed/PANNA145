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
    const htmlUpper = html.toUpperCase();

    if (debug) {
      return res.status(200).json({ snippet: html.slice(0, 4000) });
    }

    const found = {};

    // Strategy 1: <div class="my-table ..."> — scan each block
    const blockRegex1 = /<div[^>]*class="[^"]*my-table[^"]*"[^>]*>([\s\S]*?)<\/table>/gi;
    let m;
    while ((m = blockRegex1.exec(html)) !== null) {
      const block = m[0];
      const nameMatch = block.match(/<h4[^>]*>([\s\S]*?)<\/h4>/i);
      if (!nameMatch) continue;
      const name = stripTags(nameMatch[1]).toUpperCase();
      if (!WATCHED.includes(name) || found[name]) continue;
      const resultMatch = block.match(/<td[^>]*>([\s\S]*?)<\/td>/i);
      // grab time from after the </table> — look 200 chars ahead
      const afterIdx = m.index + m[0].length;
      const after = html.slice(afterIdx, afterIdx + 200);
      const timeMatch = after.match(/\d{1,2}:\d{2}\s*[AP]M[\s\S]*?\d{1,2}:\d{2}\s*[AP]M/i);
      found[name] = {
        name,
        result: resultMatch ? stripTags(resultMatch[1]) || "—" : "—",
        time: timeMatch ? timeMatch[0].replace(/\s+/g, " ").trim() : "",
      };
    }

    // Strategy 2: <div class="sta-div ..."> with <h6> and <a>
    const blockRegex2 = /<div[^>]*class="[^"]*sta-[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
    while ((m = blockRegex2.exec(html)) !== null) {
      const block = m[0];
      const nameMatch = block.match(/<h6[^>]*>([\s\S]*?)<\/h6>/i);
      if (!nameMatch) continue;
      const name = stripTags(nameMatch[1]).toUpperCase();
      if (!WATCHED.includes(name) || found[name]) continue;
      const resultMatch = block.match(/<a[^>]*>([\s\S]*?)<\/a>/i);
      const timeMatch = block.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
      found[name] = {
        name,
        result: resultMatch ? stripTags(resultMatch[1]) || "—" : "—",
        time: timeMatch ? stripTags(timeMatch[1]).replace(/\s+/g, " ") : "",
      };
    }

    // Strategy 3: for any still-missing market, find name in raw text and grab nearby result
    for (const market of WATCHED) {
      if (found[market]) continue;
      const idx = htmlUpper.indexOf(market);
      if (idx === -1) continue;
      // Grab 400 chars around the market name
      const chunk = html.slice(Math.max(0, idx - 100), idx + 400);
      const resultMatch = chunk.match(/[\d*]{3}-[\d*]{1,2}(?:-[\d*]{3})?/);
      const timeMatch = chunk.match(/\d{1,2}:\d{2}\s*[AP]M[\s\S]{0,10}?\d{1,2}:\d{2}\s*[AP]M/i);
      found[market] = {
        name: market,
        result: resultMatch ? resultMatch[0] : "—",
        time: timeMatch ? timeMatch[0].replace(/\s+/g, " ").trim() : "",
      };
    }

    // Build final list in WATCHED order
    const final = WATCHED.map((w) => found[w] || { name: w, result: "—", time: "" });

    return res.status(200).json({ results: final, fetchedAt: new Date().toISOString() });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
