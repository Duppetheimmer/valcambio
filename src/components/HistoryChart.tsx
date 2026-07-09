import React, { useState, useEffect } from "react";
import { HistoryEntry } from "../types";
import { Calendar, TrendingUp, TrendingDown, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { motion } from "motion/react";

interface HistoryChartProps {
  selectedRateId: "usd-bcv" | "usd-parallel" | "eur-bcv" | "eur-parallel";
}

export default function HistoryChart({ selectedRateId }: HistoryChartProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [supabaseStatus, setSupabaseStatus] = useState<{ configured: boolean; healthy: boolean; error?: string; url?: string | null } | null>(null);
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("30d");

  const fetchHistory = async (selectedRange: "24h" | "7d" | "30d") => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch both history and status with specific range query
      const [historyRes, statusRes] = await Promise.all([
        fetch(`/api/history?range=${selectedRange}`),
        fetch("/api/supabase-status")
      ]);

      if (!historyRes.ok) {
        throw new Error("No se pudo cargar el historial.");
      }

      const historyData = await historyRes.json();
      setHistory(historyData);

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setSupabaseStatus(statusData);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al conectar con la base de datos de historial.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(timeRange);
  }, [timeRange]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-950/80 dark:backdrop-blur-md border border-zinc-100 dark:border-zinc-900/80 rounded-3xl p-6 md:p-8 shadow-xs flex flex-col items-center justify-center min-h-[350px]">
        <RefreshCw size={28} className="text-indigo-500 animate-spin mb-3" />
        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Cargando gráfico histórico...</span>
      </div>
    );
  }

  if (error || history.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-950/80 dark:backdrop-blur-md border border-zinc-100 dark:border-zinc-900/80 rounded-3xl p-6 md:p-8 shadow-xs flex flex-col items-center justify-center min-h-[350px] text-center space-y-3">
        <AlertCircle size={28} className="text-rose-500" />
        <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">No se pudo cargar el historial de precios</p>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-sm">
          {error || "No hay registros disponibles en este momento."}
        </p>
        <button
          onClick={fetchHistory}
          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-700"
        >
          Reintentar conexión
        </button>
      </div>
    );
  }

  // Get display details
  const getRateDetails = () => {
    switch (selectedRateId) {
      case "usd-bcv":
        return { label: "Dólar BCV (Oficial)", color: "#6366f1", symbol: "$", gradient: "from-indigo-500/20 to-transparent" };
      case "usd-parallel":
        return { label: "Dólar Binance (P2P)", color: "#f59e0b", symbol: "$", gradient: "from-amber-500/20 to-transparent" };
      case "eur-bcv":
        return { label: "Euro BCV (Oficial)", color: "#4f46e5", symbol: "€", gradient: "from-indigo-600/20 to-transparent" };
      case "eur-parallel":
        return { label: "Euro Binance (Proporcional)", color: "#d97706", symbol: "€", gradient: "from-amber-600/20 to-transparent" };
    }
  };

  const { label, color, symbol, gradient } = getRateDetails();

  // Extract selected values
  const chartData = history.map((entry) => {
    let val = 0;
    if (selectedRateId === "usd-bcv") val = entry.usd_bcv;
    else if (selectedRateId === "usd-parallel") val = entry.usd_parallel;
    else if (selectedRateId === "eur-bcv") val = entry.eur_bcv;
    else if (selectedRateId === "eur-parallel") val = entry.eur_parallel;

    const dateObj = new Date(entry.created_at);
    
    let formattedDate = "";
    if (timeRange === "24h") {
      formattedDate = dateObj.toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit", hour12: false });
    } else if (timeRange === "7d") {
      formattedDate = dateObj.toLocaleDateString("es-VE", { weekday: "short", day: "numeric" });
    } else {
      formattedDate = dateObj.toLocaleDateString("es-VE", { day: "numeric", month: "short" });
    }

    return {
      rawDate: dateObj,
      value: val,
      formattedDate,
      fullDate: dateObj.toLocaleDateString("es-VE", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })
    };
  });

  const values = chartData.map((d) => d.value);
  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);
  const range = maxVal - minVal;
  
  // Calculate padded axis bounds
  const yPadding = range * 0.1 || 0.5;
  const yMax = parseFloat((maxVal + yPadding).toFixed(2));
  const yMin = parseFloat(Math.max(0, minVal - yPadding).toFixed(2));

  // Dimensions of SVG
  const width = 600;
  const height = 250;
  const margin = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Map to SVG coordinates
  const points = chartData.map((d, idx) => {
    const x = margin.left + (idx / (chartData.length - 1)) * chartWidth;
    const y = margin.top + chartHeight - ((d.value - yMin) / (yMax - yMin)) * chartHeight;
    return { x, y, value: d.value, date: d.formattedDate, fullDate: d.fullDate };
  });

  // Create path strings
  const linePath = points.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x},${p.y}` : `${acc} L ${p.x},${p.y}`;
  }, "");

  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x},${margin.top + chartHeight} L ${points[0].x},${margin.top + chartHeight} Z`
    : "";

  // Mouse move over trigger zone
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    
    // Convert client coordinate to SVG viewBox space
    const viewBoxX = (mouseX / rect.width) * width;
    const chartX = viewBoxX - margin.left;
    
    if (chartX >= -10 && chartX <= chartWidth + 10) {
      const fraction = chartX / chartWidth;
      const approxIdx = Math.round(fraction * (chartData.length - 1));
      const clampedIdx = Math.max(0, Math.min(chartData.length - 1, approxIdx));
      
      setHoveredIndex(clampedIdx);
      setHoverPos({
        x: points[clampedIdx].x,
        y: points[clampedIdx].y
      });
    }
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
    setHoverPos(null);
  };

  // Select latest entry info
  const latestEntry = chartData[chartData.length - 1];
  const initialEntry = chartData[0];
  const priceChange = latestEntry.value - initialEntry.value;
  const pricePercentChange = (priceChange / initialEntry.value) * 100;
  const isUp = priceChange >= 0;

  // Grid values (y-axis)
  const gridCount = 4;
  const gridValues = Array.from({ length: gridCount }).map((_, idx) => {
    const val = yMin + (idx / (gridCount - 1)) * (yMax - yMin);
    return parseFloat(val.toFixed(2));
  });

  return (
    <div className="bg-white dark:bg-zinc-950/80 dark:backdrop-blur-md border border-zinc-100 dark:border-zinc-900/80 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800/60">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Calendar size={15} className="text-zinc-400" />
            <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 tracking-wider">Historial Online</span>
            {supabaseStatus && (
              <span className={`inline-flex items-center gap-1.5 text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wide border ${
                supabaseStatus.healthy 
                  ? "bg-emerald-50 text-emerald-700 border-emerald-100/50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30" 
                  : "bg-amber-50 text-amber-700 border-amber-100/50 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${supabaseStatus.healthy ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
                {supabaseStatus.healthy ? "Supabase Conectado" : "Datos Simulados (Local)"}
              </span>
            )}
          </div>
          <h3 className="text-lg font-display font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            Historial de Precios: <span style={{ color }}>{label}</span>
          </h3>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          {/* Change Badge */}
          <div className="text-left sm:text-right">
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block uppercase font-bold">
              Rendimiento ({timeRange === "24h" ? "24 horas" : timeRange === "7d" ? "7 días" : "30 días"})
            </span>
            <span className={`inline-flex items-center gap-1 text-sm font-extrabold mt-0.5 ${isUp ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
              {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {isUp ? "+" : ""}{priceChange.toFixed(2)} Bs ({isUp ? "+" : ""}{pricePercentChange.toFixed(2)}%)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Range Selector Tab Group */}
            <div className="flex bg-zinc-100 dark:bg-zinc-900/60 p-1 rounded-xl border border-zinc-200/30 dark:border-zinc-800/40">
              {(["24h", "7d", "30d"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    timeRange === r
                      ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs border-zinc-200/50 dark:border-zinc-700/50"
                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                  }`}
                >
                  {r === "24h" ? "24h" : r === "7d" ? "7d" : "30d"}
                </button>
              ))}
            </div>

            {/* Refresh button */}
            <button 
              onClick={() => fetchHistory(timeRange)}
              className="p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-all text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              title="Refrescar historial"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Chart area */}
      <div className="relative">
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-auto overflow-visible"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Definitions for Gradients */}
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.18" />
              <stop offset="100%" stopColor={color} stopOpacity="0.00" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines */}
          {gridValues.map((val, idx) => {
            const y = margin.top + chartHeight - ((val - yMin) / (yMax - yMin)) * chartHeight;
            return (
              <g key={idx} className="opacity-40 dark:opacity-20">
                <line 
                  x1={margin.left} 
                  y1={y} 
                  x2={width - margin.right} 
                  y2={y} 
                  stroke="#a1a1aa" 
                  strokeWidth="0.75" 
                  strokeDasharray="4 4"
                />
                <text 
                  x={margin.left - 8} 
                  y={y + 4} 
                  textAnchor="end" 
                  className="text-[9px] font-mono fill-zinc-400 dark:fill-zinc-500 font-medium"
                >
                  {val.toFixed(2)}
                </text>
              </g>
            );
          })}

          {/* X-Axis labels (First, Middle, Last) */}
          {points.length > 1 && (
            <g className="fill-zinc-400 dark:fill-zinc-500 font-mono text-[9px] font-semibold opacity-75">
              {/* First point */}
              <text x={points[0].x} y={height - 12} textAnchor="start">
                {points[0].date}
              </text>
              {/* Middle point */}
              <text x={points[Math.floor(points.length / 2)].x} y={height - 12} textAnchor="middle">
                {points[Math.floor(points.length / 2)].date}
              </text>
              {/* Last point */}
              <text x={points[points.length - 1].x} y={height - 12} textAnchor="end">
                {points[points.length - 1].date}
              </text>
            </g>
          )}

          {/* Animated Area under the line */}
          {areaPath && (
            <motion.path 
              d={areaPath} 
              fill="url(#chartGradient)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            />
          )}

          {/* Animated Trend Line */}
          {linePath && (
            <motion.path 
              d={linePath} 
              fill="none" 
              stroke={color} 
              strokeWidth="2.5" 
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            />
          )}

          {/* Hover interactive vertical cursor & marker */}
          {hoverPos && hoveredIndex !== null && (
            <g>
              {/* Vertical line tracker */}
              <line 
                x1={hoverPos.x} 
                y1={margin.top} 
                x2={hoverPos.x} 
                y2={margin.top + chartHeight} 
                stroke={color} 
                strokeWidth="1" 
                strokeDasharray="3 3"
              />
              {/* Floating outer pulse halo */}
              <circle 
                cx={hoverPos.x} 
                cy={hoverPos.y} 
                r="7" 
                fill={color} 
                opacity="0.25"
              />
              {/* Core interactive point */}
              <circle 
                cx={hoverPos.x} 
                cy={hoverPos.y} 
                r="3.5" 
                fill={color} 
                stroke="#ffffff" 
                strokeWidth="1.5"
              />
            </g>
          )}
        </svg>

        {/* Real-time floating HTML Tooltip */}
        {hoveredIndex !== null && hoverPos && (
          <div 
            className="absolute bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-xl rounded-2xl p-3 text-xs pointer-events-none transition-all duration-75 z-20"
            style={{
              left: `${(hoverPos.x / width) * 100}%`,
              top: `${(hoverPos.y / height) * 100 - 68}%`,
              transform: "translateX(-50%)",
            }}
          >
            <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold mb-0.5 whitespace-nowrap">
              {chartData[hoveredIndex].fullDate}
            </div>
            <div className="flex items-center gap-1.5 font-display font-extrabold text-zinc-900 dark:text-zinc-50 text-sm">
              <span style={{ color }}>{symbol}{chartData[hoveredIndex].value.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className="text-[10px] text-zinc-400 font-normal">VES</span>
            </div>
          </div>
        )}
      </div>

      {/* Informative Footer */}
      <div className="flex items-center gap-2 text-[11px] text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-900/40 p-3 rounded-2xl border border-zinc-100 dark:border-zinc-800/40">
        <Clock size={12} className="shrink-0" />
        <span>Desliza el cursor sobre la gráfica para ver los detalles del reporte histórico guardado.</span>
      </div>
    </div>
  );
}
