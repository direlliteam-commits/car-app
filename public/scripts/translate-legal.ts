import { GoogleGenAI } from "@google/genai";
import * as fs from "fs";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY!,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL!,
  },
});

const batch = parseInt(process.argv[2] || "1");

const i18nContent = fs.readFileSync("lib/i18n.ts", "utf8");

function extractRuSection(sectionName: string, start: number, end: number): Record<string, string> {
  const lines = i18nContent.split("\n").slice(start - 1, end - 1);
  const result: Record<string, string> = {};
  let inSection = false;
  for (const line of lines) {
    if (line.match(new RegExp(`^\\s+${sectionName}:\\s*\\{`))) { inSection = true; continue; }
    if (inSection && line.match(/^\s+\},/)) { inSection = false; continue; }
    if (inSection) {
      const m = line.match(/^\s+(section\d+Content):\s*"((?:[^"\\]|\\.)*)"/);
      if (m) result[m[1]] = m[2];
    }
  }
  return result;
}

const ruTerms = extractRuSection("terms", 31, 2956);
const ruPrivacy = extractRuSection("privacy", 31, 2956);

console.log(`RU terms keys: ${Object.keys(ruTerms).length}`);
console.log(`RU privacy keys: ${Object.keys(ruPrivacy).length}`);

const batches: Record<number, { keys: string[], texts: Record<string, string>, type: string }> = {
  1: { keys: ["section1Content", "section2Content", "section3Content", "section4Content"], texts: ruTerms, type: "terms" },
  2: { keys: ["section5Content", "section6Content", "section7Content", "section8Content"], texts: ruTerms, type: "terms" },
  3: { keys: ["section9Content", "section10Content", "section11Content", "section12Content"], texts: ruTerms, type: "terms" },
  4: { keys: ["section13Content", "section14Content", "section15Content", "section16Content", "section17Content"], texts: ruTerms, type: "terms" },
  5: { keys: ["section1Content", "section2Content", "section3Content", "section4Content", "section5Content"], texts: ruPrivacy, type: "privacy" },
  6: { keys: ["section6Content", "section7Content", "section8Content"], texts: ruPrivacy, type: "privacy" },
  7: { keys: ["section9Content", "section10Content", "section11Content", "section12Content"], texts: ruPrivacy, type: "privacy" },
  8: { keys: ["section13Content", "section14Content", "section15Content"], texts: ruPrivacy, type: "privacy" },
};

async function main() {
  const b = batches[batch];
  if (!b) { console.log("Invalid batch:", batch); return; }
  
  const textsToTranslate: string[] = [];
  for (const key of b.keys) {
    if (b.texts[key]) {
      textsToTranslate.push(`KEY: ${key}\nRU: ${b.texts[key]}`);
    }
  }

  console.log(`Batch ${batch} (${b.type}): ${textsToTranslate.length} texts`);

  const prompt = `Ты — профессиональный юридический переводчик русского и армянского языков.

Переведи следующие юридические тексты с русского на АРМЯНСКИЙ язык для автомобильного маркетплейса AutoArmenia.
Это секция "${b.type === "terms" ? "Пользовательское соглашение" : "Политика конфиденциальности"}".

ВАЖНО:
- Сохраняй все \\n символы переноса строк точно как в оригинале
- Сохраняй все • маркеры списков
- Сохраняй email адреса и URL без перевода
- Сохраняй все номера пунктов (1.1., 2.1. и т.д.)
- Переводи юридически точно и полно
- НЕ сокращай текст
- Используй формальный стиль армянского языка

Верни результат в формате JSON:
{"section1Content": "армянский перевод", ...}

Тексты для перевода:

${textsToTranslate.join("\n\n---\n\n")}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { maxOutputTokens: 16384 },
    });

    const text = response.text || "";
    const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);
    if (jsonMatch) {
      const translations = JSON.parse(jsonMatch[1]);
      const outputFile = `scripts/legal-batch-${batch}.json`;
      fs.writeFileSync(outputFile, JSON.stringify(translations, null, 2), "utf8");
      console.log(`Written ${Object.keys(translations).length} translations to ${outputFile}`);
      for (const [k, v] of Object.entries(translations)) {
        const preview = (v as string).substring(0, 80);
        console.log(`  ${k}: ${preview}...`);
      }
    } else {
      console.log("Failed to parse JSON from response");
      console.log("Raw response:", text.substring(0, 500));
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
