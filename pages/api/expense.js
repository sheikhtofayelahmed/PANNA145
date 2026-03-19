import clientPromise from "lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  const client = await clientPromise;
  const db = client.db("panna145");
  const configCol = db.collection("expense");
  const entriesCol = db.collection("expenseEntries");

  if (req.method === "GET") {
    const config = await configCol.findOne({});
    const entries = await entriesCol.find({}).sort({ addedAt: 1 }).toArray();

    const gameAmount = entries
      .filter((e) => e.type === "game")
      .reduce((s, e) => s + (e.amount || 0), 0);
    const winAmount = entries
      .filter((e) => e.type === "win")
      .reduce((s, e) => s + (e.amount || 0), 0);

    return res.status(200).json({
      // Backward-compatible fields (visitor page uses these)
      winAmount,
      gameAmount,
      winLabel: config?.winLabel || "LOST",
      gameLabel: config?.gameLabel || "GET",
      // New: individual entries
      entries: entries.map((e) => ({
        id: e._id.toString(),
        type: e.type,
        amount: e.amount || 0,
        note: e.note || "",
        addedAt: e.addedAt,
      })),
    });
  }

  // Add a new entry
  if (req.method === "POST") {
    const { type, amount, note } = req.body;
    if (!type || !["game", "win"].includes(type)) {
      return res.status(400).json({ error: "type must be 'game' or 'win'" });
    }
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      return res.status(400).json({ error: "amount must be a positive number" });
    }
    await entriesCol.insertOne({
      type,
      amount: amt,
      note: note || "",
      addedAt: new Date(),
    });
    return res.status(201).json({ message: "Added" });
  }

  // Delete a single entry OR clear all
  if (req.method === "DELETE") {
    const { id, clearAll } = req.body;
    if (clearAll) {
      await entriesCol.deleteMany({});
      return res.status(200).json({ message: "All entries cleared" });
    }
    if (!id) return res.status(400).json({ error: "id required" });
    await entriesCol.deleteOne({ _id: new ObjectId(id) });
    return res.status(200).json({ message: "Deleted" });
  }

  // Update labels only
  if (req.method === "PUT") {
    const { winLabel, gameLabel } = req.body;
    await configCol.updateOne(
      {},
      { $set: { winLabel: winLabel || "LOST", gameLabel: gameLabel || "GET" } },
      { upsert: true }
    );
    return res.status(200).json({ message: "Updated" });
  }

  return res.status(405).end();
}
