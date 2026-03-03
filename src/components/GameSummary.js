"use client";
import { useEffect, useState } from "react";
import React, { useRef } from "react";
import ScrollToTopButton from "./ScrollToTopButton";
import { GitCompareArrows } from "lucide-react";
const GameSummary = ({ agentId, admin, moderatorId }) => {
  const [loading, setLoading] = useState(true);
  const [fetched, setFetched] = useState(false);
  const [isGameOn, setIsGameOn] = useState(null);
  const [players, setPlayers] = useState([]);
  const [threeUp, setThreeUp] = useState();
  const [downGame, setDownGame] = useState();
  const [date, setDate] = useState(null);
  const [totalWins, setTotalWins] = useState({});
  const [agent, setAgent] = useState({});
  const [error, setError] = useState("");
  const [moneyCal, setMoneyCal] = useState({});
  const [uploadStatus, setUploadStatus] = useState(null);
  const hasUploadedRef = useRef(false);
  const contentRef = useRef(null);
  const contentAllRef = useRef(null);
  const playerRefs = useRef({});
  const voucherTableRef = useRef(null);
  const [summaryData, setSummaryData] = useState(null);
  const [selectedOption, setSelectedOption] = useState("");
  const [numberInput, setNumberInput] = useState(0);
  const [thisGame, setThisGame] = useState("");
  const [thisGameAmt, setThisGameAmt] = useState("");
  const [exGame, setExGame] = useState("");
  const [exGameAmt, setExGameAmt] = useState("");
  const [currentGame, setCurrentGame] = useState("");
  const [currentGameOperation, setCurrentGameOperation] = useState("");
  const [currentGameAmt, setCurrentGameAmt] = useState("");

  // Single useEffect to fetch all initial data that depends on agentId
  const fetchAllData = async () => {
    try {
      // 1. Fetch game status and winning numbers in parallel
      const [gameStatusRes, winStatusRes] = await Promise.all([
        fetch("/api/game-status"),
        fetch("/api/win-status"),
      ]);

      const gameStatusData = await gameStatusRes.json();
      const winStatusData = await winStatusRes.json();
      const winDate = winStatusData.date ? new Date(winStatusData.date) : null;

      setIsGameOn(gameStatusData.isGameOn);
      if (winStatusData.winStatus) {
        setThreeUp(winStatusData.threeUp);
        setDownGame(winStatusData.downGame);
        setDate(winStatusData.gameDate);
      }

      // 2. Fetch agent info
      const agentRes = await fetch(`/api/getAgentById?agentId=${agentId}`);
      if (!agentRes.ok) throw new Error("Failed to fetch agent data");
      const agentData = await agentRes.json();
      console.log("Fetched agent data:", agentData);
      setAgent(agentData.agent);

      // 3. Fetch summary

      const query = new URLSearchParams({
        agentId,
        gameDate: winStatusData.gameDate,
      }).toString();

      try {
        const summaryRes = await fetch(`/api/get-summaries-id-date?${query}`);
        if (!summaryRes.ok) {
          console.warn("⚠️ Could not fetch summary");
        } else {
          const res = await summaryRes.json();
          const data = res.summary;
          if (winStatusData.winStatus) {
            setSummaryData(data || {});
          }
        }
      } catch (summaryErr) {
        console.error("❌ Error fetching summary:", summaryErr);
      }

      // 4. Fetch players
      try {
        const playersRes = await fetch("/api/getPlayersByAgentId", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agentId }),
        });

        if (!playersRes.ok) {
          const errMsg = await playersRes.text();
          setError("⚠️ Could not load players: " + errMsg);
          setPlayers([]);
          return;
        }

        const playersJson = await playersRes.json();
        console.log("Fetched players:", playersJson);
        setPlayers(playersJson.players || []);
      } catch (err) {
        console.error("❌ Error fetching players:", err);
        setError("❌ Network error: " + err.message);
      }
    } catch (err) {
      console.error("❌ Error in fetchAllData:", err);
      setError("❌ Unexpected error occurred");
    } finally {
      setLoading(false);
      setFetched(true);
    }
  };
  useEffect(() => {
    if (!agentId) return;

    setLoading(true);
    setFetched(false);
    setError("");

    fetchAllData();
  }, [agentId]);

  useEffect(() => {
    if (!players) return;

    const totalAmounts = players.reduce(
      (acc, p) => {
        acc.ThreeD += p.amountPlayed?.ThreeD || 0;
        acc.TwoD += p.amountPlayed?.TwoD || 0;
        acc.OneD += p.amountPlayed?.OneD || 0;
        return acc;
      },
      { ThreeD: 0, TwoD: 0, OneD: 0 },
    );

    setMoneyCal({
      totalAmounts,
    });
  }, [players]);

  function getPermutations(numStr) {
    if (numStr.length !== 3) return [];

    const perms = new Set();

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (i === j) continue;
        for (let k = 0; k < 3; k++) {
          if (i === k || j === k) continue;
          const perm = numStr[i] + numStr[j] + numStr[k];
          if (perm !== numStr) perms.add(perm);
        }
      }
    }

    return [...perms];
  }

  const getMatchType = (input, threeUp, downGame) => {
    if (!input || !threeUp || !downGame) return { match: false, type: null };
    const number = input.num;
    const permutations = getPermutations(threeUp);
    const reversedDown = downGame.split("").reverse().join("");

    if (number.length === 3) {
      if (number === threeUp) return { match: true, type: "exact3" };
      if (permutations.includes(number)) return { match: true, type: "perm3" };
    }

    if (number.length === 2) {
      if (number === downGame) return { match: true, type: "exact2" };
      if (number === reversedDown) return { match: true, type: "reverse2" };
    }

    if (number.length === 1 && threeUp.includes(number)) {
      return { match: true, type: "single" };
    }

    return { match: false, type: null };
  };

  useEffect(() => {
    setThisGame(summaryData?.calculation?.thisGame);
    setThisGameAmt(summaryData?.calculation?.thisGameAmt);
    setExGame(summaryData?.calculation?.exGame);
    setExGameAmt(summaryData?.calculation?.exGameAmt);
    setCurrentGame(summaryData?.calculation?.finalCalType);
    setCurrentGameAmt(summaryData?.calculation?.finalCalAmt);
    // setCurrentGameOperation(summaryData?.calculation?.currentGameOperation);
    // setFinalCalType(summaryData?.calculation?.finalCalType);
    // setFinalCalAmt(summaryData?.calculation?.finalCalAmt);
    // setFinalCalOperation(summaryData?.calculation?.finalCalOperation);
  }, [summaryData]);

  const handleCopyAndUpload = async (player) => {
    try {
      const newName = prompt("Enter new name to copy and upload:");
      if (!newName) return;

      const newVoucher = `${player.voucher}-copy`;

      const payload = {
        voucher: newVoucher,
        agentId: player.agentId,
        agentName: player.agentName,
        name: newName,
        data: player.entries.map((e) => ({
          input: {
            num: e.input.num,
            str: e.input.str,
            rumble: e.input.rumble,
          },
        })),
        amountPlayed: player.amountPlayed,
        cPercentages: player.cPercentages,
        percentages: player.percentages,
        moderatorId,
      };

      const res = await fetch("/api/savePlayer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(`❌ Upload failed: ${data.message}`);
        return;
      }

      alert(`✅ Copied & uploaded as ${newVoucher} for ${newName}`);
      try {
        await fetchAllData();
      } catch (err) {
        console.error("Error refreshing data after copy:", err);
      }
    } catch (err) {
      console.error("Error copying player:", err);
      alert("⚠️ Failed to copy and upload player.");
    }
  };

  const handlePrintVoucherTable = () => {
    if (!voucherTableRef.current) return;
    const tableHTML = voucherTableRef.current.innerHTML;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Voucher - ${agentId}</title>
          <style>
            body { font-family: Cambria, 'Times New Roman', Times, serif; margin: 20px; color: #000; }
            h2 { text-align: center; margin-bottom: 4px; }
            p.sub { text-align: center; color: #555; margin-bottom: 12px; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; font-size: 13px; table-layout: fixed; }
            th, td { border: 1px solid #000; padding: 6px 8px; }
            td { text-align: center; }
            tr:last-child { font-weight: bold;  }
            @media print {
              body { margin: 10px; }
              @page { size: auto; margin: 10mm; }
            }
          </style>
        </head>
        <body>
          <h2>Voucher Breakdown</h2>
          <p class="sub">Agent: ${agentId} | ${agent?.name || ""} | ${date || ""}</p>
          ${tableHTML}
          <script>window.onload = function(){ window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin-slow text-8xl text-yellow-300">.</div>
      </div>
    );
  if (fetched && players.length === 0)
    return <p>No players found for this agent.</p>;

  return (
    <div className=" min-h-screen p-6 bg-gradient-to-br from-black via-gray-900 to-black text-white font-mono">
      {!loading && fetched && players.length === 0 && (
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-pink-400 text-3xl font-bold text-center">
            😕 No data found for this agent.
          </p>
        </div>
      )}
      {!loading && players.length >= 0 && (
        <div className="mt-8 w-full">
          {/* Voucher Breakdown Table - Excel style */}
          <div className="overflow-x-auto mt-8 mb-8 max-w-4xl mx-auto">
            <div className="bg-white p-4 rounded-lg shadow-md ring-2 ring-gray-400">
              <div className="flex justify-between items-center mb-3">
                <div></div>
                <h3 className="text-center text-lg font-bold text-black">
                  Voucher - {agentId} ||{" "}
                  {date ? new Date(date).toLocaleDateString() : ""} || {threeUp}{" "}
                  = {downGame}
                </h3>
                <button
                  onClick={handlePrintVoucherTable}
                  className="px-3 py-1 bg-blue-600 text-white text-sm font-bold rounded hover:bg-blue-700 transition"
                  title="Print / Save as PDF">
                  🖨️ Print
                </button>
              </div>
              <div ref={voucherTableRef}>
                <table
                  className="w-full border-collapse text-sm text-black text-center"
                  style={{
                    border: "1px solid #000",
                    tableLayout: "fixed",
                    fontFamily: "Cambria, 'Times New Roman', Times, serif",
                  }}>
                  <thead>
                    <tr
                      style={{
                        backgroundColor: "#e2e8f0",
                        textAlign: "center",
                      }}>
                      <th
                        style={{
                          border: "1px solid #000",
                          padding: "6px 8px",
                        }}>
                        Page:
                      </th>
                      <th
                        style={{
                          border: "1px solid #000",
                          padding: "6px 8px",
                        }}>
                        3D
                      </th>
                      <th
                        style={{
                          border: "1px solid #000",
                          padding: "6px 8px",
                        }}>
                        2D
                      </th>
                      <th
                        style={{
                          border: "1px solid #000",
                          padding: "6px 8px",
                        }}>
                        1D
                      </th>
                      <th
                        style={{
                          border: "1px solid #000",
                          padding: "6px 8px",
                        }}>
                        STR
                      </th>
                      <th
                        style={{
                          border: "1px solid #000",
                          padding: "6px 8px",
                        }}>
                        RUM
                      </th>
                      <th
                        style={{
                          border: "1px solid #000",
                          padding: "6px 8px",
                        }}>
                        DOWN
                      </th>
                      <th
                        style={{
                          border: "1px solid #000",
                          padding: "6px 8px",
                        }}>
                        SINGLE
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryData?.voucherBreakdown
                      ? summaryData.voucherBreakdown.map((v, i) => (
                          <tr
                            key={i}
                            style={{
                              backgroundColor: i % 2 === 0 ? "#fff" : "#f7fafc",
                            }}>
                            <td
                              style={{
                                border: "1px solid #000",
                                padding: "4px 8px",
                              }}>
                              {v.playerName}
                            </td>
                            <td
                              style={{
                                border: "1px solid #000",
                                padding: "4px 8px",
                                textAlign: "center",
                              }}>
                              {v.threeD}
                            </td>
                            <td
                              style={{
                                border: "1px solid #000",
                                padding: "4px 8px",
                                textAlign: "center",
                              }}>
                              {v.twoD}
                            </td>
                            <td
                              style={{
                                border: "1px solid #000",
                                padding: "4px 8px",
                                textAlign: "center",
                              }}>
                              {v.oneD}
                            </td>
                            <td
                              style={{
                                border: "1px solid #000",
                                padding: "4px 8px",
                                textAlign: "center",
                              }}>
                              {v.str}
                            </td>
                            <td
                              style={{
                                border: "1px solid #000",
                                padding: "4px 8px",
                                textAlign: "center",
                              }}>
                              {v.rum}
                            </td>
                            <td
                              style={{
                                border: "1px solid #000",
                                padding: "4px 8px",
                                textAlign: "center",
                              }}>
                              {v.down}
                            </td>
                            <td
                              style={{
                                border: "1px solid #000",
                                padding: "4px 8px",
                                textAlign: "center",
                              }}>
                              {v.single}
                            </td>
                          </tr>
                        ))
                      : players.map((p, i) => (
                          <tr
                            key={i}
                            style={{
                              backgroundColor: i % 2 === 0 ? "#fff" : "#f7fafc",
                            }}>
                            <td
                              style={{
                                border: "1px solid #000",
                                padding: "4px 8px",
                              }}>
                              {p.name}
                            </td>
                            <td
                              style={{
                                border: "1px solid #000",
                                padding: "4px 8px",
                                textAlign: "center",
                              }}>
                              {p.amountPlayed?.ThreeD || 0}
                            </td>
                            <td
                              style={{
                                border: "1px solid #000",
                                padding: "4px 8px",
                                textAlign: "center",
                              }}>
                              {p.amountPlayed?.TwoD || 0}
                            </td>
                            <td
                              style={{
                                border: "1px solid #000",
                                padding: "4px 8px",
                                textAlign: "center",
                              }}>
                              {p.amountPlayed?.OneD || 0}
                            </td>
                            <td
                              style={{
                                border: "1px solid #000",
                                padding: "4px 8px",
                                textAlign: "center",
                              }}>
                              -
                            </td>
                            <td
                              style={{
                                border: "1px solid #000",
                                padding: "4px 8px",
                                textAlign: "center",
                              }}>
                              -
                            </td>
                            <td
                              style={{
                                border: "1px solid #000",
                                padding: "4px 8px",
                                textAlign: "center",
                              }}>
                              -
                            </td>
                            <td
                              style={{
                                border: "1px solid #000",
                                padding: "4px 8px",
                                textAlign: "center",
                              }}>
                              -
                            </td>
                          </tr>
                        ))}
                    {/* Total Row */}
                    <tr
                      style={{
                        backgroundColor: "#e2e8f0",
                        fontWeight: "bold",
                      }}>
                      <td
                        style={{
                          border: "1px solid #000",
                          padding: "6px 8px",
                          textAlign: "center",
                        }}>
                        Total
                      </td>
                      <td
                        style={{
                          border: "1px solid #000",
                          padding: "6px 8px",
                          textAlign: "center",
                        }}>
                        {summaryData?.voucherBreakdown
                          ? summaryData.voucherBreakdown.reduce(
                              (s, v) => s + (v.threeD || 0),
                              0,
                            )
                          : players.reduce(
                              (s, p) => s + (p.amountPlayed?.ThreeD || 0),
                              0,
                            )}
                      </td>
                      <td
                        style={{
                          border: "1px solid #000",
                          padding: "6px 8px",
                          textAlign: "center",
                        }}>
                        {summaryData?.voucherBreakdown
                          ? summaryData.voucherBreakdown.reduce(
                              (s, v) => s + (v.twoD || 0),
                              0,
                            )
                          : players.reduce(
                              (s, p) => s + (p.amountPlayed?.TwoD || 0),
                              0,
                            )}
                      </td>
                      <td
                        style={{
                          border: "1px solid #000",
                          padding: "6px 8px",
                          textAlign: "center",
                        }}>
                        {summaryData?.voucherBreakdown
                          ? summaryData.voucherBreakdown.reduce(
                              (s, v) => s + (v.oneD || 0),
                              0,
                            )
                          : players.reduce(
                              (s, p) => s + (p.amountPlayed?.OneD || 0),
                              0,
                            )}
                      </td>
                      <td
                        style={{
                          border: "1px solid #000",
                          padding: "6px 8px",
                          textAlign: "center",
                        }}>
                        {summaryData?.voucherBreakdown
                          ? summaryData.voucherBreakdown.reduce(
                              (s, v) => s + (v.str || 0),
                              0,
                            )
                          : "-"}
                      </td>
                      <td
                        style={{
                          border: "1px solid #000",
                          padding: "6px 8px",
                          textAlign: "center",
                        }}>
                        {summaryData?.voucherBreakdown
                          ? summaryData.voucherBreakdown.reduce(
                              (s, v) => s + (v.rum || 0),
                              0,
                            )
                          : "-"}
                      </td>
                      <td
                        style={{
                          border: "1px solid #000",
                          padding: "6px 8px",
                          textAlign: "center",
                        }}>
                        {summaryData?.voucherBreakdown
                          ? summaryData.voucherBreakdown.reduce(
                              (s, v) => s + (v.down || 0),
                              0,
                            )
                          : "-"}
                      </td>
                      <td
                        style={{
                          border: "1px solid #000",
                          padding: "6px 8px",
                          textAlign: "center",
                        }}>
                        {summaryData?.voucherBreakdown
                          ? summaryData.voucherBreakdown.reduce(
                              (s, v) => s + (v.single || 0),
                              0,
                            )
                          : "-"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <h3 className="text-2xl text-yellow-400 mb-6 font-semibold text-center">
            Summary
          </h3>
          <div
            ref={contentAllRef}
            className="mt-8 max-w-4xl mx-auto space-y-12">
            {players.forEach((player) => {
              if (!playerRefs.current[player.voucher]) {
                playerRefs.current[player.voucher] = React.createRef();
              }
            })}

            {players.map((player, idx) => (
              <React.Fragment key={idx}>
                <div
                  ref={playerRefs.current[player.voucher]}
                  className="bg-white rounded-lg border shadow-md text-black p-4 ">
                  <div className="sm:w-80 mx-auto flex items-center justify-between">
                    <h2 className="text-lg font-bold text-center ">
                      {player.voucher || ""}
                    </h2>
                    {admin && (
                      <button
                        onClick={() => handleCopyAndUpload(player)}
                        className="w-14 h-14 flex items-center justify-center rounded text-white text-2xl"
                        title="Copy & Upload">
                        📋
                      </button>
                    )}
                    {admin && (
                      <button
                        onClick={() => handlePrint(player)}
                        className="w-14 h-14 flex items-center justify-center rounded text-white text-2xl"
                        title="Print A4">
                        🖨️
                      </button>
                    )}
                  </div>

                  <h2 className="text-lg font-bangla font-semibold text-center mb-1 ">
                    Page: {player.name || ""}
                    <p>Moderator: {player.moderatorId || "None"}</p>
                  </h2>
                  <p className="text-center text-lg mb-2">
                    Date:{" "}
                    {(() => {
                      if (!player.time) return "—";

                      let date;
                      // Try normal parse first
                      date = new Date(player.time);

                      // If invalid, manually parse MM/DD/YYYY, HH:MM:SS AM/PM
                      if (isNaN(date.getTime())) {
                        const match = player.time.match(
                          /^(\d{1,2})\/(\d{1,2})\/(\d{4}),\s*(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)$/i,
                        );
                        if (match) {
                          let [
                            ,
                            month,
                            day,
                            year,
                            hour,
                            minute,
                            second,
                            meridian,
                          ] = match;
                          hour = parseInt(hour, 10);
                          if (meridian.toUpperCase() === "PM" && hour !== 12)
                            hour += 12;
                          if (meridian.toUpperCase() === "AM" && hour === 12)
                            hour = 0;
                          date = new Date(
                            `${year}-${month.padStart(2, "0")}-${day.padStart(
                              2,
                              "0",
                            )}T${hour
                              .toString()
                              .padStart(2, "0")}:${minute}:${second}`,
                          );
                        }
                      }

                      return isNaN(date.getTime())
                        ? "—"
                        : date.toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          });
                    })()}
                  </p>
                  {/* Entries Table */}
                  <table className="w-full sm:w-80 text-sm border border-black mx-auto text-center">
                    <thead>
                      <tr className="bg-gray-200 ">
                        {" "}
                        <th className="border px-0">SL</th>
                        <th className="border px-0">Num</th>
                        <th className="border px-0">Str</th>
                        <th className="border px-0">Rum.</th>
                        <th className="border px-0">SL</th>
                        <th className="border px-0">Num</th>
                        <th className="border px-0">Str</th>
                        <th className="border px-0">Rum.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const sortedData = [...player.entries];
                        const half = Math.ceil(sortedData.length / 2);
                        // Data is split vertically (Col 1 = top half, Col 2 = bottom half)
                        const col1 = sortedData.slice(0, half);
                        const col2 = sortedData.slice(half);
                        const maxRows = Math.max(col1.length, col2.length);
                        const rows = [];

                        // --- Serial Logic Helper ---
                        // Function to get the original index (1-based serial number)
                        // of an entry by finding it in the original sortedData array.
                        const getOriginalIndex = (entry) => {
                          if (!entry) return null;
                          // The index will be the position in the original array + 1
                          const index = sortedData.findIndex(
                            (item) => item === entry,
                          );
                          return index !== -1 ? index + 1 : null;
                        };
                        // ----------------------------

                        // (Your existing renderCell and renderValue functions remain here,
                        // they don't need the serial logic anymore)

                        const renderCell = (entry, field) => {
                          // ... (Your existing renderCell logic for matching/highlighting) ...
                          // Assuming getMatchType, threeUp, and downGame are available in scope
                          if (!entry || !entry.input) return "";

                          const value = entry.input[field];
                          const str = Number(entry.input.str || 0);
                          const rumble = Number(entry.input.rumble || 0);
                          const { match, type } = getMatchType(
                            entry.input,
                            threeUp,
                            downGame,
                          );

                          let shouldHighlight = false;

                          if (!match) return renderValue(value, false);

                          switch (type) {
                            // ... (Your existing switch case logic) ...
                            case "exact3":
                              if (field === "num") shouldHighlight = true;
                              if (field === "str" && str > 0)
                                shouldHighlight = true;
                              if (field === "rumble" && rumble > 0)
                                shouldHighlight = true;
                              break;
                            case "perm3":
                              if (rumble > 0) {
                                if (field === "num" || field === "rumble")
                                  shouldHighlight = true;
                              }
                              break;
                            case "exact2":
                              if (field === "num") shouldHighlight = true;
                              if (field === "str" && str > 0)
                                shouldHighlight = true;
                              break;
                            case "reverse2":
                              if (field === "rumble" && rumble > 0)
                                shouldHighlight = true;
                              break;
                            case "single":
                              if (str > 0) {
                                if (field === "num" || field === "str")
                                  shouldHighlight = true;
                              }
                              break;
                            default:
                              shouldHighlight = false;
                          }

                          return renderValue(value, shouldHighlight);
                        };

                        const renderValue = (value, highlight) => (
                          <span
                            className={
                              highlight ? "text-red-500 font-bold text-xl" : ""
                            }>
                            {value ?? "—"}
                          </span>
                        );

                        // Loop to build the rows
                        for (let i = 0; i < maxRows; i++) {
                          const entry1 = col1[i];
                          const entry2 = col2[i];

                          // Use the helper function to get the correct serial number
                          const serial1 = getOriginalIndex(entry1);
                          const serial2 = getOriginalIndex(entry2);

                          rows.push(
                            <tr key={i}>
                              {/* Column 1 SL Cell */}
                              <td className="bg-gray-300 border px-2 py-1 text-center font-bold text-black">
                                {serial1 ?? "—"}
                              </td>
                              <td className="bg-white border px-2 py-1">
                                {renderCell(entry1, "num")}
                              </td>
                              <td className="bg-white border px-2 py-1">
                                {renderCell(entry1, "str")}
                              </td>
                              <td className="bg-white border px-2 py-1">
                                {renderCell(entry1, "rumble")}
                              </td>

                              {/* spacer */}

                              {/* Column 2 SL Cell */}
                              <td className="bg-gray-300 border px-2 py-1 text-center font-bold text-black">
                                {serial2 ?? "—"}
                              </td>
                              {/* col2 data */}
                              <td className="bg-white border px-2 py-1">
                                {renderCell(entry2, "num")}
                              </td>
                              <td className="bg-white border px-2 py-1">
                                {renderCell(entry2, "str")}
                              </td>
                              <td className="bg-white border px-2 py-1">
                                {renderCell(entry2, "rumble")}
                              </td>
                            </tr>,
                          );
                        }

                        return rows;
                      })()}
                    </tbody>
                  </table>
                  {/* Totals */}
                  <table
                    className="w-full sm:w-80 mx-auto mt-4 border border-black border-collapse text-sm "
                    border="1">
                    <thead>
                      <tr>
                        <th className="bg-white px-2 py-1 border">Category</th>
                        <th colSpan={2} className="bg-white px-2 py-1 border">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="bg-white px-2 py-1 border">3D Total</td>
                        <td colSpan={2} className="bg-white px-2 py-1 border">
                          {player?.amountPlayed?.ThreeD}
                        </td>
                      </tr>
                      <tr>
                        <td className="bg-white px-2 py-1 border">2D Total</td>
                        <td colSpan={2} className="bg-white px-2 py-1 border">
                          {player?.amountPlayed?.TwoD}
                        </td>
                      </tr>
                      <tr>
                        <td className="bg-white px-2 py-1 border">1D Total</td>
                        <td colSpan={2} className="bg-white px-2 py-1 border">
                          {player?.amountPlayed?.OneD}
                        </td>
                      </tr>
                      <tr className="font-bold">
                        <td
                          colSpan={2}
                          className="bg-white px-2 py-1 border text-right">
                          Grand Total
                        </td>
                        <td className="bg-white px-2 py-1 border">
                          {player?.amountPlayed?.ThreeD +
                            player?.amountPlayed?.TwoD +
                            player?.amountPlayed?.OneD}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Divider */}
                {idx !== players.length - 1 && (
                  <div className="h-2 w-full my-12 bg-gradient-to-r from-pink-500 via-yellow-500 to-pink-500 rounded-full shadow-[0_0_15px_rgba(236,72,153,0.5)] animate-pulse " />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
      <ScrollToTopButton />
    </div>
  );
};

export default GameSummary;
