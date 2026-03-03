import clientPromise from "lib/mongodb";

export default async function handler(req, res) {
  const client = await clientPromise;
  const db = client.db("noshib786");
  const col = db.collection("visitorGameData");

  if (req.method === "GET") {
    const data = await col.find({}).sort({ createdAt: -1 }).toArray();
    return res.status(200).json({ data });
  }

  if (req.method === "POST") {
    const { agentId, agentName, gameName, totalGame, totalWin, moderatorId } = req.body;
    if (!agentId || !gameName || totalGame == null) {
      return res.status(400).json({ error: "agentId, gameName, totalGame are required" });
    }

    const doc = {
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
    };

    await col.insertOne(doc);
    return res.status(201).json({ message: "Saved" });
  }

  if (req.method === "DELETE") {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "id required" });
    const { ObjectId } = await import("mongodb");
    await col.deleteOne({ _id: new ObjectId(id) });
    return res.status(200).json({ message: "Deleted" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
