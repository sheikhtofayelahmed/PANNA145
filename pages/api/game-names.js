import clientPromise from "lib/mongodb";

export default async function handler(req, res) {
  const client = await clientPromise;
  const db = client.db("panna145");
  const col = db.collection("gameNames");

  if (req.method === "GET") {
    const list = await col.find({}).sort({ createdAt: 1, _id: 1 }).toArray();
    return res.status(200).json({ gameNames: list });
  }

  if (req.method === "POST") {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "Name required" });
    const trimmed = name.trim().toUpperCase();
    const exists = await col.findOne({ name: trimmed });
    if (exists) return res.status(409).json({ error: "Already exists" });
    await col.insertOne({ name: trimmed, createdAt: new Date() });
    return res.status(201).json({ message: "Added" });
  }

  if (req.method === "DELETE") {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Name required" });
    await col.deleteOne({ name: name.trim().toUpperCase() });
    return res.status(200).json({ message: "Deleted" });
  }

  return res.status(405).end();
}
