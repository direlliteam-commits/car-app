import fs from 'fs';
import path from 'path';

const API_KEY = process.env.STREAMLINE_API_KEY;
const BASE_URL = 'https://public-api.streamlinehq.com/v1';
const SVG_DIR = path.join(__dirname, '..', 'assets', 'icons', 'svg');
const OUTPUT_FILE = path.join(__dirname, '..', 'components', 'StreamlineIcons.tsx');

const PREFERRED_FAMILIES = [
  'streamline-regular',
  'streamline-light',
  'core-line',
  'core-line-free',
  'iconoir-regular',
  'lucide-line',
  'heroicons-outline',
  'solar-linear',
];

interface SearchResult {
  hash: string;
  name: string;
  familySlug: string;
  isFree: boolean;
}

interface SearchResponse {
  results: SearchResult[];
  pagination: { total: number; hasMore: boolean };
}

const ICON_SEARCH_MAP: Record<string, { query?: string; hash?: string }> = {
  "search": { query: "search magnifying glass" },
  "heart": { query: "heart love" },
  "close": { query: "close x square" },
  "close-circle": { query: "close circle x" },
  "arrow-back": { query: "arrow left" },
  "arrow-up": { query: "arrow up chevron" },
  "arrow-down": { query: "arrow down chevron" },
  "arrow-right": { query: "arrow right" },
  "arrow-forward": { query: "arrow right forward" },
  "camera": { query: "camera photo" },
  "location": { query: "location pin map" },
  "checkmark": { query: "check checkmark" },
  "checkmark-circle": { query: "check circle" },
  "checkmark-done": { query: "check double done" },
  "checkbox": { query: "checkbox square check" },
  "add-circle": { query: "add circle plus" },
  "add": { query: "add plus" },
  "remove": { query: "minus remove" },
  "calendar": { query: "calendar date" },
  "pricetag": { query: "tag price" },
  "list": { query: "list bullet" },
  "layers": { query: "layers stack" },
  "cube": { query: "cube box 3d" },
  "person": { query: "user person" },
  "chatbubble": { query: "chat message bubble" },
  "bookmark": { query: "bookmark save" },
  "trash": { query: "trash delete bin" },
  "notifications": { query: "bell notification" },
  "notifications-off": { query: "bell off notification" },
  "share": { query: "share" },
  "shield": { hash: "ico_mRu4pQJ4v1LleLj08Ug0YEIK" },
  "repeat": { query: "repeat loop refresh" },
  "trending-up": { query: "trending up arrow graph" },
  "trending-down": { query: "trending down arrow" },
  "options": { query: "sliders settings options" },
  "information-circle": { query: "information circle info" },
  "image": { query: "image photo gallery" },
  "send": { query: "send paper plane" },
  "settings": { hash: "ico_mRu4pQJ4vlcteLj08Ug0Yr6r" },
  "log-out": { query: "logout exit" },
  "log-in": { query: "login enter" },
  "create": { query: "edit pencil write" },
  "call": { query: "phone call" },
  "mail": { query: "email mail envelope" },
  "time": { query: "clock time" },
  "eye": { hash: "ico_mRu4pQJ4voYS2aEDeGjUA3gZ" },
  "eye-off": { query: "eye off hide" },
  "star": { query: "star favorite" },
  "bar-chart": { hash: "ico_mRu4pQJ4vtl62aEaf7P2Wegi" },
  "copy": { query: "copy duplicate" },
  "refresh": { query: "refresh reload" },
  "alert-circle": { query: "alert circle warning" },
  "warning": { query: "warning triangle alert" },
  "download": { query: "download arrow" },
  "lock-closed": { hash: "ico_mRu4pQJ4vokE2aEDeGSFbV48" },
  "cash": { query: "money cash dollar" },
  "file-tray": { query: "inbox tray" },
  "briefcase": { query: "briefcase work" },
  "people": { query: "users people group" },
  "globe": { query: "globe earth world" },
  "flash": { query: "flash lightning bolt" },
  "flag": { query: "flag report" },
  "document-text": { query: "document text file" },
  "link": { query: "link chain" },
  "expand": { query: "expand maximize fullscreen" },
  "mic": { query: "microphone mic" },
  "happy": { query: "emoji happy smile" },
  "swap-vertical": { query: "swap vertical arrows" },
  "grid": { query: "grid layout" },
  "pulse": { hash: "ico_mRu4pQJ4v96ceLj08Un8O9Ya" },
  "water": { query: "water drop" },
  "navigate": { query: "navigation route direction" },
  "disc": { query: "disc circle record" },
  "text": { query: "text typography" },
  "car": { hash: "ico_mRu4pQJ4vOa5eLj08UwvSTyj" },
  "sort": { query: "sort order" },
  "filter": { query: "filter funnel" },
  "calculator": { hash: "ico_mRu4pQJ4vBK02aEaf7sjstoT" },
  "git-merge": { query: "merge git" },
  "git-branch": { query: "branch git fork" },
  "award": { query: "award medal trophy" },
  "volume": { query: "volume sound speaker" },
  "thermometer": { query: "thermometer temperature" },
  "help-circle": { query: "help question circle" },
  "chevron-forward": { query: "chevron right" },
  "chevron-back": { query: "chevron left" },
  "chevron-down": { query: "chevron down" },
  "chevron-up": { query: "chevron up" },
  "message-circle": { query: "message circle chat" },
  "phone": { query: "phone telephone" },
  "archive": { query: "archive box" },

  "body-sedan": { hash: "ico_RiZw0ERE5igp3cjX" },
  "body-hatchback-3d": { hash: "ico_d4mW10IIgYH2I70q" },
  "body-hatchback-5d": { hash: "ico_d4mW10IIgYH2I70q" },
  "body-liftback": { hash: "ico_HlP14ZN8tmvhY6QV" },
  "body-suv-3d": { hash: "ico_pEUzQFfLY9XYMPzE" },
  "body-suv-5d": { hash: "ico_mRu4pQJ4vxwzeLj08USFb7ZG" },
  "body-crossover": { hash: "ico_DnoQzHvVlRwa1lbY" },
  "body-wagon": { hash: "ico_mRu4pQJ4vWu4eLj08UwAZCLh" },
  "body-coupe": { hash: "ico_g6oZBzNLGXki0E8f" },
  "body-convertible": { hash: "ico_zTVjio3eh3VtxpeP" },
  "body-minivan": { hash: "ico_mRu4pQJ4vRQCeLj08Ueixj4G" },
  "body-pickup": { hash: "ico_F374AVjjCANM1NUf" },
  "body-limousine": { hash: "ico_mRu4pQJ4v6YweLj08UBPuXeu" },
  "body-van": { hash: "ico_mRu4pQJ4vhGOeLj08U7yVp8B" },
  "body-compactvan": { hash: "ico_mRu4pQJ4vRQCeLj08Ueixj4G" },
  "body-roadster": { hash: "ico_9jM1QBihkS7afNzy" },
  "body-targa": { hash: "ico_mRu4pQJ4vd3feLj08USFbGdc" },
  "body-fastback": { hash: "ico_mRu4pQJ4vrBreLj08UBPuIlT" },
  "body-microvan": { hash: "ico_mRu4pQJ4vRQCeLj08Ueixj4G" },

  "transmission-automatic": { hash: "ico_mRu4pQJ4vnSbeLj08Un8Oy6B" },
  "transmission-manual": { hash: "ico_mRu4pQJ4vAn2eLj08Un8Ozfk" },
  "transmission-robot": { hash: "ico_aoz1rlPzXtODkJnU" },
  "transmission-variator": { hash: "ico_mRu4pQJ4vxZbeLj08Un8Ofzl" },

  "fuel-petrol": { hash: "ico_8mKP2UMCLovyRyjs" },
  "fuel-diesel": { hash: "ico_mRu4pQJ4v9K2eLj08Un8OSFb" },
  "fuel-hybrid": { hash: "ico_cUBZ3s3vMlSm07z1" },
  "fuel-electric": { hash: "ico_3k3tBUknbM8VWz8c" },
  "fuel-gas": { hash: "ico_4F7DOODIgrk6YYya" },
  "fuel-petrol-gas": { hash: "ico_8mKP2UMCLovyRyjs" },

  "drive-front": { hash: "ico_mRu4pQJ4vOa5eLj08UwvSTyj" },
  "drive-rear": { hash: "ico_mRu4pQJ4vOa5eLj08UwvSTyj" },
  "drive-all": { hash: "ico_pEUzQFfLY9XYMPzE" },

  "steering-left": { hash: "ico_mRu4pQJ4vTUpeLj08U3zik8U" },
  "steering-right": { hash: "ico_mRu4pQJ4vTUpeLj08U3zik8U" },

  "condition-new": { query: "star new sparkle" },
  "condition-used": { query: "clock history used" },
  "condition-damaged": { hash: "ico_3TgqKuDM6tUL3npF" },

  "accident-none": { hash: "ico_mRu4pQJ4vE1eeLj08Ug0YY5y" },
  "accident-minor": { hash: "ico_beRDsvbZCwoXz85n" },
  "accident-major": { hash: "ico_3TgqKuDM6tUL3npF" },
  "accident-unknown": { query: "question help unknown" },

  "seller-all": { query: "users people all" },
  "seller-dealer": { hash: "ico_mRu4pQJ4vAGJeLjK1iPvJZbp" },
  "seller-private": { query: "user single person" },

  "availability-in-stock": { query: "check circle available" },
  "availability-on-order": { query: "clock timer waiting" },
  "availability-in-transit": { hash: "ico_mRu4pQJ4vGSdeLj08UHO2daR" },

  "mileage": { hash: "ico_luIQLXMFWkIzxB66" },
  "engine-volume": { hash: "ico_DUBCkxZA0Zo5qvLB" },
  "horsepower": { hash: "ico_yM9NigU352njF7Vu" },
  "color-palette": { query: "color palette paint" },
  "owners-count": { query: "users group people" },

  "market-analytics": { hash: "ico_08JBIg1OGgQYiFD9" },
  "credit-calculator": { hash: "ico_mRu4pQJ4vWlP2aEaf7sjsZF8" },

  "price-alert": { query: "bell notification alert" },
  "privacy-policy": { hash: "ico_mRu4pQJ4v1LleLj08Ug0YEIK" },
  "terms-of-service": { hash: "ico_c3L8Ue4ZjXKNeuKA" },
  "faq": { query: "question help faq" },
  "support": { query: "headset support help" },
  "clear-cache": { query: "trash delete clean" },
  "rate-app": { query: "star rating review" },
  "share-app": { query: "share external" },
  "blocked-users": { query: "user block forbidden" },
  "new-listings-alert": { query: "plus circle add new" },
  "sound-toggle": { query: "volume speaker sound" },
  "message-notification": { query: "message notification bubble" },
  "price-change-alert": { query: "tag price change" },
  "saved-search": { query: "bookmark save search" },
  "my-listings": { hash: "ico_mRu4pQJ4vaiDeLj08UwAZ8tU" },
  "dealer-profile": { hash: "ico_mRu4pQJ4vAGJeLjK1iPvJZbp" },
  "recently-viewed": { query: "clock history recent" },
  "comparison": { hash: "ico_mRu4pQJ4vLlm2aEaf7iJ4WCu" },
  "verified": { hash: "ico_mRu4pQJ4vJM52aEDeGDeGBrC" },
  "user-block": { query: "block forbidden ban" },
  "trade-in": { query: "exchange trade swap" },
  "views-count": { hash: "ico_mRu4pQJ4voYS2aEDeGjUA3gZ" },

  "eq-airbag": { hash: "ico_6QJZnmsEqkluJW38" },
  "eq-abs": { hash: "ico_EHBOFNPAE3vOeXnt" },
  "eq-esp": { hash: "ico_xJkTb3PPcrt72zDZ" },
  "eq-isofix": { hash: "ico_DshIfkc1MFZzsQmt" },
  "eq-climate": { hash: "ico_VL1Uo5tarh0yFirR" },
  "eq-cruise": { hash: "ico_YMILt3aor97wukUf" },
  "eq-parking-sensor": { hash: "ico_xPT6Uoi2c8N1TRZq" },
  "eq-parking-camera": { hash: "ico_mRu4pQJ4vRqbeLj08UgnsSDc" },
  "eq-heated-seats": { hash: "ico_mRu4pQJ4vkXdeLjK1iy7qoW7" },
  "eq-ventilated-seats": { hash: "ico_aZcLYnxbls5PP48z" },
  "eq-electric-seats": { hash: "ico_mRu4pQJ4vkXdeLjK1iy7qoW7" },
  "eq-heated-steering": { hash: "ico_mRu4pQJ4vTUpeLj08U3zik8U" },
  "eq-keyless": { hash: "ico_mRu4pQJ4vP9GeLjK1iPvJeSE" },
  "eq-start-button": { query: "button start power" },
  "eq-power-trunk": { hash: "ico_mRu4pQJ4vShSeLj08UHO2Hye" },
  "eq-sunroof": { hash: "ico_mRu4pQJ4v8LheLj08UBPuIj0" },
  "eq-panoramic-roof": { hash: "ico_c3UNm2fmzBMOSsOO" },
  "eq-navigation": { hash: "ico_HGiORZ78GBWUcMNc" },
  "eq-carplay": { hash: "ico_mRu4pQJ4vEnveLj08UwAZS5p" },
  "eq-android-auto": { hash: "ico_mRu4pQJ4vEnveLj08UwAZS5p" },
  "eq-premium-audio": { hash: "ico_mRu4pQJ4vw4D2aENc3PvJOgf" },
  "eq-wireless-charging": { hash: "ico_mRu4pQJ4vOde2aEhtdWipwAZ" },
  "eq-usb": { hash: "ico_mRu4pQJ4vPmo2aEhtdiJ4IAf" },
  "eq-bluetooth": { query: "bluetooth wireless" },
  "eq-led-headlights": { hash: "ico_mRu4pQJ4vSS7eLj08Un8Ophg" },
  "eq-xenon": { hash: "ico_mRu4pQJ4vSS7eLj08Un8Ophg" },
  "eq-adaptive-headlights": { hash: "ico_mRu4pQJ4vSS7eLj08Un8Ophg" },
  "eq-fog-lights": { hash: "ico_mRu4pQJ4vSS7eLj08Un8Ophg" },
  "eq-rain-sensor": { hash: "ico_xPT6Uoi2c8N1TRZq" },
  "eq-light-sensor": { query: "light sensor smart" },
  "eq-auto-dimming": { hash: "ico_mRu4pQJ4vxS5eLjQ3ywAZmoc" },
  "eq-tinted-windows": { hash: "ico_mRu4pQJ4v5RReLj08Un8OZdc" },
  "eq-alloy-wheels": { hash: "ico_p53vfLWbc6l9kS8t" },
  "eq-tire-pressure": { hash: "ico_TWXXfMJT09UfJrmt" },
  "eq-leather": { hash: "ico_gdkrfopCSfR0ajdt" },
  "eq-ambient-lighting": { query: "ambient light glow" },
  "eq-hud": { hash: "ico_mRu4pQJ4vZqh2aEDeGeLjSuT" },
  "eq-digital-dashboard": { hash: "ico_mRu4pQJ4vZqh2aEDeGeLjSuT" },
  "eq-multifunction-steering": { hash: "ico_mRu4pQJ4vTUpeLj08U3zik8U" },
  "eq-blind-spot": { hash: "ico_A1kVUqN2sAVdVZOi" },
  "eq-lane-keeping": { hash: "ico_A1kVUqN2sAVdVZOi" },
  "eq-collision-warning": { hash: "ico_beRDsvbZCwoXz85n" },
  "eq-night-vision": { query: "night vision moon" },
  "eq-hill-assist": { query: "hill slope climb" },
  "eq-fatigue-sensor": { query: "coffee fatigue drowsy" },
  "eq-road-sign-recognition": { hash: "ico_mRu4pQJ4vGudeLj08ULXcFSR" },
  "eq-mirrors-heated": { hash: "ico_mRu4pQJ4vxS5eLjQ3ywAZmoc" },
  "eq-mirrors-folding": { hash: "ico_OI6KBVoYjk3NT8Iz" },
  "eq-power-windows": { hash: "ico_Nnzhm0xRha2nURT6" },
};

async function searchIcon(query: string): Promise<SearchResult | null> {
  const url = `${BASE_URL}/search/global?productType=icons&query=${encodeURIComponent(query)}&style=line&limit=50`;
  const res = await fetch(url, {
    headers: { accept: 'application/json', 'x-api-key': API_KEY! },
  });
  if (!res.ok) {
    console.error(`Search failed for "${query}": ${res.status}`);
    return null;
  }
  const data: SearchResponse = await res.json();
  if (!data.results || data.results.length === 0) return null;

  for (const family of PREFERRED_FAMILIES) {
    const match = data.results.find(r => r.familySlug === family);
    if (match) return match;
  }
  return data.results[0];
}

async function downloadSvg(hash: string): Promise<string | null> {
  const url = `${BASE_URL}/icons/${hash}/download/svg?responsive=true`;
  const res = await fetch(url, {
    headers: { accept: 'image/svg+xml', 'x-api-key': API_KEY! },
  });
  if (!res.ok) {
    console.error(`Download failed for ${hash}: ${res.status} ${await res.text()}`);
    return null;
  }
  return await res.text();
}

function svgToComponentCode(svgContent: string, componentName: string): string {
  let paths = '';

  function parseAttrs(attrsStr: string): Record<string, string> {
    const attrs: Record<string, string> = {};
    const attrRegex = /([\w-]+)="([^"]*)"/g;
    let m;
    while ((m = attrRegex.exec(attrsStr)) !== null) {
      attrs[m[1]] = m[2];
    }
    return attrs;
  }

  function attrsToJsx(attrs: Record<string, string>): string {
    const jsxParts: string[] = [];
    for (const [key, val] of Object.entries(attrs)) {
      if (['class', 'id', 'xmlns', 'data-name'].includes(key)) continue;

      const jsxKey = key.replace(/-(\w)/g, (_, c) => c.toUpperCase());

      if ((key === 'stroke' || key === 'fill') && val !== 'none' && val !== '') {
        jsxParts.push(`${jsxKey}={color}`);
      } else {
        jsxParts.push(`${jsxKey}="${val}"`);
      }
    }
    return jsxParts.join(' ');
  }

  const elements: Array<{tag: string; jsxTag: string}> = [
    { tag: 'path', jsxTag: 'Path' },
    { tag: 'circle', jsxTag: 'Circle' },
    { tag: 'rect', jsxTag: 'Rect' },
    { tag: 'line', jsxTag: 'Line' },
    { tag: 'polyline', jsxTag: 'Polyline' },
    { tag: 'polygon', jsxTag: 'Polygon' },
    { tag: 'ellipse', jsxTag: 'Ellipse' },
  ];

  for (const { tag, jsxTag } of elements) {
    const regex = new RegExp(`<${tag}\\s+([^>]*?)\\s*/?>`, 'g');
    let match;
    while ((match = regex.exec(svgContent)) !== null) {
      const attrs = parseAttrs(match[1]);
      if (Object.keys(attrs).length > 0) {
        paths += `    <${jsxTag} ${attrsToJsx(attrs)} />\n`;
      }
    }
  }

  let viewBox = '0 0 24 24';
  const vbMatch = svgContent.match(/viewBox="([^"]+)"/);
  if (vbMatch) viewBox = vbMatch[1];

  return `export const ${componentName}: StreamlineIcon = ({ size = 24, color = "#000" }) => (
  <Svg width={size} height={size} viewBox="${viewBox}" fill="none">
${paths}  </Svg>
);`;
}

function toComponentName(semanticName: string): string {
  return 'Sl' + semanticName
    .split(/[-_]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  if (!API_KEY) {
    console.error('STREAMLINE_API_KEY not set');
    process.exit(1);
  }

  if (!fs.existsSync(SVG_DIR)) {
    fs.mkdirSync(SVG_DIR, { recursive: true });
  }

  const iconNames = Object.keys(ICON_SEARCH_MAP);
  console.log(`Processing ${iconNames.length} icons...`);

  const results: Record<string, { hash: string; svg: string; componentName: string; familySlug: string }> = {};
  const failed: string[] = [];
  const hashCache: Record<string, string> = {};

  for (let i = 0; i < iconNames.length; i++) {
    const name = iconNames[i];
    const config = ICON_SEARCH_MAP[name];
    const componentName = toComponentName(name);

    try {
      let iconHash: string;
      let familySlug = 'streamline-regular';

      if (config.hash) {
        iconHash = config.hash;
        console.log(`[${i + 1}/${iconNames.length}] "${name}" -> direct hash ${iconHash}`);
      } else if (config.query) {
        console.log(`[${i + 1}/${iconNames.length}] Searching "${name}" -> "${config.query}"...`);
        const searchResult = await searchIcon(config.query);
        if (!searchResult) {
          console.warn(`  No results for "${config.query}"`);
          failed.push(name);
          continue;
        }
        iconHash = searchResult.hash;
        familySlug = searchResult.familySlug;
        console.log(`  Found: "${searchResult.name}" (${familySlug})`);
      } else {
        console.warn(`  No query or hash for "${name}"`);
        failed.push(name);
        continue;
      }

      let svg: string;
      if (hashCache[iconHash]) {
        svg = hashCache[iconHash];
        console.log(`  Using cached SVG`);
      } else {
        const downloaded = await downloadSvg(iconHash);
        if (!downloaded) {
          failed.push(name);
          continue;
        }
        svg = downloaded;
        hashCache[iconHash] = svg;

        fs.writeFileSync(path.join(SVG_DIR, `${name}.svg`), svg);
      }

      results[name] = { hash: iconHash, svg, componentName, familySlug };
      console.log(`  OK`);
    } catch (err: any) {
      console.error(`  Error: ${err.message}`);
      failed.push(name);
    }

    if (i % 5 === 4) await sleep(200);
  }

  console.log(`\nGenerating component file...`);
  console.log(`Success: ${Object.keys(results).length}, Failed: ${failed.length}`);
  if (failed.length > 0) {
    console.log(`Failed icons: ${failed.join(', ')}`);
  }

  const usedElements = new Set<string>();
  for (const { svg } of Object.values(results)) {
    if (/<path\s/i.test(svg)) usedElements.add('Path');
    if (/<circle\s/i.test(svg)) usedElements.add('Circle');
    if (/<rect\s/i.test(svg)) usedElements.add('Rect');
    if (/<line\s/i.test(svg)) usedElements.add('Line');
    if (/<polyline\s/i.test(svg)) usedElements.add('Polyline');
    if (/<polygon\s/i.test(svg)) usedElements.add('Polygon');
    if (/<ellipse\s/i.test(svg)) usedElements.add('Ellipse');
  }

  const svgImports = ['Svg', ...Array.from(usedElements).sort()].join(', ');

  let output = `import React from "react";
import { ${svgImports} } from "react-native-svg";

interface StreamlineIconProps {
  size?: number;
  color?: string;
}

type StreamlineIcon = React.FC<StreamlineIconProps>;

`;

  for (const [name, { svg, componentName }] of Object.entries(results)) {
    output += svgToComponentCode(svg, componentName) + '\n\n';
  }

  output += `export const STREAMLINE_ICONS: Record<string, StreamlineIcon> = {\n`;
  for (const [name, { componentName }] of Object.entries(results)) {
    output += `  "${name}": ${componentName},\n`;
  }
  output += `};\n`;

  fs.writeFileSync(OUTPUT_FILE, output);
  console.log(`\nGenerated ${OUTPUT_FILE}`);
  console.log(`Total icons: ${Object.keys(results).length}`);

  const manifest = {
    generatedAt: new Date().toISOString(),
    totalIcons: Object.keys(results).length,
    failedIcons: failed,
    icons: Object.fromEntries(
      Object.entries(results).map(([name, { hash, familySlug }]) => [name, { hash, familySlug }])
    ),
  };
  fs.writeFileSync(path.join(SVG_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`Manifest saved to ${path.join(SVG_DIR, 'manifest.json')}`);
}

main().catch(console.error);
