import React, { useState, useEffect } from "react";
import { DollarSign, Euro, RefreshCw, Copy, Check, Info, Lock, Unlock } from "lucide-react";
import { RatesData, RateType } from "../types";

interface CalculatorProps {
  rates: RatesData;
}

export default function Calculator({ rates }: CalculatorProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<"usd" | "eur">("usd");
  const [rateType, setRateType] = useState<RateType>("parallel");
  const [foreignVal, setForeignVal] = useState<string>("100");
  const [vesVal, setVesVal] = useState<string>("");
  const [lastEdited, setLastEdited] = useState<"foreign" | "ves">("foreign");
  const [lockVes, setLockVes] = useState<boolean>(false);

  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Get active conversion rate dynamically
  const currentRate = selectedCurrency === "usd"
    ? (rateType === "bcv" ? rates.usd_bcv : rates.usd_parallel)
    : (rateType === "bcv" ? rates.eur_bcv : rates.eur_parallel);

  // Recalculate whenever currency, rate type, or inputs change
  useEffect(() => {
    if (lockVes && vesVal !== "") {
      const num = parseFloat(vesVal) || 0;
      const res = num / currentRate;
      setForeignVal(res > 0 ? res.toFixed(2) : "");
    } else if (lastEdited === "foreign" && foreignVal !== "") {
      const num = parseFloat(foreignVal) || 0;
      const res = num * currentRate;
      setVesVal(res > 0 ? res.toFixed(2) : "");
    } else if (lastEdited === "ves" && vesVal !== "") {
      const num = parseFloat(vesVal) || 0;
      const res = num / currentRate;
      setForeignVal(res > 0 ? res.toFixed(2) : "");
    } else {
      if (foreignVal === "" && vesVal === "") {
        setVesVal("");
        setForeignVal("");
      }
    }
  }, [selectedCurrency, rateType, currentRate, lockVes]);

  // Handle manual input changes
  const handleForeignChange = (val: string) => {
    setForeignVal(val);
    setLastEdited("foreign");
    if (val === "" || isNaN(Number(val))) {
      setVesVal("");
      return;
    }
    const num = parseFloat(val);
    const res = num * currentRate;
    setVesVal(res.toFixed(2));
  };

  const handleVesChange = (val: string) => {
    setVesVal(val);
    setLastEdited("ves");
    if (val === "" || isNaN(Number(val))) {
      setForeignVal("");
      return;
    }
    const num = parseFloat(val);
    const res = num / currentRate;
    setForeignVal(res.toFixed(2));
  };

  // Quick preset additions for the active foreign currency
  const adjustForeign = (amount: number) => {
    const current = parseFloat(foreignVal) || 0;
    const next = Math.max(0, current + amount);
    setLastEdited("foreign");
    setForeignVal(next === 0 ? "" : next.toString());
    if (next === 0) {
      setVesVal("");
    } else {
      setVesVal((next * currentRate).toFixed(2));
    }
  };

  const clearAll = () => {
    setForeignVal("");
    setVesVal("");
    setLastEdited("foreign");
    setLockVes(false);
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const valVesNum = parseFloat(vesVal) || 0;
  const bcvRateForActive = selectedCurrency === "usd" ? rates.usd_bcv : rates.eur_bcv;
  const parallelRateForActive = selectedCurrency === "usd" ? rates.usd_parallel : rates.eur_parallel;

  const equivalentBcv = valVesNum > 0 ? (valVesNum / bcvRateForActive) : 0;
  const equivalentParallel = valVesNum > 0 ? (valVesNum / parallelRateForActive) : 0;
  const diffEquivalent = Math.abs(equivalentBcv - equivalentParallel);

  return (
    <div className="bg-white dark:bg-zinc-950/80 dark:backdrop-blur-md border border-zinc-100 dark:border-zinc-900/80 rounded-3xl p-6 md:p-8 shadow-sm">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-zinc-100 dark:border-zinc-800/60">
        <div>
          <h2 className="text-xl font-display font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <RefreshCw className="text-indigo-600 dark:text-indigo-400 animate-spin-slow" size={20} />
            Conversor Inteligente
          </h2>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
            Convierte al instante seleccionando la moneda y la tasa que desees. ¡Ahora puedes fijar bolívares para comparar!
          </p>
        </div>
      </div>

      {/* Selectors Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {/* Currency Selector (USD vs EUR) */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
            1. Moneda Extranjera
          </label>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-2xl flex gap-1.5 border border-zinc-200/40 dark:border-zinc-700/40">
            <button
              type="button"
              onClick={() => setSelectedCurrency("usd")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer ${
                selectedCurrency === "usd"
                  ? "bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              <DollarSign size={14} />
              <span>Dólar ($)</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedCurrency("eur")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer ${
                selectedCurrency === "eur"
                  ? "bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              <Euro size={14} />
              <span>Euro (€)</span>
            </button>
          </div>
        </div>

        {/* Rate Source Selector (Binance vs BCV) */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
            2. Tipo de Tasa de Cambio
          </label>
          <div className="bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-2xl flex gap-1.5 border border-zinc-200/40 dark:border-zinc-700/40">
            <button
              type="button"
              onClick={() => setRateType("parallel")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer ${
                rateType === "parallel"
                  ? "bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              {selectedCurrency === "usd" ? "Dólar Binance" : "Euro Binance"}
            </button>
            <button
              type="button"
              onClick={() => setRateType("bcv")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer ${
                rateType === "bcv"
                  ? "bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              {selectedCurrency === "usd" ? "Dólar BCV" : "Euro BCV"}
            </button>
          </div>
        </div>
      </div>

      {/* Input Fields Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Foreign Currency Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex justify-between">
            <span>{selectedCurrency === "usd" ? "Dólar (USD)" : "Euro (EUR)"}</span>
            <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md">
              1 {selectedCurrency === "usd" ? "USD" : "EUR"} = {currentRate.toFixed(2)} Bs.
            </span>
          </label>
          <div className="relative flex items-center">
            <div className="absolute left-4 text-zinc-400 pointer-events-none font-semibold">
              {selectedCurrency === "usd" ? "$" : "€"}
            </div>
            <input
              type="number"
              placeholder="0.00"
              value={foreignVal}
              onChange={(e) => handleForeignChange(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/80 rounded-2xl py-3.5 pl-9 pr-12 text-lg font-display font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 text-zinc-900 dark:text-zinc-100 placeholder-zinc-300 dark:placeholder-zinc-600 transition-all"
            />
            <div className="absolute right-3 flex items-center gap-1">
              <button
                type="button"
                onClick={() => copyToClipboard(foreignVal, "foreign")}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-pointer"
                title="Copiar"
              >
                {copiedField === "foreign" ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        </div>

        {/* VES Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex justify-between items-center">
            <span>Bolívares (VES)</span>
            {lockVes && (
              <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md flex items-center gap-1">
                <Lock size={10} />
                Monto Fijado
              </span>
            )}
          </label>
          <div className="relative flex items-center">
            <div className={`absolute left-4 pointer-events-none font-semibold text-xs ${lockVes ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400'}`}>
              Bs
            </div>
            <input
              type="number"
              placeholder="0.00"
              value={vesVal}
              onChange={(e) => handleVesChange(e.target.value)}
              className={`w-full bg-zinc-50 dark:bg-zinc-800/50 border rounded-2xl py-3.5 pl-11 pr-20 text-lg font-display font-semibold focus:outline-none focus:ring-2 text-zinc-900 dark:text-zinc-100 placeholder-zinc-300 dark:placeholder-zinc-600 transition-all ${
                lockVes 
                  ? "border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-500/10" 
                  : "border-zinc-100 dark:border-zinc-800/80 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400"
              }`}
            />
            <div className="absolute right-3 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setLockVes(!lockVes)}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  lockVes 
                    ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400" 
                    : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                }`}
                title={lockVes ? "Desbloquear Bolívares" : "Fijar Bolívares"}
              >
                {lockVes ? <Lock size={16} /> : <Unlock size={16} />}
              </button>
              <button
                type="button"
                onClick={() => copyToClipboard(vesVal, "ves")}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-pointer"
                title="Copiar"
              >
                {copiedField === "ves" ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison analysis card */}
      {valVesNum > 0 && (
        <div className="mt-6 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Info size={13} className="text-indigo-500" />
              Análisis de Equivalencias (Mismo monto de Bolívares)
            </span>
            
            {/* Toggle Lock */}
            <button
              type="button"
              onClick={() => setLockVes(!lockVes)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                lockVes
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/10"
                  : "bg-zinc-200/60 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/80 dark:hover:bg-zinc-700"
              }`}
            >
              {lockVes ? <Lock size={12} /> : <Unlock size={12} />}
              <span>{lockVes ? "Bolívares Fijados" : "Fijar Bolívares"}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-1">
            {/* BCV Equivalent Card */}
            <div className={`p-3 rounded-xl border transition-all ${
              rateType === 'bcv' 
                ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200/50 dark:border-indigo-900/40 ring-2 ring-indigo-500/10' 
                : 'bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800/60'
            }`}>
              <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                Equivalente BCV
              </div>
              <div className="text-lg font-display font-extrabold text-zinc-900 dark:text-zinc-50 mt-1">
                {selectedCurrency === "usd" ? "$" : "€"}{equivalentBcv.toFixed(2)}
              </div>
              <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                Tasa: {bcvRateForActive.toFixed(2)} Bs.
              </div>
            </div>

            {/* Parallel Equivalent Card */}
            <div className={`p-3 rounded-xl border transition-all ${
              rateType === 'parallel' 
                ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200/50 dark:border-indigo-900/40 ring-2 ring-indigo-500/10' 
                : 'bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800/60'
            }`}>
              <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                Equivalente Binance
              </div>
              <div className="text-lg font-display font-extrabold text-zinc-900 dark:text-zinc-50 mt-1">
                {selectedCurrency === "usd" ? "$" : "€"}{equivalentParallel.toFixed(2)}
              </div>
              <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                Tasa: {parallelRateForActive.toFixed(2)} Bs.
              </div>
            </div>
          </div>

          <div className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400 pt-1 flex items-center justify-between border-t border-zinc-100/50 dark:border-zinc-800/40">
            <span>Diferencia cambiaria de divisa:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded">
              +{selectedCurrency === "usd" ? "$" : "€"}{diffEquivalent.toFixed(2)} {selectedCurrency === "usd" ? "USD" : "EUR"}
            </span>
          </div>
          
          {lockVes && (
            <div className="text-[10px] text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 px-3 py-1.5 rounded-lg border border-indigo-100/30 dark:border-indigo-900/30 font-medium leading-relaxed">
              🔒 El monto de <strong>{parseFloat(vesVal).toLocaleString('es-VE', {minimumFractionDigits: 2})} Bs.</strong> está fijado. Si cambias la tasa cambiaria arriba, el valor en Bolívares se mantendrá estable y se recalculará la moneda extranjera automáticamente.
            </div>
          )}
        </div>
      )}

      {/* Helper Shortcut Controls */}
      <div className="space-y-4 mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800/60">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-3 flex-1">
            {/* Quick Adders */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 w-28 tracking-wider">
                Rápidos ({selectedCurrency === "usd" ? "USD" : "EUR"})
              </span>
              <button
                type="button"
                onClick={() => adjustForeign(10)}
                className="px-3 py-1.5 text-xs font-medium bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg border border-zinc-200/50 dark:border-zinc-800/60 transition-colors cursor-pointer"
              >
                +{selectedCurrency === "usd" ? "$" : "€"}10
              </button>
              <button
                type="button"
                onClick={() => adjustForeign(50)}
                className="px-3 py-1.5 text-xs font-medium bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg border border-zinc-200/50 dark:border-zinc-800/60 transition-colors cursor-pointer"
              >
                +{selectedCurrency === "usd" ? "$" : "€"}50
              </button>
              <button
                type="button"
                onClick={() => adjustForeign(100)}
                className="px-3 py-1.5 text-xs font-medium bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg border border-zinc-200/50 dark:border-zinc-800/60 transition-colors cursor-pointer"
              >
                +{selectedCurrency === "usd" ? "$" : "€"}100
              </button>
              <button
                type="button"
                onClick={() => adjustForeign(500)}
                className="px-3 py-1.5 text-xs font-medium bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg border border-zinc-200/50 dark:border-zinc-800/60 transition-colors cursor-pointer"
              >
                +{selectedCurrency === "usd" ? "$" : "€"}500
              </button>
            </div>
          </div>

          {/* Clear/Reset */}
          <button
            type="button"
            onClick={clearAll}
            className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 px-4 py-2.5 rounded-xl transition-all self-start lg:self-center cursor-pointer"
          >
            Limpiar Todo
          </button>
        </div>
      </div>

      {/* Quick Info Box */}
      <div className="mt-5 p-3.5 bg-indigo-50/40 dark:bg-indigo-950/10 border border-indigo-100/50 dark:border-indigo-900/20 rounded-xl flex items-start gap-2.5">
        <Info className="text-indigo-500 dark:text-indigo-400 mt-0.5 shrink-0" size={14} />
        <p className="text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">
          Usted está calculando a una tasa de <strong className="font-semibold">{selectedCurrency === "usd" ? "Dólar" : "Euro"} {rateType === "bcv" ? "BCV Oficial" : "Binance"}</strong>. 
          El valor de conversión exacto puede fluctuar dependiendo de la entidad financiera o el comercio de pago.
        </p>
      </div>
    </div>
  );
}
