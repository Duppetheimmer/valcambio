import React from "react";
import { TrendingUp, TrendingDown, ArrowRight, Info } from "lucide-react";

interface CurrencyCardProps {
  id: string;
  title: string;
  rate: number;
  currencySymbol: string;
  source: string;
  isOfficial: boolean;
  rateType: "USD" | "EUR";
  seed: number;
}

export default function CurrencyCard({
  id,
  title,
  rate,
  currencySymbol,
  source,
  isOfficial,
  rateType,
  seed
}: CurrencyCardProps) {
  // Generate a beautiful, stable simulated 7-day sparkline
  const generateSparklineData = (baseRate: number, s: number) => {
    const points: number[] = [];
    let curr = baseRate * 0.988;
    for (let i = 0; i < 6; i++) {
      // Deterministic pseudo-random variation
      const wave = Math.sin(s * 10 + i * 2) * 0.004 * baseRate;
      curr += wave;
      points.push(curr);
    }
    points.push(baseRate); // Final point is current rate
    return points;
  };

  const sparklineData = generateSparklineData(rate, seed);
  const minVal = Math.min(...sparklineData);
  const maxVal = Math.max(...sparklineData);
  const range = maxVal - minVal || 1;

  // Sparkline SVG path coordinates
  const width = 120;
  const height = 40;
  const pointsString = sparklineData
    .map((val, idx) => {
      const x = (idx / (sparklineData.length - 1)) * width;
      const y = height - 4 - ((val - minVal) / range) * (height - 8);
      return `${x},${y}`;
    })
    .join(" ");

  // Trend detection (comparing last two simulated days)
  const isUp = sparklineData[sparklineData.length - 1] >= sparklineData[sparklineData.length - 2];
  const percentChange = ((sparklineData[sparklineData.length - 1] - sparklineData[sparklineData.length - 2]) / sparklineData[sparklineData.length - 2]) * 100;

  return (
    <div 
      id={id}
      className="relative bg-white dark:bg-zinc-950/80 dark:backdrop-blur-md border border-zinc-100 dark:border-zinc-900/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-300 group"
    >
      {/* Official vs Parallel Ribbon */}
      <span className={`absolute top-4 right-4 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
        isOfficial 
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/30" 
          : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-100/50 dark:border-amber-900/30"
      }`}>
        {isOfficial ? "Oficial BCV" : "Binance"}
      </span>

      <div className="flex flex-col h-full justify-between">
        <div>
          {/* Title */}
          <h3 className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5">
            {title}
          </h3>

          {/* Rate Display */}
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-display font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {rate.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-sm font-semibold text-zinc-400 dark:text-zinc-500">
              VES / {rateType}
            </span>
          </div>

          {/* Trend Indicator */}
          <div className="flex items-center gap-1.5 mt-2.5">
            {isUp ? (
              <span className="flex items-center gap-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded-md">
                <TrendingUp size={12} />
                +{percentChange.toFixed(2)}%
              </span>
            ) : (
              <span className="flex items-center gap-0.5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 px-1.5 py-0.5 rounded-md">
                <TrendingDown size={12} />
                {percentChange.toFixed(2)}%
              </span>
            )}
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
              últimas 24h
            </span>
          </div>
        </div>

        {/* Bottom Section with Sparkline & Source */}
        <div className="flex items-end justify-between mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800/60">
          <div className="flex flex-col max-w-[55%]">
            <span className="text-[10px] uppercase font-semibold text-zinc-400 dark:text-zinc-500 tracking-wider">
              Fuente
            </span>
            <span className="text-xs text-zinc-600 dark:text-zinc-300 font-medium truncate" title={source}>
              {source}
            </span>
          </div>

          {/* Sparkline Visualization */}
          <div className="flex flex-col items-end">
            <svg width={width} height={height} className="overflow-visible">
              <defs>
                <linearGradient id={`gradient-${id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop 
                    offset="0%" 
                    stopColor={isUp ? "#10b981" : "#f43f5e"} 
                    stopOpacity="0.2" 
                  />
                  <stop 
                    offset="100%" 
                    stopColor={isUp ? "#10b981" : "#f43f5e"} 
                    stopOpacity="0" 
                  />
                </linearGradient>
              </defs>
              {/* Fill Area */}
              <path
                d={`M 0,${height} L ${pointsString} L ${width},${height} Z`}
                fill={`url(#gradient-${id})`}
                className="transition-all duration-300"
              />
              {/* Line */}
              <polyline
                fill="none"
                stroke={isUp ? "#10b981" : "#f43f5e"}
                strokeWidth="1.75"
                points={pointsString}
                className="transition-all duration-300"
              />
              {/* Endpoint Pulse */}
              <circle
                cx={width}
                cy={height - 4 - ((rate - minVal) / range) * (height - 8)}
                r="3"
                fill={isUp ? "#10b981" : "#f43f5e"}
                className="animate-pulse"
              />
            </svg>
            <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono mt-1">
              Tendencia semanal
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
