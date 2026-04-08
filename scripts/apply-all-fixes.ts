import * as fs from "fs";

let content = fs.readFileSync("lib/i18n.ts", "utf8");

function replaceHyValue(fullKey: string, newValue: string): boolean {
  const hyStartIdx = content.indexOf("const hy: typeof ru = {");
  const hyEndIdx = content.indexOf("\nconst en: typeof ru = {");
  
  const parts = fullKey.split(".");
  const section = parts[0];
  const key = parts[1];
  
  const sectionPatterns = [
    `  ${section}: {`,
    `},  ${section}: {`,
    `}, ${section}: {`,
  ];
  
  let sectionFound = -1;
  for (const pattern of sectionPatterns) {
    const idx = content.indexOf(pattern, hyStartIdx);
    if (idx !== -1 && idx < hyEndIdx) {
      sectionFound = idx;
      break;
    }
  }
  
  if (sectionFound === -1) return false;
  
  const keyStr = `${key}: "`;
  const keyIdx = content.indexOf(keyStr, sectionFound);
  if (keyIdx === -1 || keyIdx > hyEndIdx) return false;
  
  const valueStart = keyIdx + keyStr.length;
  let valueEnd = -1;
  for (let i = valueStart; i < content.length; i++) {
    if (content[i] === '\\') { i++; continue; }
    if (content[i] === '"') { valueEnd = i; break; }
  }
  
  if (valueEnd === -1) return false;
  
  content = content.substring(0, valueStart) + newValue + content.substring(valueEnd);
  return true;
}

const vehicleFixes: Record<string, string> = {
  "vehicle.cabinTypes_crew": "\u053F\u0580\u056F\u0576\u0561\u056F\u056B \u056D\u0581\u056B\u056F",
  "vehicle.motoDriveTypes_belt": "\u0553\u0578\u056F",
  "vehicle.bodyTypes_tractor": "\u0554\u0561\u0580\u0577\u0561\u056F",
  "vehicle.bodyTypes_craneTruck": "\u0531\u057E\u057F\u0578\u056F\u057C\u0561\u0576",
  "vehicle.bodyTypes_forklift": "\u054A\u0561\u057F\u0561\u057C\u0561\u0584\u0561\u0572\u0561\u0575\u056B\u0576 \u0562\u0565\u057C\u0576\u056B\u0579",
  "vehicle.bodyTypes_trailerSpecial": "\u0540\u0561\u057F\u0578\u0582\u056F \u056F\u0581\u0578\u0580\u0564",
  "vehicle.driveTypes_front": "\u0531\u057C\u057B\u0587\u056B",
  "vehicle.driveTypes_rear": "\u0540\u0565\u057F\u0587\u056B",
  "vehicle.driveTypes_all": "\u053C\u056B\u0561\u0584\u0561\u0580\u0577\u0561\u056F",
  "vehicle.driveTypes_belt": "\u0553\u0578\u056F",
  "vehicle.characteristics_spaciousRear": "\u0538\u0576\u0564\u0561\u0580\u0571\u0561\u056F \u0570\u0565\u057F\u0587\u056B \u0577\u0561\u0580\u0584",
  "vehicle.characteristics_stylish": "\u0548\u0573\u0561\u0575\u056B\u0576",
};

const equipmentFixes: Record<string, string> = {
  "equipment.specs": "\u0532\u0576\u0578\u0582\u0569\u0561\u0563\u0580\u0565\u0580",
  "equipment.yearLabel": "\u0539\u0578\u0572\u0561\u0580\u056F\u0574\u0561\u0576 \u057F\u0561\u0580\u0565\u0569\u056B\u057E",
  "equipment.gearbox": "\u0553\u0578\u056D\u0561\u0576\u0581\u0578\u0582\u0574\u0561\u057F\u0578\u0582\u0583",
  "equipment.drive": "\u0547\u0561\u0580\u056A\u0561\u0562\u0565\u0580",
  "equipment.engineVolume": "\u0547\u0561\u0580\u056A\u056B\u0579\u056B \u056E\u0561\u057E\u0561\u056C",
  "equipment.steering": "\u0542\u0565\u056F",
  "equipment.emptyEquipment": "\u053F\u0578\u0574\u057A\u056C\u0565\u056F\u057F\u0561\u0581\u056B\u0561\u0575\u056B \u057F\u057E\u0575\u0561\u056C\u0576\u0565\u0580\u0568 \u0576\u0577\u057E\u0561\u056E \u0579\u0565\u0576",
  "motoSpecs.coolingType": "\u0540\u0578\u057E\u0561\u0581\u0578\u0582\u0574",
  "motoSpecs.driveType": "\u0547\u0561\u0580\u056A\u0561\u0562\u0565\u0580\u056B \u057F\u0565\u057D\u0561\u056F",
  "motoSpecs.driveBelt": "\u0553\u0578\u056F",
  "truckSpecs.grossWeight": "\u053C\u0580\u056B\u057E \u0566\u0561\u0576\u0563\u057E\u0561\u056E",
  "truckSpecs.cabinType": "\u053D\u0581\u056B\u056F\u056B \u057F\u0565\u057D\u0561\u056F",
  "truckSpecs.cabinSleeper": "\u0554\u0576\u0561\u057D\u0565\u0576\u0575\u0561\u056F",
  "truckSpecs.bucketVolume": "\u0539\u0561\u0583\u0584\u056B \u056E\u0561\u057E\u0561\u056C",
  "truckSpecs.drumVolume": "\u054F\u0561\u056F\u0561\u057C\u056B \u056E\u0561\u057E\u0561\u056C",
  "truckSpecs.unitHp": "\u0571.\u0578\u0582\u056A",
  "truckSpecs.unitM3": "\u0574\u00B3",
  "specialSpecs.operatingHours": "\u0544\u0578\u057F\u0578\u056A\u0561\u0574\u0565\u0580",
};

console.log("=== Applying vehicle fixes ===");
for (const [key, value] of Object.entries(vehicleFixes)) {
  const ok = replaceHyValue(key, value);
  console.log(`  ${ok ? "OK" : "FAIL"}: ${key}`);
}

console.log("\n=== Applying equipment fixes ===");
for (const [key, value] of Object.entries(equipmentFixes)) {
  const ok = replaceHyValue(key, value);
  console.log(`  ${ok ? "OK" : "FAIL"}: ${key}`);
}

console.log("\n=== Applying legal translations ===");
const termsBatches = [1, 2, 3, 4];
const privacyBatches = [5, 6, 7, 8];

function escapeForTs(text: string): string {
  return text.replace(/\n/g, '\\n').replace(/\r/g, '');
}

function applyLegalBatch(sectionName: string, batchNums: number[]) {
  for (const batchNum of batchNums) {
    const filePath = `scripts/legal-batch-${batchNum}.json`;
    if (!fs.existsSync(filePath)) continue;
    const translations: Record<string, string> = JSON.parse(fs.readFileSync(filePath, "utf8"));
    
    for (const [key, rawValue] of Object.entries(translations)) {
      const escaped = escapeForTs(rawValue);
      
      const hyStartIdx = content.indexOf("const hy: typeof ru = {");
      const hyEndIdx = content.indexOf("\nconst en: typeof ru = {");
      
      const sectionPatterns = [
        `  ${sectionName}: {`,
        `},  ${sectionName}: {`,
      ];
      
      let sectionFound = -1;
      for (const pattern of sectionPatterns) {
        const idx = content.indexOf(pattern, hyStartIdx);
        if (idx !== -1 && idx < hyEndIdx) {
          sectionFound = idx;
          break;
        }
      }
      
      if (sectionFound === -1) {
        console.log(`  Section ${sectionName} not found for ${key}`);
        continue;
      }
      
      const keyStr = `${key}: "`;
      const keyIdx = content.indexOf(keyStr, sectionFound);
      if (keyIdx === -1 || keyIdx > hyEndIdx) {
        console.log(`  Key ${key} not found in ${sectionName}`);
        continue;
      }
      
      const valueStart = keyIdx + keyStr.length;
      let valueEnd = -1;
      for (let i = valueStart; i < content.length; i++) {
        if (content[i] === '\\') { i++; continue; }
        if (content[i] === '"') { valueEnd = i; break; }
      }
      
      if (valueEnd === -1) {
        console.log(`  Cannot find end quote for ${key}`);
        continue;
      }
      
      content = content.substring(0, valueStart) + escaped + content.substring(valueEnd);
      console.log(`  OK: ${sectionName}.${key}`);
    }
  }
}

applyLegalBatch("terms", termsBatches);
applyLegalBatch("privacy", privacyBatches);

fs.writeFileSync("lib/i18n.ts", content, "utf8");

const lines = content.split("\n");
const hyStart = content.indexOf("const hy: typeof ru = {");
const hyEnd = content.indexOf("\nconst en: typeof ru = {");
const hySection = content.substring(hyStart, hyEnd);
let cyrillicCount = 0;
for (const line of hySection.split("\n")) {
  if (/[а-яА-ЯёЁ]/.test(line)) cyrillicCount++;
}

console.log(`\nFile saved. Lines: ${lines.length}`);
console.log(`Remaining cyrillic in HY: ${cyrillicCount}`);
