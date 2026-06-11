import Anthropic from "@anthropic-ai/sdk";
import { execSync } from "child_process";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");

const TASK = process.env.TASK;
const ISSUE_NUMBER = process.env.ISSUE_NUMBER;

if (!TASK) { console.error("TASK env var required"); process.exit(1); }

// Files to include as context (skip generated/deps)
const CONTEXT_PATHS = [
  "src/app",
  "src/components",
  "src/lib",
  "supabase/schema.sql",
  "package.json",
];

function collectFiles(paths) {
  const files = {};
  for (const p of paths) {
    try {
      const full = join(ROOT, p);
      const stat = execSync(`find "${full}" -type f 2>/dev/null`, { encoding: "utf8" }).trim();
      if (!stat) {
        files[p] = readFileSync(full, "utf8");
        continue;
      }
      for (const file of stat.split("\n")) {
        const rel = file.replace(ROOT + "/", "");
        if (!rel.match(/\.(js\.map|d\.ts|tsbuildinfo)$/)) {
          files[rel] = readFileSync(file, "utf8");
        }
      }
    } catch {}
  }
  return files;
}

function formatContext(files) {
  return Object.entries(files)
    .map(([path, content]) => `### ${path}\n\`\`\`\n${content}\n\`\`\``)
    .join("\n\n");
}

async function run() {
  console.log(`\n🤖 Agent starting task: ${TASK}\n`);

  const files = collectFiles(CONTEXT_PATHS);
  const context = formatContext(files);

  const client = new Anthropic();
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8096,
    system: `You are an expert Next.js developer working on "Daphne's Learning App" — a kid-friendly educational site for an elementary school student.

Stack: Next.js 16 (App Router), TypeScript, Tailwind CSS, Supabase, Anthropic SDK.

When given a task, respond ONLY with a JSON object in this exact format:
{
  "commit_message": "short description of change",
  "changes": [
    { "path": "relative/path/to/file.tsx", "content": "full file content" }
  ]
}

Rules:
- Return COMPLETE file contents, not diffs or partials
- Only include files that need to change
- Keep the UI fun and kid-friendly
- Make sure TypeScript compiles
- Do not add new dependencies unless absolutely necessary`,

    messages: [{
      role: "user",
      content: `Here is the current codebase:\n\n${context}\n\n---\n\nTask: ${TASK}\n\nImplement this task and return the JSON with all changed files.`
    }]
  });

  const raw = response.content[0].type === "text" ? response.content[0].text : "";

  let result;
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    result = JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error("Failed to parse Claude response:", raw);
    process.exit(1);
  }

  console.log(`📝 Commit: ${result.commit_message}`);
  console.log(`📁 Files changed: ${result.changes.map(c => c.path).join(", ")}`);

  // Apply file changes
  for (const { path, content } of result.changes) {
    const full = join(ROOT, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content, "utf8");
    console.log(`  ✓ ${path}`);
  }

  // Build check
  console.log("\n🔨 Running build check...");
  try {
    execSync("npm run build", { cwd: ROOT, stdio: "inherit" });
  } catch {
    console.error("\n❌ Build failed — reverting changes");
    execSync("git checkout -- .", { cwd: ROOT });
    process.exit(1);
  }

  // Commit and push
  execSync(`git config user.email "agent@daphne.app"`, { cwd: ROOT });
  execSync(`git config user.name "Daphne Agent"`, { cwd: ROOT });
  execSync("git add -A", { cwd: ROOT });
  execSync(`git commit -m "${result.commit_message.replace(/"/g, "'")}"`, { cwd: ROOT });
  execSync("git push", { cwd: ROOT });

  console.log("\n✅ Done! Pushed to main — Vercel is deploying.");
  const fs = await import("fs");
  fs.appendFileSync(process.env.GITHUB_OUTPUT || "/dev/null", `commit_message=${result.commit_message}\n`);
}

run().catch(e => { console.error(e); process.exit(1); });
