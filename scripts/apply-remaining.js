const fs = require("fs");
const fixes = JSON.parse(fs.readFileSync("scripts/translation-fixes.json", "utf8"));

const remaining = {
  "vehicle.characteristics_prestigious": fixes["vehicle.characteristics_prestigious"],
  "vehicle.characteristics_oversizedCargo": fixes["vehicle.characteristics_oversizedCargo"],
  "vehicle.characteristics_offroad": fixes["vehicle.characteristics_offroad"],
  "vehicle.characteristics_liquid": fixes["vehicle.characteristics_liquid"],
  "carDetail.authRequiredTitle": fixes["carDetail.authRequiredTitle"],
  "carDetail.reportListing": fixes["carDetail.reportListing"],
  "carDetail.ownersLabel": fixes["carDetail.ownersLabel"],
  "carDetail.installmentLabel": fixes["carDetail.installmentLabel"],
  "carDetail.pcsUnit": fixes["carDetail.pcsUnit"],
  "carDetail.coolingLabel": fixes["carDetail.coolingLabel"],
  "carDetail.cylindersLabel": fixes["carDetail.cylindersLabel"],
  "carDetail.priceAlertTitle": fixes["carDetail.priceAlertTitle"],
  "carDetail.priceAlertSubtitle": fixes["carDetail.priceAlertSubtitle"],
  "carDetail.currentPriceLabel": fixes["carDetail.currentPriceLabel"],
  "carDetail.targetPrice": fixes["carDetail.targetPrice"],
  "filters.specialPill": fixes["filters.specialPill"],
  "filters.payloadLabel": fixes["filters.payloadLabel"],
  "filters.fuelTankLabel": fixes["filters.fuelTankLabel"],
};

let content = fs.readFileSync("lib/i18n.ts", "utf8");
const lines = content.split("\n");

const hyStart = 2956 - 1;
const hyEnd = 5878;
let applied = 0;

for (const [dotKey, newValue] of Object.entries(remaining)) {
  if (!newValue) { console.log("SKIP (no value):", dotKey); continue; }
  const parts = dotKey.split(".");
  const section = parts[0];
  const key = parts.slice(1).join(".");

  let inSection = false;
  let sectionDepth = 0;
  let found = false;

  for (let i = hyStart; i < hyEnd && i < lines.length; i++) {
    const line = lines[i];

    if (!inSection) {
      if (new RegExp("^  " + section + ":\\s*\\{").test(line)) {
        inSection = true;
        sectionDepth = 1;
      }
      continue;
    }

    for (const ch of line) {
      if (ch === "{") sectionDepth++;
      if (ch === "}") sectionDepth--;
    }
    if (sectionDepth <= 0) { inSection = false; continue; }

    const keyRegex = new RegExp("^(\\s+" + key + ":\\s*)\"");
    if (keyRegex.test(line)) {
      const oldMatch = line.match(/^(\s+\w+:\s*)"((?:[^"\\]|\\.)*)"(,?\s*)$/);
      if (oldMatch) {
        lines[i] = oldMatch[1] + JSON.stringify(newValue) + oldMatch[3];
        applied++;
        found = true;
        console.log("Applied:", dotKey, "at line", i + 1);
        break;
      }
    }
  }
  if (!found) {
    console.log("NOT FOUND:", dotKey);
  }
}

console.log("Applied:", applied, "of", Object.keys(remaining).length);
fs.writeFileSync("lib/i18n.ts", lines.join("\n"));
