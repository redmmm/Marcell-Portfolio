// Supabase Keep-Alive Ping Script
// Automatikus lekérdezést végez a Supabase PostgREST API felé az inaktivitási leállás (pause) megelőzésére.
// Natív fetch-et használ, így nincs külső függősége (Node.js 18+ natívan támogatja).

// Környezeti változók betöltése lokális futtatás esetén (.env fájlból)
if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch {
    // Ha a .env nem található (pl. GitHub Actions vagy CI környezet), a rendszer szintű környezeti változókat használja
  }
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ HIBA: Hiányzó környezeti változók!');
  console.error('Kérlek győződj meg róla, hogy a SUPABASE_URL és SUPABASE_PUBLISHABLE_KEY be van állítva.');
  process.exit(1);
}

async function pingSupabase() {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 🔄 Supabase Keep-Alive Ping indítása...`);

  // Egyszerű, erőforráskímélő READ művelet: lekérünk 1 rekord azonosítót a létező site_settings táblából
  const endpoint = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/site_settings?select=id&limit=1`;
  console.log(`Végpont: ${endpoint}`);

  try {
    const startTime = performance.now();
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
    });

    const duration = Math.round(performance.now() - startTime);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Hiba történt a lekérdezés során! Státuszkód: ${response.status} (${response.statusText})`);
      console.error('Válasz:', errorText);
      process.exit(1);
    }

    const data = await response.json();

    console.log(`✅ Supabase Keep-Alive Ping SIKERES! (${duration}ms)`);
    console.log(`Válasz státuszkód: ${response.status}`);
    console.log('Lekért rekord:', JSON.stringify(data));
    console.log('Az adatbázis aktivitás rögzítve, a 7 napos inaktivitási leállás megelőzve.');
  } catch (err) {
    console.error('❌ Hálózati hiba történt a Supabase elérésekor:', err);
    process.exit(1);
  }
}

pingSupabase();
