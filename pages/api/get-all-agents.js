import clientPromise from "lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const client = await clientPromise;
    const db = client.db("noshib786");
    const agents = await db
      .collection("agents")
      .find({}, { projection: { agentId: 1, name: 1, _id: 0 } })
      .toArray();
    return res.status(200).json({ agents });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}
