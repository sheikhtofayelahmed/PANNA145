import clientPromise from "lib/mongodb";
import { ObjectId } from "mongodb";

function saudiNow() {
  // Store as ISO string in Saudi Arabia local time context
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Riyadh" })
  );
}

export default async function handler(req, res) {
  const client = await clientPromise;
  const db = client.db("panna145");
  const col = db.collection("agentDebt");

  // GET: all debts or by agentId
  if (req.method === "GET") {
    const { agentId } = req.query;
    const query = agentId ? { agentId } : {};
    const docs = await col.find(query).sort({ setAt: -1 }).toArray();
    return res.status(200).json({
      debts: docs.map((d) => ({
        id: d._id.toString(),
        agentId: d.agentId,
        type: d.type,
        amount: d.amount,
        note: d.note || "",
        setAt: d.setAt,
      })),
    });
  }

  // POST: add new debt entry for an agent
  if (req.method === "POST") {
    const { agentId, type, amount, note } = req.body;
    if (!agentId || !type || !["agent_gets", "banker_gets"].includes(type))
      return res.status(400).json({ error: "agentId and valid type required" });
    const amt = Number(amount);
    if (isNaN(amt) || amt < 0)
      return res.status(400).json({ error: "Valid amount required" });

    await col.insertOne({
      agentId,
      type,
      amount: amt,
      note: note || "",
      setAt: saudiNow(),
    });
    return res.status(201).json({ message: "Debt entry added" });
  }

  // DELETE: remove a single entry
  if (req.method === "DELETE") {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "id required" });
    await col.deleteOne({ _id: new ObjectId(id) });
    return res.status(200).json({ message: "Deleted" });
  }

  return res.status(405).end();
}
