import clientPromise from "lib/mongodb";
import { serialize } from "cookie";

export default async function handler(req, res) {
  const client = await clientPromise;
  const db = client.db("panna145");
  const col = db.collection("agents");

  // Check session
  if (req.method === "GET") {
    const cookie = req.cookies["agent-auth"];
    if (!cookie) return res.status(401).json({ error: "Not logged in" });
    try {
      const session = JSON.parse(cookie);
      if (!session.agentId) return res.status(401).json({ error: "Invalid session" });
      return res.status(200).json({ agentId: session.agentId });
    } catch {
      return res.status(401).json({ error: "Invalid session" });
    }
  }

  // Login
  if (req.method === "POST") {
    const { agentId, password } = req.body;
    if (!agentId || !password)
      return res.status(400).json({ error: "agentId and password required" });

    const agent = await col.findOne({ agentId: agentId.trim() });
    if (!agent || !agent.password || agent.password !== password)
      return res.status(401).json({ error: "Invalid credentials" });

    const cookie = serialize(
      "agent-auth",
      JSON.stringify({ agentId: agent.agentId }),
      { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 7, sameSite: "lax" }
    );
    res.setHeader("Set-Cookie", cookie);
    return res.status(200).json({ agentId: agent.agentId, name: agent.name });
  }

  // Logout
  if (req.method === "DELETE") {
    res.setHeader(
      "Set-Cookie",
      serialize("agent-auth", "", { httpOnly: true, path: "/", maxAge: 0 })
    );
    return res.status(200).json({ message: "Logged out" });
  }

  return res.status(405).end();
}
