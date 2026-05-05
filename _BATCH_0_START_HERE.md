# 🚀 BATCH 0 — Start Here: Repo Audit & Migration Blueprint

> **This is the FIRST prompt to run in a new Claude session.**  
> Copy the block below and paste it into Claude. Attach `tech-plan-and-ai-prompt.md` to the session.

---

## Instructions

1. Open a **new Claude session** (claude.ai or API)
2. Attach the file `tech-plan-and-ai-prompt.md` from this repo
3. Copy and paste the prompt below
4. Do NOT generate any code — this is analysis only
5. After Claude responds, commit `REBUILD_ROADMAP.md` and other Batch 1 outputs

---

## ▶ CLAUDE PROMPT — Copy everything below this line

```
Inspect the current repo files relevant to this step and summarize what already exists.
Check specifically: auth files, API route handlers, existing env variables, prisma schema if present,
and any CI/CD config. Reuse existing code where possible.

Analyze GitHub repo Dhanushmcmsd/Dashboard plus the attached technical plan.
Do NOT generate any code in this step — this is an analysis-only task.

Provide a migration strategy tailored to this exact repo. Identify:

1. CURRENT STACK & APP STRUCTURE
- Framework, router type (pages/ vs app/), TypeScript usage, styling approach
- Auth implementation (NextAuth version, provider, session strategy)
- Database (Prisma schema summary, existing models and relations)
- Existing API surface (route handlers, server actions)
- CI/CD and deployment target

2. DEPENDENCY MAP
- Which files import which — flag any tightly coupled modules
- Shared state patterns (context, Zustand, Redux, etc.)

3. REUSE / REPLACE / REMOVE DECISIONS (with confidence rating: High / Medium / Low)
- For each major folder/module: decision + one-line rationale

4. GAPS VERSUS TECHNICAL PLAN
- List every capability the plan requires that the current repo does not have

5. RECOMMENDED TARGET STRUCTURE (inside the existing repo, no greenfield)
- Exact folder layout

6. PHASED MIGRATION PLAN — 8 to 12 steps
- Each step: name, goal, input files, output files, estimated session size

7. RISK LIST
- Risk, likelihood (H/M/L), mitigation

8. EXACT RECOMMENDED BRANCH NAME

Output format: numbered sections as above. No prose padding. Stop after section 8.
```

---

## After Batch 0 is done

Move to **Batch 1** — paste the Batch 1 prompt from `SupraPacific_Claude_Prompt_Pack.docx`  
or copy from the Batch 1 section in `CLAUDE_SESSION_LOADER.md`.
