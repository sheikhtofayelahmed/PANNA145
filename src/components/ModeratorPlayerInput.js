"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";

export default function ModeratorPlayerInput({ agentId, agent, moderatorId }) {
  const [name, setName] = useState("");
  const [inputs, setInputs] = useState(
    Array(100).fill({ num: "", str: "", rumble: "" }),
  );
  const [showInput, setShowInput] = useState(true);
  const [players, setPlayers] = useState([]);
  const [amountPlayed, setAmountPlayed] = useState({});
  const [submittingVoucher, setSubmittingVoucher] = useState(null);
  const [entryCount, setEntryCount] = useState(0);

  const inputRefs = useRef([]);
  const [errors, setErrors] = useState(
    Array.from({ length: 100 }, () => ({
      num: false,
      str: false,
      rumble: false,
    })),
  );

  // ============= INPUT NAVIGATION =============
  const registerInput = useCallback((element, index) => {
    if (element) {
      inputRefs.current[index] = element;
    }
  }, []);

  const handleArrowKey = useCallback((e, currentIndex) => {
    if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      return;
    }

    const input = e.target;
    const cursorAtStart = input.selectionStart === 0;
    const cursorAtEnd = input.selectionStart === input.value.length;

    if (e.key === "ArrowLeft" && !cursorAtStart) return;
    if (e.key === "ArrowRight" && !cursorAtEnd) return;

    e.preventDefault();

    let nextIndex = currentIndex;

    switch (e.key) {
      case "ArrowRight":
        nextIndex = currentIndex + 1;
        break;
      case "ArrowLeft":
        nextIndex = currentIndex - 1;
        break;
      case "ArrowDown":
        nextIndex = currentIndex + 3;
        break;
      case "ArrowUp":
        nextIndex = currentIndex - 3;
        break;
    }

    while (nextIndex >= 0 && nextIndex < inputRefs.current.length) {
      const nextInput = inputRefs.current[nextIndex];
      if (nextInput && !nextInput.disabled) {
        nextInput.focus();
        nextInput.select();
        break;
      }
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        nextIndex++;
      } else {
        nextIndex--;
      }
    }
  }, []);

  // ============= VALIDATION =============
  const validateEntry = (entry) => {
    const { num, str, rumble } = entry;

    // Marker row is always valid
    if (num === "-" || num === "," || num === "." || num === "_") {
      return true;
    }

    // Allow completely empty row
    if (!num && !str && !rumble) return true;

    // Validate num: must be 1-3 digits
    if (!/^\d{1,3}$/.test(num)) return false;

    const numLength = num.length;
    const isStrValid = /^\d+$/.test(str);
    const isRumbleValid = /^\d+$/.test(rumble);

    if (numLength === 1) {
      if (!isStrValid || rumble) return false;
    } else if (numLength === 2 || numLength === 3) {
      if (!str && !rumble) return false;
      if (str && !isStrValid) return false;
      if (rumble && !isRumbleValid) return false;
    } else {
      return false;
    }

    return true;
  };

  // ============= TOTALS CALCULATION =============
  const calculateTotals = (entries) => {
    let total1D = 0,
      total2D = 0,
      total3D = 0;

    entries.forEach(({ num, str, rumble }) => {
      const total = (Number(str) || 0) + (Number(rumble) || 0);

      if (/^\d$/.test(num)) {
        total1D += total;
      } else if (/^\d{2}$/.test(num)) {
        total2D += total;
      } else if (/^\d{3}$/.test(num)) {
        total3D += total;
      }
    });

    return { OneD: total1D, TwoD: total2D, ThreeD: total3D };
  };

  // ============= AUTO-FILL WITH MARKER =============
  const autoFillWithMarker = (inputs) => {
    const newInputs = [...inputs];
    let lastMarker = null;

    for (let i = 0; i < newInputs.length; i++) {
      const cur = newInputs[i];

      const hasMarkerData =
        (cur.str && cur.str.trim() !== "") ||
        (cur.rumble && cur.rumble.trim() !== "");

      if (
        cur.num === "-" ||
        cur.num === "," ||
        cur.num === "." ||
        cur.num === "_"
      ) {
        if (lastMarker) {
          for (let j = lastMarker.index + 1; j < i; j++) {
            const mid = newInputs[j];
            if (!mid.str && lastMarker.str) mid.str = lastMarker.str;
            if (!mid.rumble && lastMarker.rumble)
              mid.rumble = lastMarker.rumble;
          }
        }
        continue;
      }

      if (hasMarkerData) {
        lastMarker = { ...cur, index: i };
      }
    }

    return newInputs;
  };

  const handleSavePlayer = () => {
    if (!name.trim()) {
      return alert("Please enter your page.");
    }
    const newErrors = inputs.map((entry) => {
      if (
        entry.num === "-" ||
        entry.num === "," ||
        entry.num === "." ||
        entry.num === "_" ||
        (!entry.num && !entry.str && !entry.rumble)
      ) {
        return { num: false, str: false, rumble: false };
      }

      const isValid = validateEntry(entry);
      return !isValid
        ? { num: true, str: true, rumble: true }
        : { num: false, str: false, rumble: false };
    });

    setErrors(newErrors);

    const hasErrors = inputs.some((entry, i) => {
      if (
        entry.num === "-" ||
        entry.num === "," ||
        entry.num === "." ||
        entry.num === "_"
      )
        return false;
      return Object.values(newErrors[i]).some((v) => v);
    });

    if (hasErrors) return;

    const validEntries = inputs.filter((entry) => {
      if (
        entry.num === "-" ||
        entry.num === "," ||
        entry.num === "." ||
        entry.num === "_"
      )
        return false;

      const isValid = validateEntry(entry);
      const isEmpty = !entry.num && !entry.str && !entry.rumble;
      return isValid && !isEmpty;
    });

    if (validEntries.length === 0) {
      alert("No valid entries to submit.");
      return;
    }

    const newEntries = validEntries.map((entry, i) => ({
      id: Date.now() + i,
      serial: i + 1,
      input: entry,
      isEditing: false,
      editValue: { ...entry },
      editError: false,
    }));

    const voucher = `${agentId}-${Math.floor(
      100000 + Math.random() * 90000000,
    )}`;
    const totals = calculateTotals(validEntries);

    const newPlayer = {
      name,
      time: new Date().toLocaleString(),
      voucher,
      data: newEntries,
    };

    setShowInput(false);
    setPlayers([newPlayer]);
    setAmountPlayed(totals);
    setName("");

    setErrors(
      Array.from({ length: 100 }, () => ({
        num: false,
        str: false,
        rumble: false,
      })),
    );
  };

  // ============= ADD MORE INPUTS =============
  const handleAddInputs = () => {
    setInputs([
      ...inputs,
      ...Array(100).fill({ num: "", str: "", rumble: "" }),
    ]);
    setErrors([
      ...errors,
      ...Array(100).fill({ num: false, str: false, rumble: false }),
    ]);
  };

  // ============= EDIT ENTRY =============
  const handleEdit = (playerIdx, entryIdx) => {
    setPlayers(
      players.map((player, i) =>
        i === playerIdx
          ? {
              ...player,
              data: player.data.map((entry, j) =>
                j === entryIdx ? { ...entry, isEditing: true } : entry,
              ),
            }
          : player,
      ),
    );
  };

  const handleEditChange = (playerIdx, entryIdx, field, value) => {
    setPlayers(
      players.map((player, i) =>
        i === playerIdx
          ? {
              ...player,
              data: player.data.map((entry, j) =>
                j === entryIdx
                  ? {
                      ...entry,
                      editValue: { ...entry.editValue, [field]: value },
                      editError: false,
                    }
                  : entry,
              ),
            }
          : player,
      ),
    );
  };

  const handleSaveEdit = (playerIdx, entryIdx) => {
    const entry = players[playerIdx].data[entryIdx];
    const isValid = validateEntry(entry.editValue);

    if (!isValid) {
      setPlayers(
        players.map((player, i) =>
          i === playerIdx
            ? {
                ...player,
                data: player.data.map((e, j) =>
                  j === entryIdx ? { ...e, editError: true } : e,
                ),
              }
            : player,
        ),
      );
      return;
    }

    const updatedPlayers = players.map((player, i) =>
      i === playerIdx
        ? {
            ...player,
            data: player.data.map((e, j) =>
              j === entryIdx
                ? {
                    ...e,
                    input: { ...e.editValue },
                    isEditing: false,
                    editError: false,
                  }
                : e,
            ),
          }
        : player,
    );

    setPlayers(updatedPlayers);
    const allInputs = updatedPlayers[playerIdx].data.map((e) => e.input);
    setAmountPlayed(calculateTotals(allInputs));
  };

  // ============= DELETE ENTRY =============
  const handleDelete = (playerIdx, entryIdx) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this entry?",
    );
    if (!confirmDelete) return;

    const updatedPlayers = players.map((player, i) =>
      i === playerIdx
        ? {
            ...player,
            data: player.data.filter((_, j) => j !== entryIdx),
          }
        : player,
    );

    setPlayers(updatedPlayers);
    const allInputs = updatedPlayers[playerIdx].data.map((e) => e.input);
    setAmountPlayed(calculateTotals(allInputs));
  };

  // ============= SUBMIT TO ACTIVE GAME =============
  const handleSubmit = async (player) => {
    // 🧠 Ask user to enter entry count manually
    const userInput = prompt("Enter total entry count to confirm submission:");

    // ❌ Cancel if user presses Cancel
    if (userInput === null) {
      console.log("❌ User cancelled submission");
      return;
    }

    const enteredCount = Number(userInput);
    const actualEntryCount = player.data.length;
    // ❌ If wrong answer, cancel submission
    if (enteredCount !== actualEntryCount) {
      alert(
        `❌ Incorrect entry count.\nYou entered: ${enteredCount}\nActual entries: ${actualEntryCount}\n\nSubmission cancelled.`,
      );
      return;
    }

    // ✅ Correct answer → proceed
    setSubmittingVoucher(player.voucher);
    if (submittingVoucher === player.voucher) return;

    setSubmittingVoucher(player.voucher);

    try {
      const dataEntries = player.data || [];
      const parsedData = dataEntries.map((entry) => ({ input: entry.input }));
      const totals = calculateTotals(dataEntries.map((e) => e.input));

      if (totals.OneD === 0 && totals.TwoD === 0 && totals.ThreeD === 0) {
        alert("It has entries, but total amount is zero.");
        return;
      }

      const payload = {
        voucher: player.voucher,
        agentId,
        agentName: agent.name,
        name: player.name || "",
        data: parsedData,
        amountPlayed: totals,
        cPercentages: agent.cPercentages,
        percentages: agent.percentages,
        moderatorId,
      };

      const res = await fetch("/api/savePlayer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert("submitted successfully!");
        setShowInput(true);
        setPlayers((prev) =>
          prev.map((p) =>
            p.voucher === player.voucher ? { ...p, submitted: true } : p,
          ),
        );
        setInputs(Array(100).fill({ num: "", str: "", rumble: "" }));
        localStorage.removeItem("pendingInputs");
        fetchEntryCount();
        window.location.reload();
      } else {
        const err = await res.json();
        alert(`Failed to submit: ${err.message || res.status}`);
      }
    } catch (err) {
      console.error("Submit error:", err);
      alert("Network or server error.");
    } finally {
      setSubmittingVoucher(null);
    }
  };

  // ============= FETCH ENTRY COUNT =============
  const fetchEntryCount = async () => {
    try {
      const res = await fetch("/api/getVoucherQntByAgentId", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId }),
      });
      if (res.ok) {
        const data = await res.json();
        setEntryCount(data.count);
      }
    } catch (err) {
      console.error("Entry count error:", err);
    }
  };

  // Fetch entry count on mount
  useEffect(() => {
    if (agentId) fetchEntryCount();
  }, [agentId]);

  // Load saved inputs from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("pendingInputs");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (
          Array.isArray(parsed) &&
          parsed.length > 0 &&
          parsed.every(
            (item) =>
              typeof item === "object" &&
              "num" in item &&
              "str" in item &&
              "rumble" in item,
          )
        ) {
          setInputs(parsed);
        } else {
          localStorage.removeItem("pendingInputs");
        }
      } catch {
        localStorage.removeItem("pendingInputs");
      }
    }
  }, []);

  // Save inputs to localStorage
  useEffect(() => {
    if (
      Array.isArray(inputs) &&
      inputs.length > 0 &&
      inputs.every(
        (i) =>
          typeof i === "object" && "num" in i && "str" in i && "rumble" in i,
      )
    ) {
      localStorage.setItem("pendingInputs", JSON.stringify(inputs));
    }
  }, [inputs]);

  // Clear localStorage on unload
  useEffect(() => {
    const handleUnload = () => localStorage.removeItem("pendingInputs");
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

  // ============= RENDER =============
  return (
    <div className="min-h-screen text-white py-2">
      {/* Entry Count Badge */}
      {entryCount > 0 && (
        <div className="max-w-sm mx-auto mb-4 text-center">
          <span className="inline-block px-4 py-1 bg-green-900 border border-green-500 rounded-full text-green-300 text-2xl font-mono">
            Total Voucher: {entryCount}
          </span>
        </div>
      )}
      {showInput && (
        <>
          <label className="block mb-2 text-yellow-300">Page:</label>
          <input
            ref={(el) => registerInput(el, 0)}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={(e) => e.target.select()}
            onKeyDown={(e) => handleArrowKey(e, 0)}
            placeholder="Your Page"
            className="w-full p-3 mb-4 rounded bg-black border-2 border-yellow-400 text-white"
          />

          {/* Entry Grid */}
          <label className="block mb-2 text-yellow-300">Enter Entries:</label>
          {inputs.map((entry, rowIndex) => (
            <div key={rowIndex} className="flex items-center gap-2 mb-2">
              <span className="text-yellow-400 font-bold w-6 text-right">
                {rowIndex + 1}.
              </span>
              <div className="grid grid-cols-3 gap-2 flex-1">
                {["num", "str", "rumble"].map((field, colIndex) => {
                  const flatIndex = rowIndex * 3 + colIndex + 1;
                  const value = entry[field];
                  const fieldError = errors[rowIndex]?.[field];

                  return (
                    <input
                      key={field}
                      ref={(el) => registerInput(el, flatIndex)}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={value || ""}
                      onChange={(e) => {
                        let val = e.target.value;

                        if (field === "num") {
                          if (
                            val === "-" ||
                            val === "," ||
                            val === "." ||
                            val === "_"
                          ) {
                            const updated = [...inputs];
                            updated[rowIndex] = {
                              ...updated[rowIndex],
                              [field]: val,
                            };
                            const autoFilled = autoFillWithMarker(updated);
                            setInputs(autoFilled);
                            return;
                          }
                          val = val.replace(/\D/g, "");
                          if (val.length > 3) val = val.slice(0, 3);
                        }

                        const updated = [...inputs];
                        updated[rowIndex] = {
                          ...updated[rowIndex],
                          [field]: val,
                        };
                        setInputs(updated);
                      }}
                      onFocus={(e) => e.target.select()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          // Move to the same column in the next row (+3 skips one full row)
                          const nextRowSameCol = flatIndex + 3;
                          const next = document.querySelector(
                            `input[name="input-${nextRowSameCol}"]`,
                          );
                          if (next) next.focus();
                          return;
                        }
                        handleArrowKey(e, flatIndex);
                      }}
                      placeholder={field.slice(0, 3).toUpperCase()}
                      className={`w-full p-2 rounded bg-black border-2 text-white ${
                        fieldError
                          ? "border-red-500 bg-red-900"
                          : "border-yellow-400"
                      }`}
                      name={`input-${flatIndex}`}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          {/* Error message */}
          {inputs.some((input, i) => {
            if (
              input.num === "-" ||
              input.num === "," ||
              input.num === "." ||
              input.num === "_"
            )
              return false;
            const err = errors[i];
            return err && Object.values(err).some((v) => v);
          }) && <p className="text-red-400">Please correct the errors.</p>}

          {/* Action Buttons (floating) */}
          <div
            className="fixed right-6 bottom-8 z-50 flex flex-col items-center gap-3"
            style={{ pointerEvents: "auto" }}>
            <button
              onClick={handleSavePlayer}
              title="Complete"
              className="w-12 h-12 text-3xl rounded-s-full font-bold flex items-center justify-center shadow-lg transform transition-all duration-200
  bg-yellow-400 hover:bg-yellow-300 text-black hover:text-black
  hover:scale-110 active:scale-95
  border border-yellow-200">
              OK
            </button>

            <button
              onClick={handleAddInputs}
              title="Add more plays"
              className="w-12 h-12 text-2xl rounded-full bg-green-500 hover:bg-green-600 text-black font-bold flex items-center justify-center shadow-lg transform transition-transform hover:scale-105">
              +
            </button>
          </div>
        </>
      )}
      {players.length > 0 && (
        <div className="mt-8 w-full mx-auto space-y-6">
          {players.map((player, playerIdx) => (
            <React.Fragment key={playerIdx}>
              <div className="my-8 bg-gray-800 p-5 rounded-xl border border-yellow-500 shadow hover:shadow-yellow-500 transition-shadow">
                {/* Submit Button (floating) */}
                <div className="fixed right-6 bottom-8 z-50 flex flex-col items-center gap-3">
                  {player.submitted ? (
                    <div className="px-4 py-2 bg-green-700 rounded-lg text-white font-bold">
                      Submitted
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSubmit(player)}
                      disabled={submittingVoucher === player.voucher}
                      className="w-12 h-12 rounded-full text-3xl bg-green-500 hover:bg-green-600 text-black font-bold flex items-center justify-center shadow-lg transform transition-transform hover:scale-105">
                      {submittingVoucher === player.voucher ? "..." : "✅"}
                    </button>
                  )}
                </div>

                {!player.submitted ? (
                  <>
                    {/* Voucher Info */}
                    <div className="w-max sm:w-2/3 mx-auto flex justify-between items-start">
                      <p className="text-yellow-300 font-bold sm:text-2xl text-center my-5">
                        Voucher:{" "}
                        <span className="font-mono">
                          {player.voucher || "N/A"}
                        </span>
                      </p>
                    </div>
                    <div className="w-max sm:w-2/3 mx-auto flex justify-between items-start">
                      <div>
                        <h4 className="text-xl font-bold mb-1">
                          Page: {player.name}
                        </h4>
                        <p className="text-center text-lg mb-2">
                          Date:{" "}
                          {new Date(player.time).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Back to Edit */}
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => setShowInput(true)}
                        className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded shadow-md transition duration-200">
                        Full Edit
                      </button>
                    </div>

                    {/* Entries Table */}
                    <div className="mt-6 overflow-x-auto w-full">
                      <table className="w-max sm:w-2/3 mx-auto border-collapse font-mono text-sm text-yellow-300">
                        <thead>
                          <tr className="bg-yellow-600 text-white">
                            <th className="border px-3 py-2 text-left">#</th>
                            <th className="border px-3 py-2 text-center">
                              Number
                            </th>
                            <th className="border px-3 py-2 text-center">
                              STR
                            </th>
                            <th className="border px-3 py-2 text-center">
                              RUM
                            </th>
                            <th className="border px-3 py-2 text-center">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {player.data.map((entry, sortedIdx) => (
                            <tr
                              key={entry.id}
                              className={
                                sortedIdx % 2 === 0
                                  ? "bg-gray-700"
                                  : "bg-gray-800"
                              }>
                              <td className="border px-3 py-1 text-white">
                                {sortedIdx + 1}
                              </td>

                              {entry.isEditing ? (
                                <>
                                  {["num", "str", "rumble"].map((field) => (
                                    <td
                                      key={field}
                                      className="border px-2 py-1">
                                      <input
                                        type="text"
                                        value={entry.editValue[field]}
                                        onChange={(e) =>
                                          handleEditChange(
                                            playerIdx,
                                            sortedIdx,
                                            field,
                                            e.target.value,
                                          )
                                        }
                                        className={`w-full p-1 bg-black border-2 text-white rounded ${
                                          entry.editError
                                            ? "border-red-500"
                                            : "border-yellow-400"
                                        }`}
                                        placeholder={field
                                          .slice(0, 3)
                                          .toUpperCase()}
                                      />
                                    </td>
                                  ))}
                                </>
                              ) : (
                                <>
                                  <td className="border px-3 py-1">
                                    {entry.input.num}
                                  </td>
                                  <td className="border px-3 py-1 text-green-400">
                                    {entry.input.str}
                                  </td>
                                  <td className="border px-3 py-1 text-green-400">
                                    {entry.input.rumble}
                                  </td>
                                </>
                              )}

                              <td className="border px-3 py-1 space-x-2 flex items-center justify-center">
                                {entry.isEditing ? (
                                  <button
                                    onClick={() =>
                                      handleSaveEdit(playerIdx, sortedIdx)
                                    }
                                    className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-2 rounded transition">
                                    Save
                                  </button>
                                ) : (
                                  <button
                                    onClick={() =>
                                      handleEdit(playerIdx, sortedIdx)
                                    }
                                    className="bg-white hover:bg-green-600 text-black py-1 px-2 rounded transition">
                                    Edit
                                  </button>
                                )}
                                <button
                                  onClick={() =>
                                    handleDelete(playerIdx, sortedIdx)
                                  }
                                  className="bg-red-600 hover:bg-red-700 text-white py-1 px-2 rounded transition">
                                  Del
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Totals Table */}
                    <div className="mt-6 overflow-x-auto w-full">
                      <table className="w-max mx-auto sm:w-2/3 border-collapse font-mono text-sm text-yellow-300">
                        <thead>
                          <tr className="bg-red-700 text-white">
                            <th className="border border-gray-600 px-4 py-2 text-left">
                              Category
                            </th>
                            <th
                              colSpan={2}
                              className="border border-gray-600 px-4 py-2 text-left">
                              Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="bg-gray-800">
                            <td className="border border-gray-600 px-4 py-2">
                              3D Total
                            </td>
                            <td
                              colSpan={2}
                              className="border border-gray-600 px-4 py-2 text-green-400">
                              {amountPlayed?.ThreeD || "0"}
                            </td>
                          </tr>
                          <tr className="bg-gray-900">
                            <td className="border border-gray-600 px-4 py-2">
                              2D Total
                            </td>
                            <td
                              colSpan={2}
                              className="border border-gray-600 px-4 py-2 text-green-400">
                              {amountPlayed?.TwoD || "0"}
                            </td>
                          </tr>
                          <tr className="bg-gray-800">
                            <td className="border border-gray-600 px-4 py-2">
                              1D Total
                            </td>
                            <td
                              colSpan={2}
                              className="border border-gray-600 px-4 py-2 text-green-400">
                              {amountPlayed?.OneD || "0"}
                            </td>
                          </tr>
                          <tr className="bg-gray-900 font-bold text-lg">
                            <td
                              colSpan={2}
                              className="border border-gray-600 px-4 py-2">
                              Grand Total
                            </td>
                            <td className="border border-gray-600 px-4 py-2 text-yellow-300">
                              {(amountPlayed?.ThreeD || 0) +
                                (amountPlayed?.TwoD || 0) +
                                (amountPlayed?.OneD || 0)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  // Submitted state
                  <div className="text-center py-10">
                    <div className="text-6xl mb-4">✅</div>
                    <h3 className="text-2xl font-bold text-green-400 mb-2">
                      Voucher Submitted!
                    </h3>
                    <p className="text-gray-400">Voucher: {player.voucher}</p>
                    <button
                      onClick={() => {
                        setPlayers([]);
                        setShowInput(true);
                        setInputs(
                          Array(100).fill({ num: "", str: "", rumble: "" }),
                        );
                      }}
                      className="mt-6 px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg transition-all">
                      New Entry
                    </button>
                  </div>
                )}
              </div>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
