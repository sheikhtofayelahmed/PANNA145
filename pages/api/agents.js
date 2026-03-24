import clientPromise from "lib/mongodb";

export default async function handler(req, res) {
  const client = await clientPromise;
  const db = client.db("panna145");
  const col = db.collection("agents");

  if (req.method === "GET") {
    const list = await col.find({}, { projection: { _id: 0 } }).sort({ serial: 1 }).toArray();
    return res.status(200).json({ agents: list });
  }

  if (req.method === "POST") {
    const { agentId, name, gameDiscount, winDiscount } = req.body;
    if (!agentId?.trim() || !name?.trim())
      return res.status(400).json({ error: "Agent ID and name required" });

    const exists = await col.findOne({ agentId: agentId.trim() });
    if (exists) return res.status(409).json({ error: "Agent ID already exists" });

    const count = await col.countDocuments();
    await col.insertOne({
      agentId: agentId.trim(),
      name: name.trim(),
      gameDiscount: Number(gameDiscount || 0),
      winDiscount: Number(winDiscount || 0),
      serial: count + 1,
      showExtraGames: false,
    });
    return res.status(201).json({ message: "Agent created" });
  }

  if (req.method === "PUT") {
    const { agentId, name, gameDiscount, winDiscount, serial, showExtraGames, password } = req.body;
    if (!agentId) return res.status(400).json({ error: "agentId required" });

    const update = {};
    if (name?.trim()) update.name = name.trim();
    if (gameDiscount !== undefined) update.gameDiscount = Number(gameDiscount);
    if (winDiscount !== undefined) update.winDiscount = Number(winDiscount);
    if (serial !== undefined && serial !== "") update.serial = Number(serial);
    if (showExtraGames !== undefined) update.showExtraGames = Boolean(showExtraGames);
    if (password !== undefined) update.password = password;

    await col.updateOne({ agentId }, { $set: update });
    return res.status(200).json({ message: "Updated" });
  }

  // Bulk serial update — accepts [{ agentId, serial }]
  if (req.method === "PATCH") {
    const { order } = req.body; // array of { agentId, serial }
    if (!Array.isArray(order)) return res.status(400).json({ error: "order array required" });
    await Promise.all(
      order.map(({ agentId, serial }) =>
        col.updateOne({ agentId }, { $set: { serial } })
      )
    );
    return res.status(200).json({ message: "Order updated" });
  }

  if (req.method === "DELETE") {
    const { agentId } = req.body;
    if (!agentId) return res.status(400).json({ error: "agentId required" });
    await col.deleteOne({ agentId });
    return res.status(200).json({ message: "Deleted" });
  }

  return res.status(405).end();
}
