// Shared helpers for turning Question documents into portable export formats
// (JSON / Markdown / PDF). Used by both the "export all/filtered questions"
// and "export a collection" endpoints.

const EXPORT_FIELDS = [
  '_id',
  'title',
  'description',
  'company',
  'experienceLevel',
  'round',
  'difficulty',
  'topic',
  'subtopic',
  'tags',
  'favorite',
  'solved',
  'personalRating',
  'codeExamples',
  'explanation',
  'resources',
  'notes',
  'theoryAnswer',
  'createdAt',
];

// Plain-object projection used for JSON export and as the source data for
// the other two formats.
export function toExportObject(question) {
  const obj = question.toObject ? question.toObject() : question;
  const picked = {};
  for (const field of EXPORT_FIELDS) picked[field] = obj[field];
  return picked;
}

export function buildJSONExport(questions, meta = {}) {
  return {
    exportedAt: new Date().toISOString(),
    source: 'InterviewVault',
    ...meta,
    count: questions.length,
    questions: questions.map(toExportObject),
  };
}

function line(label, value) {
  if (value === undefined || value === null || value === '') return '';
  return `**${label}:** ${value}\n\n`;
}

function resourceSection(title, links = []) {
  if (!links?.length) return '';
  const items = links
    .filter((l) => l?.url)
    .map((l) => `- [${l.label || l.url}](${l.url})`)
    .join('\n');
  return items ? `**${title}**\n\n${items}\n\n` : '';
}

// Renders one question as a Markdown section. Shared by the Markdown export
// and (indirectly, via plain text extraction) the PDF export.
export function questionToMarkdown(q) {
  const parts = [];
  parts.push(`## ${q.title}\n\n`);
  parts.push(line('Company', q.company));
  parts.push(line('Topic', q.topic));
  parts.push(line('Subtopic', q.subtopic));
  parts.push(line('Difficulty', q.difficulty));
  parts.push(line('Experience level', q.experienceLevel));
  parts.push(line('Round', q.round));
  parts.push(line('Status', q.solved ? 'Solved' : 'Pending'));
  if (q.tags?.length) parts.push(line('Tags', q.tags.join(', ')));

  if (q.description) parts.push(`### Description\n\n${q.description}\n\n`);

  if (q.codeExamples?.length) {
    parts.push(`### Code\n\n`);
    for (const ex of q.codeExamples) {
      if (!ex?.code) continue;
      parts.push(`\`\`\`${ex.language}\n${ex.code}\n\`\`\`\n\n`);
    }
  }

  const exp = q.explanation || {};
  const hasExplanation = Object.values(exp).some(Boolean);
  if (hasExplanation) {
    parts.push(`### Explanation\n\n`);
    if (exp.detailed) parts.push(`${exp.detailed}\n\n`);
    parts.push(line('Time complexity', exp.timeComplexity));
    parts.push(line('Space complexity', exp.spaceComplexity));
    if (exp.edgeCases) parts.push(`**Edge cases:** ${exp.edgeCases}\n\n`);
    if (exp.commonMistakes) parts.push(`**Common mistakes:** ${exp.commonMistakes}\n\n`);
    if (exp.interviewTips) parts.push(`**Interview tips:** ${exp.interviewTips}\n\n`);
    if (exp.alternativeSolutions) parts.push(`**Alternative solutions:** ${exp.alternativeSolutions}\n\n`);
  }

  const res = q.resources || {};
  const resourceMd = [
    resourceSection('YouTube', res.youtube),
    resourceSection('Blog posts', res.blog),
    resourceSection('Docs', res.docs),
    resourceSection('PDFs', res.pdf),
  ].join('');
  if (resourceMd) parts.push(`### Resources\n\n${resourceMd}`);

  if (q.theoryAnswer) parts.push(`### Theory Answer\n\n${q.theoryAnswer}\n\n`);

  if (q.notes) parts.push(`### Notes\n\n${q.notes}\n\n`);

  parts.push('---\n\n');
  return parts.join('');
}

export function buildMarkdownExport(questions, { title = 'InterviewVault Export' } = {}) {
  const header = `# ${title}\n\nExported ${new Date().toLocaleString()} · ${questions.length} question(s)\n\n---\n\n`;
  return header + questions.map((q) => questionToMarkdown(toExportObject(q))).join('');
}