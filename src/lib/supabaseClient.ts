// Direct Supabase REST Client
// Designed to run 100% in the browser (highly reliable fallback for static hostings like Vercel)

export const SUPABASE_URL = "https://jleloxpjsqpvqnhyjqco.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_mClhlK4tYEbPaYWKqO0Buw_hRClp85r";

export interface HistoryEntry {
  id?: number;
  created_at: string;
  usd_bcv: number;
  usd_parallel: number;
  eur_bcv: number;
  eur_parallel: number;
}

/**
 * Fetch historical data directly from the Supabase REST API from the browser.
 */
export async function fetchHistoryDirect(range: "24h" | "7d" | "30d" | string): Promise<HistoryEntry[]> {
  let limit = 120;
  if (range === "24h") {
    limit = 24;
  } else if (range === "7d") {
    limit = 50;
  } else {
    limit = 120;
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/rates_history?select=*&order=created_at.desc&limit=${limit}`, {
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error de API de Supabase (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  if (Array.isArray(data)) {
    if (data.length === 0) {
      throw new Error("La tabla 'rates_history' está vacía");
    }
    // Reverse to chronological order (ascending) for the chart
    return data.reverse();
  }
  
  throw new Error("Formato de respuesta inválido de Supabase REST");
}

/**
 * Seed initial historical records to provide a gorgeous initial chart
 */
export async function seedInitialDataDirect(): Promise<boolean> {
  const history: Omit<HistoryEntry, "id">[] = [];
  const today = new Date();
  
  // Base rates around Jan 1, 2026
  const base_usd_bcv = 36.50;
  const base_usd_parallel = 43.80;
  const baseDate = new Date("2026-01-01").getTime();

  // Generate 30 days of beautiful seed data
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const diffDays = Math.floor((d.getTime() - baseDate) / (1000 * 60 * 60 * 24)) || 190;
    
    const usd_bcv = parseFloat((base_usd_bcv + diffDays * 0.0045 + Math.sin(diffDays * 0.08) * 0.15).toFixed(2));
    const usd_parallel = parseFloat((base_usd_parallel + diffDays * 0.0068 + Math.sin(diffDays * 0.09) * 0.22).toFixed(2));
    const eur_bcv = parseFloat((usd_bcv * 1.082).toFixed(2));
    const eur_parallel = parseFloat((usd_parallel * 1.085).toFixed(2));

    history.push({
      created_at: d.toISOString(),
      usd_bcv,
      usd_parallel,
      eur_bcv,
      eur_parallel
    });
  }

  console.log("Seeding initial data directly to Supabase table...");
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rates_history`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=minimal"
    },
    body: JSON.stringify(history)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Fallo al sembrar datos (${response.status}): ${errorText}`);
  }

  return true;
}
