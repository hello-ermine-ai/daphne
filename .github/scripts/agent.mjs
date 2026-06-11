import Anthropic from "@anthropic-ai/sdk";
import { execSync } from "child_process";
import { readFileSync, writeFileSync, mkdirSync, unlinkSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");

const TASK = process.env.TASK;
const ISSUE_NUMBER = process.env.ISSUE_NUMBER;

if (!TASK) { console.error("TASK env var required"); process.exit(1); }

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

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40).replace(/-$/, "");
}

const TOOLS = [
  {
    name: "write_file",
    description: "Write or overwrite a file with new content",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Relative path from project root" },
        content: { type: "string", description: "Complete file content" }
      },
      required: ["path", "content"]
    }
  },
  {
    name: "delete_file",
    description: "Delete a file that is no longer needed",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Relative path from project root" }
      },
      required: ["path"]
    }
  },
  {
    name: "done",
    description: "Signal all changes are complete and provide PR metadata",
    input_schema: {
      type: "object",
      properties: {
        commit_message: { type: "string" },
        pr_title: { type: "string" },
        pr_body: { type: "string" }
      },
      required: ["commit_message", "pr_title", "pr_body"]
    }
  },
  {
    name: "no_changes_needed",
    description: "Signal the task is already implemented — nothing to do",
    input_schema: {
      type: "object",
      properties: {
        reason: { type: "string" }
      },
      required: ["reason"]
    }
  }
];

async function run() {
  console.log(`\n🤖 Agent starting task: ${TASK}\n`);

  const files = collectFiles(CONTEXT_PATHS);
  const context = formatContext(files);

  const client = new Anthropic();
  const messages = [{
    role: "user",
    content: `You are an expert Next.js developer working on "Daphne's Learning App" — a kid-friendly educational site for an elementary school student (ages 6-10).

Stack: Next.js 16 (App Router), TypeScript, Tailwind CSS, Supabase, Anthropic SDK.

Rules:
- Write COMPLETE file contents when using write_file, not partial diffs
- Keep the UI fun and kid-friendly
- Ensure TypeScript compiles
- Do not add new dependencies unless absolutely necessary

Here is the current codebase:

${context}

---

Task: ${TASK}

Use the tools to implement this task. Call write_file for each file you need to create or modify, delete_file for files to remove, then call done when finished.`
  }];

  const changedFiles = [];
  const deletedFiles = [];
  let prMeta = null;

  // Agentic tool-use loop
  while (true) {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 16000,
      tools: TOOLS,
      messages,
    });

    messages.push({ role: "assistant", content: response.content });

    const toolResults = [];
    let shouldStop = false;

    for (const block of response.content) {
      if (block.type !== "tool_use") continue;

      const { name, input, id } = block;

      if (name === "write_file") {
        const full = join(ROOT, input.path);
        mkdirSync(dirname(full), { recursive: true });
        writeFileSync(full, input.content, "utf8");
        changedFiles.push(input.path);
        console.log(`  ✓ write ${input.path}`);
        toolResults.push({ type: "tool_result", tool_use_id: id, content: "Written successfully" });

      } else if (name === "delete_file") {
        const full = join(ROOT, input.path);
        if (existsSync(full)) {
          unlinkSync(full);
          deletedFiles.push(input.path);
          console.log(`  🗑  delete ${input.path}`);
        }
        toolResults.push({ type: "tool_result", tool_use_id: id, content: "Deleted successfully" });

      } else if (name === "done") {
        prMeta = input;
        toolResults.push({ type: "tool_result", tool_use_id: id, content: "Done noted" });
        shouldStop = true;

      } else if (name === "no_changes_needed") {
        console.log(`✅ Agent says task is already complete: ${input.reason}`);
        toolResults.push({ type: "tool_result", tool_use_id: id, content: "Noted" });
        process.exit(0);
      }
    }

    if (toolResults.length > 0) {
      messages.push({ role: "user", content: toolResults });
    }

    if (shouldStop || response.stop_reason === "end_turn") break;
  }

  if (changedFiles.length === 0 && deletedFiles.length === 0) {
    console.log("No files changed — nothing to commit.");
    process.exit(0);
  }

  const commitMsg = prMeta?.commit_message || "agent: apply changes";
  const prTitle = prMeta?.pr_title || commitMsg;
  const prBody = prMeta?.pr_body || "";

  console.log(`\n📝 Commit: ${commitMsg}`);

  // Build check
  console.log("\n🔨 Running build check...");
  try {
    execSync("npm run build", { cwd: ROOT, stdio: "inherit" });
  } catch {
    console.error("\n❌ Build failed — reverting changes");
    execSync("git checkout -- .", { cwd: ROOT });
    process.exit(1);
  }

  // Branch, commit, push, PR, merge
  execSync(`git config user.email "agent@daphne.app"`, { cwd: ROOT });
  execSync(`git config user.name "Daphne Agent"`, { cwd: ROOT });
  execSync("git pull --rebase", { cwd: ROOT, stdio: "inherit" });

  const branch = `agent/${ISSUE_NUMBER}-${slugify(commitMsg)}`;
  execSync(`git checkout -b ${branch}`, { cwd: ROOT });
  execSync("git add -A", { cwd: ROOT });
  execSync(`git commit -m "${commitMsg.replace(/"/g, "'")}"`, { cwd: ROOT });
  execSync(`git push origin ${branch}`, { cwd: ROOT });

  console.log(`\n🔀 Creating PR...`);
  const safeTitle = prTitle.replace(/"/g, "'");
  const safeBody = `${prBody.replace(/"/g, "'")}\n\nCloses #${ISSUE_NUMBER}`;
  const prUrl = execSync(
    `gh pr create --title "${safeTitle}" --body "${safeBody}" --base main --head ${branch}`,
    { cwd: ROOT, encoding: "utf8" }
  ).trim();

  console.log(`📎 PR: ${prUrl}`);
  console.log("🔀 Merging PR...");
  execSync(`gh pr merge ${prUrl} --merge --delete-branch`, { cwd: ROOT, stdio: "inherit" });

  console.log("\n✅ Done! PR merged — Vercel is deploying.");

  const fs = await import("fs");
  fs.appendFileSync(process.env.GITHUB_OUTPUT || "/dev/null", `pr_url=${prUrl}\n`);
}

run().catch(e => { console.error(e); process.exit(1); });
