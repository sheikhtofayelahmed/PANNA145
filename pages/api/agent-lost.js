import clientPromise from "lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  const client = await clientPromise;
  const db = client.db("panna145");
  const col = db.collection("agentLost");

  // GET: all lost data or by agentId
  if (req.method === "GET") {
    const { agentId } = req.query;
    const query = agentId ? { agentId } : {};
    const docs = await col.find(query).sort({ agentId: 1 }).toArray();
    return res.status(200).json({
      lostData: docs.map((d) => ({
        id: d._id.toString(),
        agentId: d.agentId,
        total: d.total || 0,
        entries: (d.entries || []).map((e) => ({
          id: e._id?.toString(),
          amount: e.amount,
          note: e.note || "",
          addedAt: e.addedAt,
        })),
      })),
    });
  }

  // POST: add to agent's cumulative lost amount
  if (req.method === "POST") {
    const { agentId, amount, note } = req.body;
    if (!agentId) return res.status(400).json({ error: "agentId required" });
    const amt = Number(amount);
    if (!amt || amt <= 0)
      return res.status(400).json({ error: "Positive amount required" });

    const entry = {
      _id: new ObjectId(),
      amount: amt,
      note: note || "",
      addedAt: new Date(
        new Date().toLocaleString("en-US", { timeZone: "Asia/Riyadh" })
      ),
    };
    await col.updateOne(
      { agentId },
      { $inc: { total: amt }, $push: { entries: entry } },
      { upsert: true }
    );
    return res.status(200).json({ message: "Added" });
  }

  // DELETE: remove a single entry or clear agent's lost
  if (req.method === "DELETE") {
    const { agentId, entryId, clearAgent } = req.body;
    if (!agentId) return res.status(400).json({ error: "agentId required" });

    if (clearAgent) {
      await col.deleteOne({ agentId });
      return res.status(200).json({ message: "Cleared" });
    }

    if (entryId) {
      const doc = await col.findOne({ agentId });
      if (!doc) return res.status(404).json({ error: "Not found" });
      const entry = (doc.entries || []).find(
        (e) => e._id?.toString() === entryId
      );
      if (!entry) return res.status(404).json({ error: "Entry not found" });
      await col.updateOne(
        { agentId },
        {
          $inc: { total: -entry.amount },
          $pull: { entries: { _id: entry._id } },
        }
      );
      return res.status(200).json({ message: "Deleted" });
    }

    return res.status(400).json({ error: "entryId or clearAgent required" });
  }

  return res.status(405).end();
}
