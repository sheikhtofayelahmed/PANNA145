import clientPromise from "lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { agentId } = req.query;

  if (!agentId) {
    return res.status(400).json({ message: "Missing agentId in query" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("noshib786");

    const agent = await db.collection("agents").findOne({ agentId });

    if (!agent) {
      return res.status(404).json({ message: "Agent not found" });
    }

    res.status(200).json({ agent });
  } catch (error) {
    console.error("Error fetching agent by ID:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
