import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// 1. Load environment variables manually without requiring dotenv
const envPath = path.resolve(process.cwd(), '.env');
let env = {};
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^#][^\s=]+)\s*=\s*(.*)$/);
    if (match) env[match[1]] = match[2].replace(/^['"](.*)['"]$/, '$1').trim();
  });
} else {
  console.error("❌ No .env file found! Please run this script from the root roadmap directory.");
  process.exit(1);
}

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY; // or ANON key

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. Data Generators
const types = ['pothole', 'crack', 'water_hazard', 'debris'];
const severities = ['low', 'medium', 'high'];
const areas = ['Steel Plant Junction', 'Five Roads', 'Omalur Road', 'Yercaud Foothills', 'New Bus Stand', 'Four Roads'];

function generateRandomObstacle() {
  const type = types[Math.floor(Math.random() * types.length)];
  const severity = severities[Math.floor(Math.random() * severities.length)];
  const area = areas[Math.floor(Math.random() * areas.length)];
  
  // Base coordinates for Salem, TN area
  const baseLat = 11.6643;
  const baseLng = 78.1460;
  
  const lat = baseLat + (Math.random() - 0.5) * 0.05;
  const lng = baseLng + (Math.random() - 0.5) * 0.05;

  const obstacleId = `RODS-AUTO-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

  return {
    obstacle_id: obstacleId,
    type,
    severity,
    lat,
    lng,
    address: `${area} Main Road`,
    area,
    detected_at: new Date().toISOString(),
    status: 'reported',
    is_false_detection: false
  };
}

// 3. Execution Loop
let count = 0;
const MAX_SIMULATIONS = 10; // Stops after 10 so it doesn't run forever accidentally
const INTERVAL_MS = 8000;  // 8 seconds

console.log("🟢 Starting AI Camera Simulation...");
console.log(`Will simulate ${MAX_SIMULATIONS} obstacles, one every ${INTERVAL_MS/1000} seconds.`);

const timer = setInterval(async () => {
  count++;
  if (count > MAX_SIMULATIONS) {
    clearInterval(timer);
    console.log("🛑 Simulation complete.");
    process.exit(0);
  }

  const newObstacle = generateRandomObstacle();
  console.log(`[${count}/${MAX_SIMULATIONS}] 📸 Camera detected: ${newObstacle.severity.toUpperCase()} ${newObstacle.type} at ${newObstacle.area}`);
  
  const { error } = await supabase
    .from('obstacles')
    .insert([newObstacle]);

  if (error) {
    console.error("❌ Failed to push to Supabase:", error.message);
  } else {
    console.log("✅ Successfully pushed to radar dashboard.");
  }
}, INTERVAL_MS);
