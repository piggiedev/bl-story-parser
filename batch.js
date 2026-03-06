const fs = require("fs");
const path = require("path");

// Get directory from command line: bun batch.js /path/to/stories
const inputDir = process.argv[2];

if (!inputDir) {
  console.error("❌ Error: Please provide the story directory path.");
  console.log("Usage: bun batch.js /Users/adi/stories/");
  process.exit(1);
}

// Generate Timestamp for filename: YYYY-MM-DD_HH-mm
const now = new Date();
const timestamp = now
  .toISOString()
  .replace(/T/, "_")
  .replace(/:/g, "-")
  .slice(0, 16);
const outputFile = `library_${timestamp}.json`;

const clean = (text) =>
  text
    ? text
        .replace(/<[^>]*>/g, "")
        .replace(/\s+/g, " ")
        .trim()
    : "";

console.log(`🚀 Scanning: ${inputDir}`);
console.log(`📂 Output: ${outputFile}`);

const files = fs.readdirSync(inputDir).filter((f) => f.endsWith(".html"));
const library = [];

files.forEach((file, index) => {
  try {
    const html = fs.readFileSync(path.join(inputDir, file), "utf8");
    const storyId = file.replace(".html", "");

    // 1. Basic Metadata
    const title = clean(
      html.match(/<title>BDSM Library - Story: (.*?)<\/title>/i)?.[1],
    );
    const authM = html.match(/author\.php\?authorid=(\d+)[^>]*>(.*?)<\/a>/i);
    const author = authM ? clean(authM[2]) : "Unknown";
    const authorId = authM ? authM[1] : null;

    // 2. Ratings (Converted to numbers for easy filtering)
    const rateM = html.match(/\/rategifs\/rate(\d+)\.gif/i);
    const stars = rateM
      ? parseFloat((parseInt(rateM[1]) * 0.25).toFixed(1))
      : 0;

    const scoreM = html.match(/\((\d+)\/10,\s*([\d,]+)\s*votes\)/i);
    const score = scoreM ? parseInt(scoreM[1]) : 0;
    const votes = scoreM ? parseInt(scoreM[2].replace(/,/g, "")) : 0;

    // 3. Codes/Tags (Extracted into an Array)
    const codes = [];
    const codeRegex = /searchcode=[^>]*>([^<]+)<\/a>/gi;
    let cMatch;
    while ((cMatch = codeRegex.exec(html)) !== null) {
      codes.push(cMatch[1].trim());
    }

    // 4. Synopsis & Comments
    const synopsis = clean(
      html.match(/Synopsis:<\/b>(.*?)<\/font>/is)?.[1] || "",
    );
    const comments = clean(
      html.match(/Comments:<\/b>(.*?)<\/font>/is)?.[1] || "",
    );

    // 5. Chapter Count (Based on unique chapter IDs)
    const chapters = new Set();
    const chapRegex = /chapterid=(\d+)/g;
    let chapMatch;
    while ((chapMatch = chapRegex.exec(html)) !== null) {
      chapters.add(chapMatch[1]);
    }

    library.push({
      id: storyId,
      title,
      author,
      authorId,
      rating: stars,
      score,
      votes,
      codes,
      synopsis,
      comments,
      chapters: chapters.size,
    });

    if (index % 500 === 0 && index > 0) {
      console.log(`⏳ Processed ${index} stories...`);
    }
  } catch (e) {
    console.error(`❌ Error in ${file}:`, e.message);
  }
});

// Save to disk
fs.writeFileSync(outputFile, JSON.stringify(library, null, 2));

console.log("\n--- BATCH COMPLETE ---");
console.log(`✅ Total Stories: ${library.length}`);
console.log(`📦 File Saved: ${outputFile}`);
console.log(`⚡ Speed: ${((Date.now() - now.getTime()) / 1000).toFixed(2)}s`);
