import clientPromise from "lib/mongodb";

export default async function handler(req, res) {
  const client = await clientPromise;
  const db = client.db("panna145");
  const col = db.collection("summaryHistory");

  if (req.method === "GET") {
    const records = await col.find({}).sort({ clearedAt: -1 }).toArray();
    return res.status(200).json({ records });
  }

  if (req.method === "POST") {
    const {
      date, rows, grandGame, grandWin, grandPL, grandTag,
      expenseWin, expenseLabelWin, expenseGame, expenseLabelGame,
      totalWinDisc, adjustedGrandPL, adjustedGrandTag,
    } = req.body;
    if (!rows) return res.status(400).json({ error: "rows required" });
    await col.insertOne({
      date,
      rows,
      grandGame,
      grandWin,
      grandPL,
      grandTag,
      expenseWin: expenseWin ?? 0,
      expenseLabelWin: expenseLabelWin || "Expense (Win)",
      expenseGame: expenseGame ?? 0,
      expenseLabelGame: expenseLabelGame || "Expense (Game)",
      totalWinDisc: totalWinDisc ?? 0,
      adjustedGrandPL: adjustedGrandPL ?? grandPL,
      adjustedGrandTag: adjustedGrandTag ?? grandTag,
      clearedAt: new Date(),
    });
    return res.status(201).json({ message: "Saved" });
  }

  return res.status(405).end();
}
