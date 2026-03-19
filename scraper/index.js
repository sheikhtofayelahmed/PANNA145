/**
 * dpboss.boston result scraper
 * Runs on Oracle Free VPS (Bahrain/UAE region)
 * Polls dpboss.boston every 3 seconds, saves to MongoDB when result changes
 *
 * Setup:
 *   npm install
 *   MONGO_URI="mongodb+srv://..." node index.js
 *
 * Keep alive with PM2:
 *   npm install -g pm2
 *   pm2 start index.js --name dpboss-scraper
 *   pm2 save && pm2 startup
 */

const { MongoClient } = require("mongodb");

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = "panna145";
const COLLECTION = "dpbossResults";
const POLL_MS = 3000;

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

if (!MONGO_URI) {
  console.error("ERROR: MONGO_URI environment variable is not set");
  console.error("Usage: MONGO_URI=\"mongodb+srv://...\" node index.js");
  process.exit(1);
}

let client;
let col;

async function connect() {
  client = new MongoClient(MONGO_URI);
  await client.connect();
  col = client.db(DB_NAME).collection(COLLECTION);
  console.log("Connected to MongoDB");
}

function isWatched(name) {
  return WATCHED_MARKETS.includes(name.toUpperCase().trim());
}

function parseMarkets(html) {
  const markets = [];
  const blockRe = /<h4>([^<]+)<\/h4>\s*<span>([^<]*)<\/span>\s*<p>([^<]*)<\/p>/g;
  let match;
  while ((match = blockRe.exec(html)) !== null) {
    const name = match[1].trim();
    const result = match[2].trim();
    const time = match[3].replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
    if (name && isWatched(name)) {
      markets.push({ name, result: result || null, time });
    }
  }
  return markets;
}

async function scrape() {
  try {
    const res = await fetch("https://dpboss.boston", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.error(`Upstream ${res.status} at ${new Date().toISOString()}`);
      return;
    }

    const html = await res.text();
    const markets = parseMarkets(html);
    const now = new Date();

    for (const m of markets) {
      const existing = await col.findOne({ market: m.name });

      if (!existing) {
        // First time seeing this market
        await col.insertOne({
          market: m.name,
          result: m.result,
          time: m.time,
          fetchedAt: now,
          changedAt: now,
        });
        console.log(`[NEW]     ${m.name} → ${m.result}`);
      } else if (existing.result !== m.result) {
        // Result changed
        await col.updateOne(
          { market: m.name },
          { $set: { result: m.result, time: m.time, fetchedAt: now, changedAt: now } }
        );
        console.log(`[UPDATED] ${m.name} → ${m.result} (was: ${existing.result})`);
      } else {
        // No change — just update fetchedAt silently
        await col.updateOne(
          { market: m.name },
          { $set: { fetchedAt: now } }
        );
      }
    }
  } catch (err) {
    if (err.name === "TimeoutError") {
      console.error("Fetch timeout — will retry");
    } else {
      console.error("Scrape error:", err.message);
    }
  }
}

async function main() {
  await connect();
  console.log(`Polling dpboss.boston every ${POLL_MS / 1000}s...`);
  console.log(`Watching: ${WATCHED_MARKETS.join(", ")}`);

  // Run immediately, then on interval
  await scrape();
  setInterval(scrape, POLL_MS);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
