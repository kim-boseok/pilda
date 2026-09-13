// OSM(Overpass)으로 지점의 도로명주소를 얼마나 얻을 수 있는지 표본 조사
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const stDir = join(root, 'src', 'data', 'stations');
const list = [];
for (const f of readdirSync(stDir)) {
  if (!f.endsWith('.ts') || f === 'addresses.ts') continue;
  const src = readFileSync(join(stDir, f), 'utf8');
  const re = /\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*region:\s*'\w+',\s*lat:\s*([\d.]+),\s*lon:\s*([\d.]+)/g;
  let m;
  while ((m = re.exec(src))) list.push({ id: m[1], name: m[2], lat: +m[3], lon: +m[4] });
}

// 고르게 20곳 표본
const step = Math.floor(list.length / 20);
const sample = Array.from({ length: 20 }, (_, i) => list[i * step]);

async function overpass(q) {
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'User-Agent': 'pilda-probe/1.0 (kimbos2ok@gmail.com)', 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'data=' + encodeURIComponent(q),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function havM(a, b, c, d) {
  const R = 6371000, r = (x) => (x * Math.PI) / 180;
  const dLat = r(c - a), dLon = r(d - b);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

let withAddr = 0, withRoad = 0;
for (const s of sample) {
  let line = `${s.name.padEnd(18)} `;
  try {
    const j = await overpass(`[out:json][timeout:25];nwr(around:1200,${s.lat},${s.lon})["addr:housenumber"]["addr:street"];out tags center 60;`);
    const els = j.elements.map((e) => {
      const lat = e.lat ?? e.center?.lat, lon = e.lon ?? e.center?.lon;
      return { st: e.tags['addr:street'], no: e.tags['addr:housenumber'], d: lat ? havM(s.lat, s.lon, lat, lon) : Infinity };
    }).sort((a, b) => a.d - b.d);
    if (els.length) { withAddr++; line += `주소 ${els.length}건 · 최근접 ${els[0].st} ${els[0].no} (${Math.round(els[0].d)}m)`; }
    else {
      const j2 = await overpass(`[out:json][timeout:25];way(around:1200,${s.lat},${s.lon})["highway"]["name"~"(로|길)$"];out tags 30;`);
      const names = [...new Set(j2.elements.map((e) => e.tags.name))];
      if (names.length) { withRoad++; line += `번지없음 · 도로만: ${names.slice(0, 3).join(', ')}`; }
      else line += '도로·주소 모두 없음';
    }
  } catch (e) { line += `오류 ${e.message}`; }
  console.log(line);
  await new Promise((r) => setTimeout(r, 1500));
}
console.log(`\n번지까지 있음 ${withAddr}/20 · 도로명만 ${withRoad}/20`);
