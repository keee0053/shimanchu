#!/usr/bin/env node
// pre-push フック本体
// 1. push 先のブランチ名（feature/PascalCase、main / develop への直接 push 禁止）
// 2. push するコミットのメッセージ
// 3. 型チェック・Lint・整形チェック（CI と同じ）
// 作業途中の push で 3 だけを飛ばす場合は、環境変数 SKIP_QUALITY_CHECKS=1 を付けて push する（1・2 は常に行う）
// git push --no-verify はフック全体を飛ばすので使わない（CONTRIBUTING.md 参照）

const { spawnSync } = require('child_process');
const fs = require('fs');

const { checkBranchName } = require('./commit-rules');
const { checkRange, printRewordHint } = require('./check-commits');

const ZERO_SHA = /^0+$/;
// git は第1引数にリモート名を渡す。リモート名ではなく URL を指定して push した場合は URL が渡る
const remoteName = process.argv[2] ?? 'origin';
const isUrl = /[:/]/.test(remoteName);
// 直し方の表示に使うリモート名（URL を指定された場合は origin とみなす）
const remoteLabel = isUrl ? 'origin' : remoteName;
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

for (const { localRef, localSha, remoteRef, remoteSha } of updates) {
  if (!remoteRef.startsWith('refs/heads/')) continue; // タグなどは対象外
  const branch = remoteRef.replace('refs/heads/', '');

  const branchErrors = checkBranchName(branch);
  if (branchErrors.length > 0) {
    ok = false;
    console.error(`\n✖ ブランチ「${branch}」:`);
    for (const error of branchErrors) console.error(`  - ${error}`);
    printBranchHint(branch, localRef.replace('refs/heads/', ''));
  }

  // まだリモートにないコミットだけを検査する
  const range = ZERO_SHA.test(remoteSha)
    ? [localSha, '--not', remoteRefs]
    : [localSha, '--not', remoteSha];
  const { failed, failures } = checkRange(range);
  if (failed > 0) {
    ok = false;
    console.error(`\n✖ ルールに沿っていないコミットメッセージが ${failed} 件あります`);
    printRewordHint(failures, { pushed: false });
  }
}

if (!ok) {
  console.error(
    '\npush を中止しました。ブランチ名・コミットメッセージを直してから push してください\n',
  );
  process.exit(1);
}

if (process.env.SKIP_QUALITY_CHECKS === '1') {
  console.log(
    '\n⚠ SKIP_QUALITY_CHECKS=1 のため、型チェック・Lint・整形チェックを飛ばしました（PR を出す前には通すこと。CI では実行される）\n',
  );
  process.exit(0);
}

const checks = [
  {
    name: '型チェック',
    command: 'npx tsc --noEmit',
    hints: [
      '上に表示された「ファイル名(行,列): error TSxxxx」の箇所を直す',
      '直したら npx tsc --noEmit で通ることを確認する',
    ],
  },
  {
    name: 'Lint',
    command: 'npm run lint',
    hints: [
      'npm run lint -- --fix で自動で直せるものは直る',
      '残ったものは、上に表示された箇所をルール名（行末）を参考に手で直す',
    ],
  },
  {
    name: '整形チェック',
    command: 'npm run format:check',
    hints: ['npm run format で整形する（上に表示されたファイルが書き換わる）'],
  },
];

for (const { name, command, hints } of checks) {
  console.log(`\n▶ ${name}（${command}）`);
  // Windows でも npx / npm を見つけられるよう shell 経由で実行する
  const result = spawnSync(command, { stdio: 'inherit', shell: true });
  if (result.status !== 0) {
    console.error(`\n✖ ${name}に失敗したため push を中止しました`);
    console.error('\n  直し方:');
    for (const hint of hints) console.error(`    - ${hint}`);
    console.error('    - 直した変更をコミットして、もう一度 git push する');
    console.error(
      '\n  作業途中の push に限り SKIP_QUALITY_CHECKS=1 git push で飛ばせます（CONTRIBUTING.md 参照）\n',
    );
    process.exit(1);
  }
}

console.log('\n✔ すべてのチェックを通過しました\n');

// ブランチ名の直し方を表示する
function printBranchHint(branch, localBranch) {
  console.error('\n  直し方:');
  if (branch === 'main' || branch === 'develop') {
    console.error('    今のコミットを feature ブランチに移して push し、PR を作る');
    console.error('      git switch -c feature/作業内容  （例: feature/AvatarDrift）');
    console.error(`      git push -u ${remoteLabel} feature/作業内容`);
    console.error(
      `    ローカルの ${branch} は、必要なら次で元に戻す（コミットは feature ブランチに残る）`,
    );
    console.error(`      git branch -f ${branch} ${remoteLabel}/${branch}`);
  } else {
    console.error('    ブランチ名を変えてから push する');
    console.error(
      `      git branch -m ${localBranch} feature/作業内容  （例: feature/AvatarDrift）`,
    );
    console.error(`      git push -u ${remoteLabel} feature/作業内容`);
  }
}
