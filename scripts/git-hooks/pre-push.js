#!/usr/bin/env node
// pre-push フック本体
// 1. push 先のブランチ名（feature/PascalCase、main / develop への直接 push 禁止）
// 2. push するコミットのメッセージ
// 3. 型チェック・Lint・整形チェック（CI と同じ）
// 作業途中の push で型チェック・Lint・整形だけを飛ばす場合は git push --no-verify（CONTRIBUTING.md 参照）

const { spawnSync } = require('child_process');
const fs = require('fs');

const { checkBranchName } = require('./commit-rules');
const { checkRange } = require('./check-commits');

const ZERO_SHA = /^0+$/;
// git は第1引数にリモート名を渡す。リモート名ではなく URL を指定して push した場合は URL が渡る
const remoteName = process.argv[2] ?? 'origin';
const isUrl = /[:/]/.test(remoteName);
// まだリモートにないコミットを判定する基準（URL の場合はすべてのリモートの追跡ブランチを使う）
const remoteRefs = isUrl ? '--remotes' : `--remotes=${remoteName}`;

// git は push する ref を「<local ref> <local sha> <remote ref> <remote sha>」の形で標準入力に渡す
const updates = fs
  .readFileSync(0, 'utf8')
  .split('\n')
  .filter(Boolean)
  .map((line) => {
    const [localRef, localSha, remoteRef, remoteSha] = line.split(' ');
    return { localRef, localSha, remoteRef, remoteSha };
  })
  .filter(({ localSha }) => !ZERO_SHA.test(localSha)); // ブランチの削除は対象外

let ok = true;

for (const { localSha, remoteRef, remoteSha } of updates) {
  if (!remoteRef.startsWith('refs/heads/')) continue; // タグなどは対象外
  const branch = remoteRef.replace('refs/heads/', '');

  const branchErrors = checkBranchName(branch);
  if (branchErrors.length > 0) {
    ok = false;
    console.error(`\n✖ ブランチ「${branch}」:`);
    for (const error of branchErrors) console.error(`  - ${error}`);
  }

  // まだリモートにないコミットだけを検査する
  const range = ZERO_SHA.test(remoteSha)
    ? [localSha, '--not', remoteRefs]
    : [localSha, '--not', remoteSha];
  const { failed } = checkRange(range);
  if (failed > 0) {
    ok = false;
    console.error(`\n✖ ルールに沿っていないコミットメッセージが ${failed} 件あります`);
    console.error('  直し方: git rebase -i で該当コミットを reword する（CONTRIBUTING.md 参照）');
  }
}

if (!ok) {
  console.error(
    '\npush を中止しました。ブランチ名・コミットメッセージを直してから push してください\n',
  );
  process.exit(1);
}

const checks = [
  { name: '型チェック', command: 'npx tsc --noEmit' },
  { name: 'Lint', command: 'npm run lint' },
  { name: '整形チェック', command: 'npm run format:check' },
];

for (const { name, command } of checks) {
  console.log(`\n▶ ${name}（${command}）`);
  // Windows でも npx / npm を見つけられるよう shell 経由で実行する
  const result = spawnSync(command, { stdio: 'inherit', shell: true });
  if (result.status !== 0) {
    console.error(
      `\n✖ ${name}に失敗したため push を中止しました（作業途中の push に限り git push --no-verify で飛ばせます。CONTRIBUTING.md 参照）\n`,
    );
    process.exit(1);
  }
}

console.log('\n✔ すべてのチェックを通過しました\n');
