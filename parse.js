const fs = require("fs");
const filePath = process.argv[2];

if (!filePath) {
  console.error("Provide a path!");
  process.exit(1);
}

const clean = (text) =>
  text
    ? text
        .replace(/<[^>]*>/g, "")
        .replace(/\s+/g, " ")
        .trim()
    : "";

try {
  const html = fs.readFileSync(filePath, "utf8");

  // 1. Metadata
  const title = clean(
    html.match(/<title>BDSM Library - Story: (.*?)<\/title>/i)?.[1],
  );
  const authM = html.match(/author\.php\?authorid=(\d+)[^>]*>(.*?)<\/a>/i);
  const authorId = authM ? authM[1] : "N/A";
  const author = authM ? clean(authM[2]) : "N/A";

  // 2. Ratings
  const rateM = html.match(/\/rategifs\/rate(\d+)\.gif/i);
  const stars20 = rateM ? parseInt(rateM[1]) : 0;
  const stars5 = (stars20 * 0.25).toFixed(1);

  const scoreM = html.match(/\((\d+)\/10,\s*([\d,]+)\s*votes\)/i);
  const score10 = scoreM ? scoreM[1] : "N/A";
  const votes = scoreM ? scoreM[2] : 0;

  // 3. Synopsis & Comments
  const synopsis = clean(html.match(/Synopsis:<\/b>(.*?)<\/font>/is)?.[1]);
  const comments = clean(
    html.match(/Comments:<\/b>(.*?)<\/font>/is)?.[1] || "None",
  );

  // 4. Chapters (Regex Loop)
  // This finds every <tr> that contains a chapter link
  const chapters = [];
  const chapterRowRegex =
    /<tr>\s*<td[^>]*><b><a href="[^"]*chapterid=(\d+)">([^<]*)<\/a><\/b>\s*<\/td>\s*<td[^>]*>\s*-\s*([^<]*)<\/td>\s*<td[^>]*><font[^>]*>\(added on ([^<]*)\)<\/font><\/td>\s*<\/tr>/gi;

  let match;
  while ((match = chapterRowRegex.exec(html)) !== null) {
    chapters.push({
      id: match[1],
      title: clean(match[2]),
      desc: clean(match[3]),
      date: clean(match[4]),
    });
  }

  // --- OUTPUT ---
  console.log(`--- STORY INFO ---`);
  console.log(`Title:    ${title}`);
  console.log(`Author:   ${author} (ID: ${authorId})`);
  console.log(`Rating:   ${stars5}/5 (${stars20}/20)`);
  console.log(`Score:    ${score10}/10 (${votes} votes)`);
  console.log(`Synopsis: ${synopsis}`);
  console.log(`Comments: ${comments}`);

  if (chapters.length > 0) {
    console.log(`\n--- CHAPTERS (${chapters.length}) ---`);
    chapters.forEach((c, i) => {
      console.log(`${i + 1}. [ID: ${c.id}] ${c.title} (${c.desc}) - ${c.date}`);
    });
  }
  console.log(`-------------------`);
} catch (e) {
  console.error("Error reading file:", e.message);
}
