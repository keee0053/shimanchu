#!/usr/bin/env node
// 指定した範囲のコミットメッセージをまとめて検査する（CI から使う）
// 使い方: node scripts/git-hooks/check-commits.js <base> <head>
//   例: node scripts/git-hooks/check-commits.js origin/develop HEAD

const { execFileSync } = require('child_process');

const { checkCommitMessage } = require('./commit-rules');

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8' });
}

// base..head の各コミットを検査し、違反があったコミット数を返す
function checkRange(range) {
  const shas = git(['rev-list', '--reverse', ...range])
    .split('\n')
    .filter(Boolean);
  let failed = 0;
  for (const sha of shas) {
    const message = git(['log', '-1', '--format=%B', sha]);
    const errors = checkCommitMessage(message);
    if (errors.length > 0) {
      failed += 1;
      console.error(`✖ ${sha.slice(0, 7)} ${message.split('\n')[0]}`);
      for (const error of errors) console.error(`    - ${error}`);
    }
  }
  return { total: shas.length, failed };
}

module.exports = { checkRange };

if (require.main === module) {
  const [base, head = 'HEAD'] = process.argv.slice(2);
  if (!base) {
    console.error('使い方: node scripts/git-hooks/check-commits.js <base> <head>');
    process.exit(1);
  }
  const { total, failed } = checkRange([head, '--not', base]);
  if (failed > 0) {
    console.error(
      `\n${total} 件中 ${failed} 件のコミットメッセージがルールに沿っていません（CONTRIBUTING.md 参照）`,
    );
    process.exit(1);
  }
  console.log(`✔ ${total} 件のコミットメッセージを確認しました`);
}
