import * as fs from "fs";

let content = fs.readFileSync("lib/i18n.ts", "utf8");

function escapeForTsString(text: string): string {
  return text
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '')
    .replace(/\t/g, '\\t');
}

function applyToSection(sectionName: string, batchNums: number[]) {
  for (const batchNum of batchNums) {
    const filePath = `scripts/legal-batch-${batchNum}.json`;
    if (!fs.existsSync(filePath)) continue;
    
    const rawJson = fs.readFileSync(filePath, "utf8");
    const translations: Record<string, string> = JSON.parse(rawJson);
    console.log(`Batch ${batchNum} (${sectionName}): ${Object.keys(translations).length} keys`);
    
    for (const [key, rawValue] of Object.entries(translations)) {
      const escaped = escapeForTsString(rawValue);
      
      const hyStartIdx = content.indexOf("const hy: typeof ru = {");
      const hyEndIdx = content.indexOf("\nconst en: typeof ru = {");
      
      const hyPart = content.substring(hyStartIdx, hyEndIdx);
      
      const sectionPattern = sectionName === "privacy" 
        ? `},  ${sectionName}: {`
        : `${sectionName}: {`;
      const sectionIdx = hyPart.indexOf(sectionPattern);
      if (sectionIdx === -1) {
        console.log(`  Section ${sectionName} not found`);
        continue;
      }
      
      const keyStr = `${key}: "`;
      const searchArea = hyPart.substring(sectionIdx);
      const keyIdx = searchArea.indexOf(keyStr);
      if (keyIdx === -1) {
        console.log(`  Key ${key} not found in ${sectionName}`);
        continue;
      }
      
      const absoluteKeyIdx = hyStartIdx + sectionIdx + keyIdx;
      const valueStartIdx = absoluteKeyIdx + keyStr.length;
      
      let valueEndIdx = -1;
      let i = valueStartIdx;
      while (i < content.length) {
        if (content[i] === '\\') { i += 2; continue; }
        if (content[i] === '"') { valueEndIdx = i; break; }
        i++;
      }
      
      if (valueEndIdx === -1) {
        console.log(`  Cannot find end quote for ${key}`);
        continue;
      }
      
      content = content.substring(0, valueStartIdx) + escaped + content.substring(valueEndIdx);
      console.log(`  Applied: ${key} (${escaped.length} chars)`);
    }
  }
}

applyToSection("terms", [1, 2, 3, 4]);
applyToSection("privacy", [5, 6, 7, 8]);

fs.writeFileSync("lib/i18n.ts", content, "utf8");
console.log("\nFile saved.");

const lines = content.split("\n");
let cyrillicCount = 0;
const hyStart = content.indexOf("const hy: typeof ru = {");
const hyEnd = content.indexOf("\nconst en: typeof ru = {");
const hySection = content.substring(hyStart, hyEnd);
const hyLines = hySection.split("\n");
for (const line of hyLines) {
  if (/[а-яА-ЯёЁ]/.test(line)) cyrillicCount++;
}
console.log(`Remaining cyrillic lines in HY: ${cyrillicCount}`);
console.log(`Total file lines: ${lines.length}`);
