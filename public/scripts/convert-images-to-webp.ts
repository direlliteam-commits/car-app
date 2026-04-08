import sharp from "sharp";
import fs from "fs";
import path from "path";

const DIRS = [
  {
    dir: path.resolve("server/public/generation-photos"),
    maxWidth: 800,
    maxHeight: 600,
    quality: 75,
    label: "Generation Photos",
  },
  {
    dir: path.resolve("uploads"),
    maxWidth: 1920,
    maxHeight: 1440,
    quality: 80,
    label: "User Uploads",
  },
  {
    dir: path.resolve("server/public/logos"),
    maxWidth: 200,
    maxHeight: 200,
    quality: 80,
    label: "Logos",
  },
  {
    dir: path.resolve("server/public/body-types"),
    maxWidth: 400,
    maxHeight: 300,
    quality: 80,
    label: "Body Types",
  },
];

async function convertFile(
  filePath: string,
  maxWidth: number,
  maxHeight: number,
  quality: number,
): Promise<{ saved: number; original: number } | null> {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".webp") return null;
  if (![".jpg", ".jpeg", ".png", ".gif"].includes(ext)) return null;

  const webpPath = filePath.replace(/\.[^.]+$/, ".webp");
  if (fs.existsSync(webpPath)) return null;

  const originalSize = fs.statSync(filePath).size;

  try {
    await sharp(filePath)
      .resize(maxWidth, maxHeight, { fit: "inside", withoutEnlargement: true })
      .webp({ quality, effort: 4 })
      .toFile(webpPath);

    const newSize = fs.statSync(webpPath).size;
    fs.unlinkSync(filePath);

    return { saved: originalSize - newSize, original: originalSize };
  } catch (err) {
    console.error(`  Failed: ${path.basename(filePath)} - ${err}`);
    if (fs.existsSync(webpPath)) fs.unlinkSync(webpPath);
    return null;
  }
}

async function processDir(config: (typeof DIRS)[0]) {
  if (!fs.existsSync(config.dir)) {
    console.log(`\nSkipping ${config.label}: directory not found`);
    return;
  }

  const files = fs.readdirSync(config.dir).filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return [".jpg", ".jpeg", ".png", ".gif"].includes(ext);
  });

  console.log(`\n${config.label}: ${files.length} files to convert`);
  if (files.length === 0) return;

  let converted = 0;
  let totalSaved = 0;
  let totalOriginal = 0;
  const batchSize = 20;

  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map((f) =>
        convertFile(
          path.join(config.dir, f),
          config.maxWidth,
          config.maxHeight,
          config.quality,
        ),
      ),
    );

    for (const r of results) {
      if (r) {
        converted++;
        totalSaved += r.saved;
        totalOriginal += r.original;
      }
    }

    if ((i + batchSize) % 200 === 0 || i + batchSize >= files.length) {
      console.log(
        `  Progress: ${Math.min(i + batchSize, files.length)}/${files.length}`,
      );
    }
  }

  const savedMB = (totalSaved / 1024 / 1024).toFixed(1);
  const origMB = (totalOriginal / 1024 / 1024).toFixed(1);
  const pct = totalOriginal > 0 ? ((totalSaved / totalOriginal) * 100).toFixed(1) : "0";
  console.log(
    `  Done: ${converted} converted, saved ${savedMB}MB of ${origMB}MB (${pct}% reduction)`,
  );
}

async function main() {
  console.log("=== Converting all images to WebP ===\n");

  for (const dir of DIRS) {
    await processDir(dir);
  }

  console.log("\n=== Conversion complete ===");
}

main().catch(console.error);
