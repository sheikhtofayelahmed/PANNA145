"use client";
import { useState } from "react";

// ============================================================================
// UTILITY
// ============================================================================
const sortWithZeroHigh = (a, b) => {
  const valA = a === 0 ? 10 : a;
  const valB = b === 0 ? 10 : b;
  return valA - valB;
};

// ============================================================================
// GENERATORS
// ============================================================================
const generateSP = (digit) => {
  const results = [];
  const target = Number(digit);
  for (let i = 0; i <= 9; i++)
    for (let j = 0; j <= 9; j++) {
      if (j === i) continue;
      for (let k = 0; k <= 9; k++) {
        if (k === i || k === j) continue;
        if ((i + j + k) % 10 === target) {
          const s = [i, j, k].sort(sortWithZeroHigh).join("");
          if (!results.includes(s)) results.push(s);
        }
      }
    }
  return results.sort();
};

const generateDP = (digit, includeTriple = false) => {
  const results = new Set();
  const target = Number(digit);
  for (let i = 0; i <= 9; i++)
    for (let j = 0; j <= 9; j++)
      for (let k = 0; k <= 9; k++) {
        const isValid = includeTriple
          ? i === j || j === k || i === k
          : (i === j && i !== k) || (j === k && j !== i) || (i === k && i !== j);
        if (isValid && (i + j + k) % 10 === target)
          results.add([i, j, k].sort(sortWithZeroHigh).join(""));
      }
  return Array.from(results).sort();
};

const generateSPCommon = (digit) => {
  const results = new Set();
  const target = String(digit);
  for (let i = 0; i <= 9; i++)
    for (let j = 0; j <= 9; j++)
      for (let k = 0; k <= 9; k++) {
        if (i !== j && j !== k && i !== k) {
          const s = [i, j, k].sort(sortWithZeroHigh).join("");
          if (s.includes(target)) results.add(s);
        }
      }
  return Array.from(results).sort();
};

const generateDPCommon = (digit, includeTriple = false) => {
  const results = new Set();
  const target = String(digit);
  for (let same = 0; same <= 9; same++)
    for (let diff = 0; diff <= 9; diff++)
      if (same !== diff) {
        const s = [same, same, diff].sort(sortWithZeroHigh).join("");
        if (s.includes(target)) results.add(s);
      }
  if (includeTriple) results.add(`${digit}${digit}${digit}`);
  return Array.from(results).sort();
};

const generateSPMotor = (digits) => {
  const results = new Set();
  const arr = digits.map(Number);
  for (let i = 0; i < arr.length; i++)
    for (let j = 0; j < arr.length; j++)
      for (let k = 0; k < arr.length; k++) {
        const [d1, d2, d3] = [arr[i], arr[j], arr[k]];
        if (d1 !== d2 && d2 !== d3 && d1 !== d3)
          results.add([d1, d2, d3].sort(sortWithZeroHigh).join(""));
      }
  return Array.from(results).sort();
};

const generateDPMotor = (digits) => {
  const results = new Set();
  const arr = digits.map(Number);
  for (let i = 0; i < arr.length; i++)
    for (let j = 0; j < arr.length; j++)
      for (let k = 0; k < arr.length; k++) {
        const [d1, d2, d3] = [arr[i], arr[j], arr[k]];
        const counts = {};
        [d1, d2, d3].forEach((d) => (counts[d] = (counts[d] || 0) + 1));
        if (Math.max(...Object.values(counts)) === 2)
          results.add([d1, d2, d3].sort(sortWithZeroHigh).join(""));
      }
  return Array.from(results).sort();
};

const generateCycle = (digits) => {
  const results = new Set();
  if (digits.length !== 2) return [];
  const [d1, d2] = digits.map(Number);
  for (let r = 0; r <= 9; r++)
    results.add([d1, d2, r].sort(sortWithZeroHigh).join(""));
  return Array.from(results).sort();
};

// ============================================================================
// DIGIT GRID
// ============================================================================
function DigitGrid({ selected, onToggle, multi = false, maxSelect = null }) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d) => {
        const s = String(d);
        const isSelected = multi ? selected.includes(s) : selected === s;
        const isDisabled =
          multi && maxSelect && !isSelected && selected.length >= maxSelect;
        return (
          <button
            key={d}
            onClick={() => !isDisabled && onToggle(s)}
            disabled={isDisabled}
            className={`
              py-3 rounded-lg text-lg font-black border transition-all
              ${isSelected
                ? "bg-yellow-400 border-yellow-300 text-black shadow-lg shadow-yellow-400/30"
                : isDisabled
                  ? "bg-gray-900 border-gray-800 text-gray-700 cursor-not-allowed"
                  : "bg-gray-900 border-gray-700 text-gray-300 hover:border-yellow-500 hover:text-yellow-300"
              }
            `}>
            {d}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// RESULTS BOX
// ============================================================================
function ResultsBox({ numbers, label }) {
  if (!numbers || numbers.length === 0) return null;
  return (
    <div className="mt-4 bg-gray-900 border border-gray-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-yellow-400 text-xs font-bold uppercase tracking-widest">
          {label}
        </span>
        <span className="text-white text-xs font-black bg-yellow-500/20 border border-yellow-500/40 px-3 py-0.5 rounded-full">
          {numbers.length} numbers
        </span>
      </div>
      <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5 max-h-64 overflow-y-auto custom-scrollbar">
        {numbers.map((n, i) => (
          <span
            key={i}
            className="text-center text-xs font-mono text-gray-200 bg-gray-800 border border-gray-700 rounded py-1">
            {n}
          </span>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// SHORTCUT PANEL (SP, DP, Common SP, Common DP)
// ============================================================================
function ShortcutPanel({ type }) {
  const [result, setResult] = useState(null);
  const [selectedDigit, setSelectedDigit] = useState(null);
  const [triple, setTriple] = useState(false);

  const showTripleToggle = type === "DP" || type === "DPc";

  const handleDigit = (d) => {
    setSelectedDigit(d);
    let nums;
    if (type === "SP") nums = generateSP(d);
    else if (type === "DP") nums = generateDP(d, triple);
    else if (type === "SPc") nums = generateSPCommon(d);
    else if (type === "DPc") nums = generateDPCommon(d, triple);
    setResult({ digit: d, numbers: nums });
  };

  const handleTripleToggle = () => {
    const newTriple = !triple;
    setTriple(newTriple);
    if (selectedDigit !== null) {
      let nums;
      if (type === "DP") nums = generateDP(selectedDigit, newTriple);
      else if (type === "DPc") nums = generateDPCommon(selectedDigit, newTriple);
      setResult({ digit: selectedDigit, numbers: nums });
    }
  };

  return (
    <div className="space-y-4">
      {showTripleToggle && (
        <button
          onClick={handleTripleToggle}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase border transition-all ${
            triple
              ? "bg-green-900/40 border-green-500 text-green-400"
              : "bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500"
          }`}>
          {triple ? "✅ Triple ON" : "❌ Triple OFF"}
        </button>
      )}
      <p className="text-gray-500 text-xs uppercase tracking-widest">
        Tap a digit to generate
      </p>
      <DigitGrid
        selected={selectedDigit}
        onToggle={handleDigit}
        multi={false}
      />
      {result && (
        <ResultsBox
          numbers={result.numbers}
          label={`Digit ${result.digit} — ${type}`}
        />
      )}
    </div>
  );
}

// ============================================================================
// MOTOR PANEL (SPm, DPm)
// ============================================================================
function MotorPanel({ type }) {
  const [selected, setSelected] = useState([]);
  const [result, setResult] = useState(null);

  const minDigits = type === "SPm" ? 3 : 2;

  const toggle = (d) => {
    setSelected((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
    setResult(null);
  };

  const generate = () => {
    if (selected.length < minDigits) return;
    const nums =
      type === "SPm" ? generateSPMotor(selected) : generateDPMotor(selected);
    setResult(nums);
  };

  const clear = () => {
    setSelected([]);
    setResult(null);
  };

  return (
    <div className="space-y-4">
      <p className="text-gray-500 text-xs uppercase tracking-widest">
        Select {minDigits}+ digits
        {selected.length > 0 && (
          <span className="ml-2 text-yellow-400 font-bold">
            [{selected.join(", ")}]
          </span>
        )}
      </p>
      <DigitGrid selected={selected} onToggle={toggle} multi={true} />
      <div className="flex gap-2">
        <button
          onClick={clear}
          className="flex-1 py-2.5 rounded-lg text-xs font-bold uppercase border border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-500 transition">
          Clear
        </button>
        <button
          onClick={generate}
          disabled={selected.length < minDigits}
          className="flex-1 py-2.5 rounded-lg text-xs font-bold uppercase bg-yellow-500 text-black hover:bg-yellow-400 transition disabled:opacity-40 disabled:cursor-not-allowed">
          Generate ({selected.length}/{minDigits})
        </button>
      </div>
      {result && (
        <ResultsBox
          numbers={result}
          label={`${type} — digits [${selected.join(",")}]`}
        />
      )}
    </div>
  );
}

// ============================================================================
// CYCLE PANEL
// ============================================================================
function CyclePanel() {
  const [selected, setSelected] = useState([]);
  const [result, setResult] = useState(null);

  const toggle = (d) => {
    setSelected((prev) => {
      if (prev.includes(d)) return prev.filter((x) => x !== d);
      if (prev.length >= 2) return prev; // max 2
      return [...prev, d];
    });
    setResult(null);
  };

  const generate = () => {
    if (selected.length !== 2) return;
    setResult(generateCycle(selected));
  };

  const clear = () => {
    setSelected([]);
    setResult(null);
  };

  return (
    <div className="space-y-4">
      <p className="text-gray-500 text-xs uppercase tracking-widest">
        Select exactly 2 digits
        {selected.length > 0 && (
          <span className="ml-2 text-yellow-400 font-bold">
            [{selected.join(", ")}]
          </span>
        )}
      </p>
      <DigitGrid
        selected={selected}
        onToggle={toggle}
        multi={true}
        maxSelect={2}
      />
      <div className="flex gap-2">
        <button
          onClick={clear}
          className="flex-1 py-2.5 rounded-lg text-xs font-bold uppercase border border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-500 transition">
          Clear
        </button>
        <button
          onClick={generate}
          disabled={selected.length !== 2}
          className="flex-1 py-2.5 rounded-lg text-xs font-bold uppercase bg-yellow-500 text-black hover:bg-yellow-400 transition disabled:opacity-40 disabled:cursor-not-allowed">
          Generate ({selected.length}/2)
        </button>
      </div>
      {result && (
        <ResultsBox
          numbers={result}
          label={`CYCLE — digits [${selected.join(",")}]`}
        />
      )}
    </div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================
const TYPES = [
  { id: "SP",   label: "SP" },
  { id: "DP",   label: "DP" },
  { id: "SPc",  label: "Common SP" },
  { id: "DPc",  label: "Common DP" },
  { id: "SPm",  label: "Motor SP" },
  { id: "DPm",  label: "Motor DP" },
  { id: "CYCLE", label: "Cycle" },
];

export default function CalculatorPage() {
  const [active, setActive] = useState("SP");

  return (
    <div className="min-h-screen bg-gray-950 py-6 px-4">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-yellow-400 text-xl font-black uppercase tracking-widest">
            🧮 Calculator
          </h1>
          <p className="text-gray-600 text-xs mt-1 uppercase tracking-widest">
            Number Generator
          </p>
        </div>

        {/* Type Tabs */}
        <div className="grid grid-cols-4 gap-1.5 mb-6">
          {TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={`py-2 px-1 rounded-lg text-xs font-bold uppercase tracking-wide transition-all border ${
                active === t.id
                  ? "bg-yellow-400 border-yellow-300 text-black shadow-lg shadow-yellow-400/20"
                  : "bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-600 hover:text-gray-200"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Panel */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-5 pb-3 border-b border-gray-800">
            <span className="w-1.5 h-5 bg-yellow-400 rounded-full" />
            <span className="text-white font-black uppercase tracking-widest text-sm">
              {TYPES.find((t) => t.id === active)?.label}
            </span>
          </div>

          {/* Shortcut types */}
          {(active === "SP" || active === "DP" || active === "SPc" || active === "DPc") && (
            <ShortcutPanel key={active} type={active} />
          )}

          {/* Motor types */}
          {(active === "SPm" || active === "DPm") && (
            <MotorPanel key={active} type={active} />
          )}

          {/* Cycle */}
          {active === "CYCLE" && <CyclePanel />}
        </div>

      </div>
    </div>
  );
}
