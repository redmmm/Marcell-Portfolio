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

console.log('--- Supabase Keep-Alive Ping ---');
console.log(`SUPABASE_URL set: ${!!supabaseUrl}`);
console.log(`SUPABASE_PUBLISHABLE_KEY set: ${!!supabaseKey}`);

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ HIBA: Hiányzó környezeti változók!');
  console.error('Kérlek győződj meg róla, hogy a következő GitHub Secrets be vannak állítva:');
  console.error('  - SUPABASE_URL');
  console.error('  - SUPABASE_PUBLISHABLE_KEY');
  process.exit(1);
}

async function pingSupabase() {
  const timestamp = new Date().toISOString();
  console.log(`\n[${timestamp}] 🔄 Supabase Keep-Alive Ping indítása...`);

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
    const responseText = await response.text();

    if (!response.ok) {
      console.error(`❌ Hiba történt a lekérdezés során! Státuszkód: ${response.status} (${response.statusText})`);
      console.error('Válasz:', responseText);
      console.error('\nLehetséges okok:');
      console.error('  - Helytelen SUPABASE_URL vagy SUPABASE_PUBLISHABLE_KEY a GitHub Secrets-ben');
      console.error('  - A site_settings tábla nem létezik');
      console.error('  - A Supabase projekt le van állítva');
      process.exit(1);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = responseText;
    }

    console.log(`✅ Supabase Keep-Alive Ping SIKERES! (${duration}ms)`);
    console.log(`Válasz státuszkód: ${response.status}`);
    console.log('Lekért rekord:', JSON.stringify(data));
    console.log('Az adatbázis aktivitás rögzítve, a 7 napos inaktivitási leállás megelőzve.');
  } catch (err) {
    console.error('❌ Hálózati hiba történt a Supabase elérésekor:', err.message || err);
    process.exit(1);
  }
}

pingSupabase();
