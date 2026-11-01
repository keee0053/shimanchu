// コミットメッセージ・PR タイトル・ブランチ名のルール（CONTRIBUTING.md と対応）
// commit-msg / pre-push フックと CI（GitHub Actions）の両方から使う

const TYPES = ['add', 'fix', 'refactor', 'test', 'chore', 'perf', 'docs'];

// "type: 説明" 形式
const TITLE_PATTERN = new RegExp(`^(${TYPES.join('|')}): \\S`);

// 日本語（ひらがな・カタカナ・漢字）を含むか
const JAPANESE_PATTERN = /[぀-ヿ㐀-鿿]/;

// AI ツール表記（コード・コミット・PR に含めない）
const AI_MARKERS = [
  { pattern: /co-authored-by\s*:/i, label: 'Co-Authored-By' },
  { pattern: /made[\s-]with\s*:?\s*cursor/i, label: 'Made with Cursor' },
  {
    pattern: /generated\s+(with|by)\s+\[?\s*(claude|cursor|copilot|chatgpt)/i,
    label: 'Generated with ...',
  },
  { pattern: /noreply@anthropic\.com/i, label: 'noreply@anthropic.com' },
  { pattern: /^claude-session\s*:/im, label: 'Claude-Session' },
  { pattern: /🤖/u, label: '🤖' },
];

// ルールの対象外にするメッセージ（git が自動で作るもの）
const AUTO_GENERATED_PREFIXES = ['Merge ', 'Revert "', 'fixup! ', 'squash! ', 'amend! '];

// feature/PascalCase
const BRANCH_PATTERN = /^feature\/[A-Z][A-Za-z0-9]*$/;
const PROTECTED_BRANCHES = ['main', 'develop'];

function findAiMarkers(text) {
  return AI_MARKERS.filter(({ pattern }) => pattern.test(text)).map(({ label }) => label);
}

// "type: 説明" の1行（コミットの1行目・PR タイトル）を検査する
function checkTitle(title) {
  const errors = [];
  if (!TITLE_PATTERN.test(title)) {
    errors.push(`「type: 説明」の形式にする（type は ${TYPES.join(' / ')}）`);
  }
  if (!JAPANESE_PATTERN.test(title)) {
    errors.push('説明は日本語で書く');
  }
  return errors;
}

// コミットメッセージ全体を検査する。違反内容の配列を返す（空なら OK）
function checkCommitMessage(rawMessage) {
  // git commit -v の差分表示以降と、# で始まるコメント行を除く
  const message = rawMessage
    .split(/^# -+ >8 -+$/m)[0]
    .split(/\r?\n/)
    .filter((line) => !line.startsWith('#'))
    .join('\n')
    .trim();

  const errors = [];
  const markers = findAiMarkers(message);
  if (markers.length > 0) {
    errors.push(`AI ツール表記を含めない（${markers.join(', ')}）`);
  }

  if (AUTO_GENERATED_PREFIXES.some((prefix) => message.startsWith(prefix))) {
    return errors;
  }

  const lines = message.split('\n').filter((line) => line.trim() !== '');
  if (lines.length === 0) {
    return ['コミットメッセージが空'];
  }
  if (lines.length > 1) {
    errors.push('1行で書く（本文は書かない）');
  }
  errors.push(...checkTitle(lines[0]));
  return errors;
}

// push 先のブランチ名を検査する
function checkBranchName(branch) {
  if (PROTECTED_BRANCHES.includes(branch)) {
    return [`${branch} には直接 push しない（feature ブランチから PR を作る）`];
  }
  if (!BRANCH_PATTERN.test(branch)) {
    return ['ブランチ名は feature/PascalCase にする（例: feature/AvatarDrift）'];
  }
  return [];
}

module.exports = {
  TYPES,
  checkTitle,
  checkCommitMessage,
  checkBranchName,
  findAiMarkers,
};
