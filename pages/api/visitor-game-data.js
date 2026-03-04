import clientPromise from "lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  const client = await clientPromise;
  const db = client.db("panna145");
  const col = db.collection("visitorGameData");

  if (req.method === "GET") {
    const data = await col.find({}).sort({ createdAt: -1 }).toArray();
    return res.status(200).json({ data });
  }

  if (req.method === "POST") {
    const { agentId, agentName, gameName, totalGame, totalWin, moderatorId } = req.body;
    if (!agentId || !gameName || totalGame == null)
      return res.status(400).json({ error: "agentId, gameName, totalGame required" });

    await col.insertOne({
      agentId,
      agentName: agentName || agentId,
      gameName,
      totalGame: Number(totalGame),
      totalWin: {
        panna: Number(totalWin?.panna || 0),
        single: Number(totalWin?.single || 0),
        jodi: Number(totalWin?.jodi || 0),
      },
      moderatorId: moderatorId || "",
      createdAt: new Date(),
    });
    return res.status(201).json({ message: "Saved" });
  }

  if (req.method === "DELETE") {
    const { id, clearAll } = req.body;

    // Clear all records
    if (clearAll) {
      await col.deleteMany({});
      return res.status(200).json({ message: "All data cleared" });
    }

    // Delete single record
    if (!id) return res.status(400).json({ error: "id required" });
    await col.deleteOne({ _id: new ObjectId(id) });
    return res.status(200).json({ message: "Deleted" });
  }

  return res.status(405).end();
}
