// Reads docs/results/<branch>/ for each scenario and prints one verdict line per tool, as a Markdown table.
// Usage: node scripts/summarize-results.mjs [branch ...]
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const branches = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['clean-change', 'bypass', 'changed-more-than-planned', 'silent-mismatch', 'refactor', 'several-changes-at-once'];

// OpenLore prints a heap-size line before its JSON, so parse from the first brace.
function readJson(path) {
  if (!existsSync(path)) return undefined;
  const text = readFileSync(path, 'utf8');
  return JSON.parse(text.slice(text.indexOf('{')));
}

function specgov(path) {
  const report = readJson(path);
  if (!report) return 'not run';
  const findings = (report.findings ?? []).map((f) => `${f.code}${f.domain ? ` (${f.domain})` : ''}`);
  return `${report.status}${findings.length ? `: ${findings.join(', ')}` : ''}`;
}

const tools = {
  'OpenSpec validate': (dir) => {
    const text = readFileSync(join(dir, 'openspec-validate.txt'), 'utf8');
    return text.match(/Totals: .*/)?.[0] ?? 'no totals';
  },
  'OpenSpec verify': (dir) => {
    const text = readFileSync(join(dir, 'openspec-verify.md'), 'utf8');
    if (text.includes('No active change')) return 'nothing to check';
    const critical = [...text.matchAll(/\*\*CRITICAL:?\*\*:?\s*(.*)/g)].map((m) => m[1].trim());
    return critical.length ? `CRITICAL: ${critical.join(' / ')}` : 'see report';
  },
  'SpecGov as shipped': (dir) => specgov(join(dir, 'specgov.json')),
  'SpecGov, files passed': (dir) => specgov(join(dir, 'specgov-files.json')),
  OpenLore: (dir) => {
    const report = readJson(join(dir, 'openlore.json'));
    const issues = report.issues.map((i) => `${i.severity} ${i.kind} ${i.filePath}${i.specPath ? ` → ${i.specPath.replace('openspec/specs/', '').replace('/spec.md', '')}` : ''}`);
    return issues.length ? issues.join(', ') : 'no issues';
  },
  'spec-alignment': (dir) => {
    const result = readJson(join(dir, 'spec-alignment.json'));
    return `${result.verdict}${result.findings.length ? `: ${result.findings.map((f) => `${f.severity} ${f.file ?? ''}`.trim()).join(', ')}` : ''}`;
  },
};

console.log(`| Branch | ${Object.keys(tools).join(' | ')} |`);
console.log(`| --- |${' --- |'.repeat(Object.keys(tools).length)}`);
for (const branch of branches) {
  const dir = join('docs/results', branch);
  if (!existsSync(dir)) continue;
  const cells = Object.values(tools).map((read) => {
    try { return read(dir).replaceAll('|', '/'); } catch (error) { return `error: ${error.message.slice(0, 60)}`; }
  });
  console.log(`| \`${branch}\` | ${cells.join(' | ')} |`);
}
