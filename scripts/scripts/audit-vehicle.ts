import { GoogleGenAI } from "@google/genai";
import * as fs from "fs";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY!,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL!,
  },
});

const content = fs.readFileSync("lib/i18n.ts", "utf8");
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

const batch = process.argv[2] || "vehicle";

async function main() {
  const ruDict = extractNestedKeys(31, 2956);
  const hyDict = extractNestedKeys(2956, 5879);

  let entries: string[] = [];
  let label = "";

  if (batch === "vehicle") {
    label = "Vehicle types, body types, fuel, transmission, drive, conditions";
    for (const key of Object.keys(ruDict)) {
      if (key.startsWith("vehicle.") || key.startsWith("bodyTypes.")) {
        entries.push(`${key} | RU: ${ruDict[key]} | HY: ${hyDict[key] || "MISSING"}`);
      }
    }
  } else if (batch === "equipment") {
    label = "Equipment, specs, features";
    for (const key of Object.keys(ruDict)) {
      if (key.startsWith("equipment.") || key.startsWith("motoSpecs.") || key.startsWith("truckSpecs.") || key.startsWith("specialSpecs.")) {
        entries.push(`${key} | RU: ${ruDict[key]} | HY: ${hyDict[key] || "MISSING"}`);
      }
    }
  } else if (batch === "options") {
    label = "Car options/features (optionTranslations)";
    const optBlock = content.substring(content.indexOf("const optionTranslations"));
    const extractOpt = (lang: string) => {
      const result: Record<string, string> = {};
      const langMatch = optBlock.match(new RegExp(`${lang}:\\s*\\{([^}]+(?:\\{[^}]*\\}[^}]*)*)\\}`, "s"));
      if (!langMatch) return result;
      const regex = /"([^"]+)":\s*"([^"]*)"/g;
      let m;
      while ((m = regex.exec(langMatch[1])) !== null) result[m[1]] = m[2];
      return result;
    };
    const ruOpt = extractOpt("ru");
    const hyOpt = extractOpt("hy");
    for (const key of Object.keys(ruOpt)) {
      entries.push(`opt.${key} | RU: ${ruOpt[key]} | HY: ${hyOpt[key] || "MISSING"}`);
    }
  } else if (batch.startsWith("ui")) {
    const uiSections = batch.replace("ui-", "").split(",");
    label = `UI sections: ${uiSections.join(", ")}`;
    for (const key of Object.keys(ruDict)) {
      const section = key.split(".")[0];
      if (uiSections.includes(section) && hyDict[key]) {
        entries.push(`${key} | RU: ${ruDict[key]} | HY: ${hyDict[key]}`);
      }
    }
  }

  console.log(`Audit: ${label} (${entries.length} entries)`);

  if (entries.length === 0) { console.log("No entries to audit"); return; }

  const prompt = `Ты — профессиональный переводчик русского и армянского языков, специализирующийся на автомобильной тематике и мобильных приложениях.

Проверь качество перевода с русского на армянский для автомобильного маркетплейса AutoArmenia.
Секция: ${label}

Критерии проверки:
1. Смысловая правильность перевода
2. Грамматическая корректность армянского
3. Естественность звучания (как бы сказал носитель армянского)
4. Правильность автомобильных терминов принятых в Армении
5. Если HY = "MISSING" — переведи
6. Краткость в UI элементах (кнопки, метки)

Формат каждой строки: key | RU: русский | HY: армянский

Верни ТОЛЬКО исправления в JSON: {"key": "исправленный_армянский"}
Если перевод правильный — НЕ включай в ответ.
Пустой JSON {} если всё правильно.

${entries.join("\n")}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: { maxOutputTokens: 8192 },
  });

  const text = response.text || "{}";
  fs.writeFileSync(`scripts/audit-${batch}-raw.txt`, text, "utf8");
  
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/s);
  if (jsonMatch) {
    try {
      const fixes = JSON.parse(jsonMatch[1]);
      const count = Object.keys(fixes).length;
      console.log(`Found ${count} fixes`);
      fs.writeFileSync(`scripts/audit-${batch}.json`, JSON.stringify(fixes, null, 2));
      for (const [k, v] of Object.entries(fixes)) {
        const orig = hyDict[k] || "(missing)";
        console.log(`  ${k}: "${orig}" → "${v}"`);
      }
    } catch (e) {
      console.log("JSON parse error:", e);
      console.log("Raw text saved to audit-" + batch + "-raw.txt");
    }
  } else {
    console.log("No JSON found in response, raw saved to audit-" + batch + "-raw.txt");
  }
}

main().catch(console.error);
