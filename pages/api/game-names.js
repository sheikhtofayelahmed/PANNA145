import clientPromise from "lib/mongodb";

export default async function handler(req, res) {
  const client = await clientPromise;
  const db = client.db("noshib786");
  const col = db.collection("gameNames");

  if (req.method === "GET") {
    const names = await col.find({}).sort({ createdAt: 1 }).toArray();
    return res.status(200).json({ gameNames: names });
  }

  if (req.method === "POST") {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Game name is required" });
    }
    const trimmed = name.trim().toUpperCase();
    const existing = await col.findOne({ name: trimmed });
    if (existing) {
      return res.status(409).json({ error: "Game name already exists" });
    }
    await col.insertOne({ name: trimmed, createdAt: new Date() });
    return res.status(201).json({ message: "Game name added" });
  }

  if (req.method === "DELETE") {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Name required" });
    await col.deleteOne({ name: name.trim().toUpperCase() });
    return res.status(200).json({ message: "Deleted" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
