const fs = require("fs");
const fixes = JSON.parse(fs.readFileSync("scripts/translation-fixes.json", "utf8"));

const optFixes = {};
const dictFixes = {};
for (const [k, v] of Object.entries(fixes)) {
  if (k.startsWith("opt.")) {
    optFixes[k.replace("opt.", "")] = v;
  } else {
    dictFixes[k] = v;
  }
}
console.log("Dict fixes:", Object.keys(dictFixes).length);
console.log("Opt fixes:", Object.keys(optFixes).length);

let content = fs.readFileSync("lib/i18n.ts", "utf8");
const lines = content.split("\n");

const hyStart = 2956 - 1;
const hyEnd = 5878;
let applied = 0;
let notFound = 0;
const notFoundKeys = [];

for (const [dotKey, newValue] of Object.entries(dictFixes)) {
  const parts = dotKey.split(".");
  const lastKey = parts[parts.length - 1];
  const parentKey = parts.length > 1 ? parts[parts.length - 2] : null;

  let found = false;
  for (let i = hyStart; i < hyEnd && i < lines.length; i++) {
    const line = lines[i];
    const keyRegex = new RegExp("^(\\s+" + lastKey + ":\\s*)\"");
    if (!keyRegex.test(line)) continue;

    if (parentKey) {
      let foundParent = false;
      for (let j = i - 1; j >= Math.max(hyStart, i - 80); j--) {
        if (new RegExp("^\\s+" + parentKey + ":\\s*\\{").test(lines[j])) {
          foundParent = true;
          break;
        }
      }
      if (!foundParent) continue;
    }

    const oldMatch = line.match(/^(\s+\w+:\s*)"((?:[^"\\]|\\.)*)"(,?\s*)$/);
    if (oldMatch) {
      lines[i] = oldMatch[1] + JSON.stringify(newValue) + oldMatch[3];
      applied++;
      found = true;
      break;
    }
  }
  if (!found) {
    notFound++;
    notFoundKeys.push(dotKey);
  }
}

console.log("Applied to dict:", applied);
console.log("Not found:", notFound);
if (notFoundKeys.length > 0) {
  console.log("Not found keys:", notFoundKeys.slice(0, 30).join(", "));
}

let optApplied = 0;
const optStartIdx = lines.findIndex(l => l.includes("const optionTranslations"));
if (optStartIdx >= 0) {
  let hyOptLine = -1;
  for (let i = optStartIdx; i < lines.length; i++) {
    if (/^\s+hy:\s*\{/.test(lines[i])) { hyOptLine = i; break; }
  }
  if (hyOptLine >= 0) {
    let hyOptEnd = -1;
    let depth = 0;
    for (let i = hyOptLine; i < lines.length; i++) {
      for (const ch of lines[i]) {
        if (ch === "{") depth++;
        if (ch === "}") depth--;
      }
      if (depth === 0) { hyOptEnd = i; break; }
    }
    if (hyOptEnd >= 0) {
      for (const [key, value] of Object.entries(optFixes)) {
        const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        for (let j = hyOptLine; j <= hyOptEnd; j++) {
          if (new RegExp('"' + escapedKey + '":\\s*"').test(lines[j])) {
            const m = lines[j].match(/^(.+":\s*)"[^"]*"(,?\s*)$/);
            if (m) {
              lines[j] = m[1] + JSON.stringify(value) + m[2];
              optApplied++;
            }
            break;
          }
        }
      }
    }
  }
}

console.log("Applied to opt:", optApplied);
console.log("Total applied:", applied + optApplied, "of", Object.keys(fixes).length);

fs.writeFileSync("lib/i18n.ts", lines.join("\n"));
console.log("File written.");
