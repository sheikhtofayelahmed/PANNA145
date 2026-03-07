import clientPromise from "lib/mongodb";

export default async function handler(req, res) {
  const client = await clientPromise;
  const db = client.db("panna145");
  const col = db.collection("plHistory");

  if (req.method === "GET") {
    const records = await col.find({}).sort({ clearedAt: -1 }).toArray();
    const totalPL = records.reduce((sum, r) => sum + (r.pl || 0), 0);
    return res.status(200).json({ records, totalPL });
  }

  if (req.method === "POST") {
    const { pl } = req.body;
    if (pl == null) return res.status(400).json({ error: "pl required" });
    await col.insertOne({
      pl: Number(pl),
      clearedAt: new Date(),
    });
    return res.status(201).json({ message: "Saved" });
  }

  return res.status(405).end();
}
