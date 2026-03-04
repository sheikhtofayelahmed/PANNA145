import clientPromise from "lib/mongodb";

export default async function handler(req, res) {
  const client = await clientPromise;
  const db = client.db("panna145");
  const col = db.collection("agents");

  if (req.method === "GET") {
    const list = await col.find({}, { projection: { _id: 0 } }).toArray();
    return res.status(200).json({ agents: list });
  }

  if (req.method === "POST") {
    const { agentId, name, gameDiscount, winDiscount } = req.body;
    if (!agentId?.trim() || !name?.trim())
      return res.status(400).json({ error: "Agent ID and name required" });

    const exists = await col.findOne({ agentId: agentId.trim() });
    if (exists) return res.status(409).json({ error: "Agent ID already exists" });

    await col.insertOne({
      agentId: agentId.trim(),
      name: name.trim(),
      gameDiscount: Number(gameDiscount || 0),
      winDiscount: Number(winDiscount || 0),
    });
    return res.status(201).json({ message: "Agent created" });
  }

  if (req.method === "PUT") {
    const { agentId, name, gameDiscount, winDiscount } = req.body;
    if (!agentId) return res.status(400).json({ error: "agentId required" });

    const update = {};
    if (name?.trim()) update.name = name.trim();
    if (gameDiscount !== undefined) update.gameDiscount = Number(gameDiscount);
    if (winDiscount !== undefined) update.winDiscount = Number(winDiscount);

    await col.updateOne({ agentId }, { $set: update });
    return res.status(200).json({ message: "Updated" });
  }

  if (req.method === "DELETE") {
    const { agentId } = req.body;
    if (!agentId) return res.status(400).json({ error: "agentId required" });
    await col.deleteOne({ agentId });
    return res.status(200).json({ message: "Deleted" });
  }

  return res.status(405).end();
}
