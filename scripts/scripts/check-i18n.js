const fs = require("fs");
const content = fs.readFileSync("lib/i18n.ts", "utf8");
const lines = content.split("\n");
let errors = 0;

for (let i = 2955; i < 5878; i++) {
  const line = lines[i];
  if (line.includes('\\\\"') || line.includes("\\\\n")) {
    errors++;
    console.log("Line", i + 1, "double-encoded:", line.trim().substring(0, 80));
  }
}

for (let i = 2955; i < 5878; i++) {
  const line = lines[i];
  const m = line.match(/:\s*"((?:[^"\\]|\\.)*)"/);
  if (m) {
    try {
      JSON.parse('"' + m[1] + '"');
    } catch (e) {
      errors++;
      console.log("Line", i + 1, "bad string:", line.trim().substring(0, 80));
    }
  }
}

console.log("Total issues:", errors);
