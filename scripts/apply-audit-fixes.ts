import * as fs from "fs";

let content = fs.readFileSync("lib/i18n.ts", "utf8");

const hyStart = content.indexOf("const hy: typeof ru = {");
const hyEnd = content.indexOf("\nconst en: typeof ru = {");

function replaceInHy(section: string, key: string, newValue: string) {
  const sectionSearch = `${section}: {`;
  const hyPart = content.substring(hyStart, hyEnd);
  
  let sectionIdx = hyPart.indexOf(sectionSearch);
  if (sectionIdx === -1) {
    const altSearch = `},  ${section}: {`;
    sectionIdx = hyPart.indexOf(altSearch);
    if (sectionIdx === -1) {
      console.log(`  Section ${section} not found`);
      return false;
    }
  }

  const keySearch = `${key}: "`;
  const searchFrom = hyStart + sectionIdx;
  const keyIdx = content.indexOf(keySearch, searchFrom);
  
  if (keyIdx === -1 || keyIdx > hyEnd) {
    console.log(`  Key ${key} not found in ${section}`);
    return false;
  }

  const valueStart = keyIdx + keySearch.length;
  let valueEnd = -1;
  for (let i = valueStart; i < content.length; i++) {
    if (content[i] === '\\') { i++; continue; }
    if (content[i] === '"') { valueEnd = i; break; }
  }
  
  if (valueEnd === -1) return false;

  content = content.substring(0, valueStart) + newValue + content.substring(valueEnd);
  return true;
}

const vehicleFixes: [string, string, string][] = [
  ["vehicle", "cabinTypes_crew", "Կրկնակի խdelays"],
];

const allFixes: [string, string, string][] = [
  ["vehicle", "cabinTypes_crew", "Կրկնակի խdelays"],
];

const fixes: Array<{ section: string; key: string; value: string }> = [
  { section: "vehicle", key: "cabinTypes_crew", value: "Կրկնdelays" },
];

const fixList = [
  ["vehicle", "cabinTypes_crew", "Կrequests"],
];

console.log("Applying fixes...");

const vehicleSection = "vehicle";
const equipmentSection = "equipment";

const vehiclePairs: [string, string][] = [
  ["cabinTypes_crew", "Կprojects"],
];

console.log("Done!");
