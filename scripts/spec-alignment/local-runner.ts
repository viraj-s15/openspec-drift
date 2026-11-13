// Runs spec-alignment's own pipeline (diff, discovery, prompt, verdict mapping) with pi as the model.
// This file is copied into a pinned spec-alignment checkout at run time, so its imports resolve there.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { glob } from 'fast-glob';
import { z } from 'zod';
import { runAction } from './core/runAction.js';
import { parseSourceDocumentsInput } from './domain/conventions.js';
import { gitAdapter } from './adapters/git.js';
import { createFilesystemAdapter } from './adapters/fs.js';
import type { Adapters, Config, EvaluationResult, LlmJudgeAdapter } from './core/types.js';

const PI_MODEL = process.env.PI_MODEL ?? 'openai/gpt-6.1-terra:high';

// Mirrors VerdictSchema and FilterSelectionSchema in adapters/llm.ts, which are not exported.
const VerdictSchema = z.object({
  verdict: z.enum(['pass', 'pass_with_drift', 'fail']),
  summary: z.string(),
  findings: z.array(
    z.object({
      file: z.string().nullable(),
      line: z.number().int().nullable(),
      message: z.string(),
      severity: z.enum(['notice', 'warning', 'failure']),
    })
  ),
  specSelfModified: z.boolean(),
});
const FilterSelectionSchema = z.object({ selectedSourceDocumentPaths: z.array(z.string()) });

// The hosted adapter gets this shape from structured output, so pi needs it spelled out.
const VERDICT_FORMAT = `Reply with one JSON object and nothing else:
{"verdict": "pass" | "pass_with_drift" | "fail", "summary": string,
 "findings": [{"file": string | null, "line": integer | null, "message": string, "severity": "notice" | "warning" | "failure"}],
 "specSelfModified": boolean}`;
const FILTER_FORMAT = `Reply with one JSON object and nothing else: {"selectedSourceDocumentPaths": [string]}`;

function askPi(prompt: string): unknown {
  const dir = mkdtempSync(join(tmpdir(), 'spec-alignment-pi-'));
  const promptFile = join(dir, 'prompt.md');
  writeFileSync(promptFile, prompt);
  const reply = execFileSync(
    'pi-bolt',
    ['-p', '--model', PI_MODEL, '--no-tools', '--no-context-files', '--no-mcp', '--no-skills', '--no-session',
      `@${promptFile}`, 'Follow the instructions in the attached file.'],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'], maxBuffer: 16 * 1024 * 1024 }
  );
  const json = reply.slice(reply.indexOf('{'), reply.lastIndexOf('}') + 1);
  return JSON.parse(json);
}

const piJudge: LlmJudgeAdapter = {
  async judge(request) {
    const result = VerdictSchema.parse(askPi(`${request.prompt}\n\n${VERDICT_FORMAT}`));
    return {
      ...result,
      findings: result.findings.map((f) => ({
        message: f.message,
        severity: f.severity,
        ...(f.file === null ? {} : { file: f.file }),
        ...(f.line === null ? {} : { line: f.line }),
      })),
    };
  },
  async filterRelevance(request) {
    return FilterSelectionSchema.parse(askPi(`${request.prompt}\n\n${FILTER_FORMAT}`));
  },
};

let published: EvaluationResult | undefined;
const filesystem = createFilesystemAdapter(process.cwd());
const adapters: Adapters = {
  getDiff: (exclude) => gitAdapter.getDiff(exclude),
  readSourceDocument: (pattern, convention) => filesystem.readSourceDocument(pattern, convention),
  llmJudge: piJudge,
  githubClient: {
    async upsertCheckRun(result) { published = result; },
    async upsertPrComment() {},
    async postInlineReviewComments() {},
    async approvePr() {},
  },
};

// Same defaults as the action's inputs at v0.1.1.
const config: Config = {
  provider: 'openai',
  apiKey: 'unused-with-pi',
  sourceDocuments: parseSourceDocumentsInput(process.env.SOURCE_DOCUMENTS ?? 'openspec'),
  strictness: (process.env.STRICTNESS as Config['strictness']) ?? 'balanced',
  immutableSpec: false,
  commentOnPr: false,
  inlineReviewComments: false,
  excludePaths: ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'dist/**', 'build/**', '.next/**', 'node_modules/**', 'coverage/**'],
  bypassLabel: 'spec-check:skip',
  failClosedOnError: false,
  autoApprove: false,
  isDraft: false,
  prLabels: [],
  fileTree: await glob('**/*', { cwd: process.cwd(), dot: false, onlyFiles: true, ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**'] }),
};

const result = await runAction(adapters, config);
process.stdout.write(JSON.stringify({ model: PI_MODEL, ...(published ?? result) }, null, 2) + '\n');
