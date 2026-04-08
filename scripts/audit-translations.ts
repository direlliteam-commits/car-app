import { GoogleGenAI } from "@google/genai";
import * as fs from "fs";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY!,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL!,
  },
});

const i18nPath = "lib/i18n.ts";
const content = fs.readFileSync(i18nPath, "utf8");
const lines = content.split("\n");

function extractNestedKeys(startLine: number, endLine: number): Record<string, string> {
  const result: Record<string, string> = {};
  const rawLines = lines.slice(startLine - 1, endLine - 1);
  const sectionStack: string[] = [];
  for (const line of rawLines) {
    const sectionMatch = line.match(/^\s+(\w+):\s*\{/);
    if (sectionMatch) { sectionStack.push(sectionMatch[1]); continue; }
    const closeBrace = line.match(/^\s+\},?\s*$/);
    if (closeBrace) { sectionStack.pop(); continue; }
    const kvMatch = line.match(/^\s+(\w+):\s*"((?:[^"\\]|\\.)*)"/);
    if (kvMatch && sectionStack.length > 0) {
      result[[...sectionStack, kvMatch[1]].join(".")] = kvMatch[2];
    }
  }
  return result;
}

async function callGemini(prompt: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: { maxOutputTokens: 16384 },
  });
  return response.text || "{}";
}

function parseJSON(text: string): Record<string, string> {
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[1]); } catch {}
  }
  return {};
}

const mode = process.argv[2] || "all";

async function main() {
  const ruDict = extractNestedKeys(31, 2956);
  const hyDict = extractNestedKeys(2956, 5879);
  console.log(`RU: ${Object.keys(ruDict).length}, HY: ${Object.keys(hyDict).length}`);

  const existingFixes: Record<string, string> = fs.existsSync("scripts/translation-fixes.json")
    ? JSON.parse(fs.readFileSync("scripts/translation-fixes.json", "utf8"))
    : {};

  const allFixes: Record<string, string> = { ...existingFixes };

  if (mode === "cyrillic" || mode === "all") {
    const cyrillicKeys: Record<string, string> = {};
    for (const [key, value] of Object.entries(hyDict)) {
      if (/[а-яА-ЯёЁ]/.test(value)) cyrillicKeys[key] = ruDict[key] || value;
    }
    console.log(`\n--- CYRILLIC IN HY: ${Object.keys(cyrillicKeys).length} keys ---`);
    if (Object.keys(cyrillicKeys).length > 0) {
      const entries = Object.entries(cyrillicKeys).map(([k, v]) => `${k} | ${v}`).join("\n");
      const prompt = `Ты — профессиональный переводчик русского и армянского языков.
Переведи с русского на армянский. Для юридических текстов сохраняй \\n.
Формат ответа: JSON {"key": "перевод"}

${entries}`;
      const result = parseJSON(await callGemini(prompt));
      console.log(`  Got ${Object.keys(result).length} translations`);
      Object.assign(allFixes, result);
    }
  }

  if (mode === "vehicle" || mode === "all") {
    const vehicleRu: Record<string, string> = {};
    const vehicleHy: Record<string, string> = {};
    for (const key of Object.keys(ruDict)) {
      if (key.startsWith("vehicle.") || key.startsWith("bodyTypes.")) {
        vehicleRu[key] = ruDict[key];
        if (hyDict[key]) vehicleHy[key] = hyDict[key];
      }
    }
    console.log(`\n--- VEHICLE AUDIT: ${Object.keys(vehicleRu).length} keys ---`);
    const entries = Object.keys(vehicleRu).map(k => `${k} | RU: ${vehicleRu[k]} | HY: ${vehicleHy[k] || "MISSING"}`).join("\n");
    const prompt = `Ты — профессиональный переводчик, специалист по автомобильной терминологии на армянском языке.
Проверь переводы с русского на армянский для автомобильного маркетплейса.

Критерии:
- Правильность автомобильных терминов на армянском
- Грамматика и естественность
- Если MISSING — переведи
- Используй принятые в Армении автомобильные термины

Верни ТОЛЬКО исправления в JSON: {"key": "исправленный_перевод"}
Если всё правильно для данного ключа — не включай его.

${entries}`;
    const result = parseJSON(await callGemini(prompt));
    console.log(`  Got ${Object.keys(result).length} fixes`);
    Object.assign(allFixes, result);
  }

  if (mode === "sections" || mode === "all") {
    const sections = new Map<string, { ru: Record<string, string>, hy: Record<string, string> }>();
    for (const key of Object.keys(ruDict)) {
      const section = key.split(".")[0];
      if (section === "vehicle" || section === "bodyTypes") continue;
      if (!sections.has(section)) sections.set(section, { ru: {}, hy: {} });
      sections.get(section)!.ru[key] = ruDict[key];
      if (hyDict[key] && !/[а-яА-ЯёЁ]/.test(hyDict[key])) {
        sections.get(section)!.hy[key] = hyDict[key];
      }
    }

    const megaBatches: Array<{ section: string, entries: string[] }> = [];
    let currentBatch: { section: string, entries: string[] } = { section: "", entries: [] };

    for (const [section, data] of sections) {
      const entries = Object.keys(data.ru)
        .filter(k => data.hy[k])
        .map(k => `${k} | RU: ${data.ru[k]} | HY: ${data.hy[k]}`);
      if (entries.length === 0) continue;

      if (currentBatch.entries.length + entries.length > 150) {
        if (currentBatch.entries.length > 0) megaBatches.push(currentBatch);
        currentBatch = { section, entries: [] };
      }
      currentBatch.section += (currentBatch.section ? "+" : "") + section;
      currentBatch.entries.push(...entries);
    }
    if (currentBatch.entries.length > 0) megaBatches.push(currentBatch);

    console.log(`\n--- UI SECTIONS: ${megaBatches.length} batches ---`);

    for (let i = 0; i < megaBatches.length; i++) {
      const batch = megaBatches[i];
      console.log(`  Batch ${i + 1}/${megaBatches.length}: ${batch.section} (${batch.entries.length} keys)...`);

      const prompt = `Ты — профессиональный переводчик русского и армянского для мобильного приложения.
Проверь переводы. Верни ТОЛЬКО исправления в JSON: {"key": "fix"}
Если перевод правильный — не включай.

${batch.entries.join("\n")}`;

      try {
        const result = parseJSON(await callGemini(prompt));
        const fixCount = Object.keys(result).length;
        if (fixCount > 0) {
          console.log(`    ${fixCount} fixes`);
          Object.assign(allFixes, result);
        } else {
          console.log(`    OK`);
        }
      } catch (e) {
        console.error(`    Error:`, e);
      }

      if (i < megaBatches.length - 1) await new Promise(r => setTimeout(r, 500));
    }
  }

  const optRu = extractOptionTranslations("ru");
  const optHy = extractOptionTranslations("hy");
  if ((mode === "options" || mode === "all") && Object.keys(optRu).length > 0) {
    console.log(`\n--- OPTION TRANSLATIONS: RU=${Object.keys(optRu).length}, HY=${Object.keys(optHy).length} ---`);
    const entries = Object.keys(optRu).map(k => `opt.${k} | RU: ${optRu[k]} | HY: ${optHy[k] || "MISSING"}`).join("\n");
    const prompt = `Ты — профессиональный переводчик автомобильных терминов (комплектация/опции автомобиля).
Проверь переводы опций/комплектации с русского на армянский.
Верни ТОЛЬКО исправления в JSON: {"opt.key": "fix"}

${entries}`;
    const result = parseJSON(await callGemini(prompt));
    console.log(`  Got ${Object.keys(result).length} fixes`);
    Object.assign(allFixes, result);
  }

  console.log(`\n=== TOTAL: ${Object.keys(allFixes).length} fixes ===`);
  fs.writeFileSync("scripts/translation-fixes.json", JSON.stringify(allFixes, null, 2), "utf8");
  console.log("Written to scripts/translation-fixes.json");

  for (const [k, v] of Object.entries(allFixes).slice(0, 30)) {
    const orig = hyDict[k] || optHy[k.replace("opt.", "")] || "(missing)";
    console.log(`  ${k}: "${orig}" → "${v}"`);
  }
}

function extractOptionTranslations(lang: string): Record<string, string> {
  const result: Record<string, string> = {};
  const optStart = content.indexOf("const optionTranslations");
  if (optStart === -1) return result;
  const optBlock = content.substring(optStart);
  const langMatch = optBlock.match(new RegExp(`${lang}:\\s*\\{([^}]+(?:\\{[^}]*\\}[^}]*)*)\\}`, "s"));
  if (!langMatch) return result;
  const regex = /"([^"]+)":\s*"([^"]*)"/g;
  let m;
  while ((m = regex.exec(langMatch[1])) !== null) {
    result[m[1]] = m[2];
  }
  return result;
}

main().catch(console.error);
