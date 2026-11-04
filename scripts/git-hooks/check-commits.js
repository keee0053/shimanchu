#!/usr/bin/env node
// 指定した範囲のコミットメッセージをまとめて検査する（CI から使う）
// 使い方: node scripts/git-hooks/check-commits.js <base> <head>
//   例: node scripts/git-hooks/check-commits.js origin/develop HEAD

const { execFileSync } = require('child_process');

const {
  checkCommitMessage,
  isProtectedBranch,
  isSafeBareWord,
  isSafeToQuote,
  suggestCommitMessage,
} = require('./commit-rules');

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8' });
}

function tryGit(args) {
  try {
    return git(args).trim();
  } catch {
    return null;
  }
}

// 範囲内の各コミットを検査し、違反があったコミットの一覧を返す（古い順）
function checkRange(range) {
  const shas = git(['rev-list', '--reverse', ...range])
    .split('\n')
    .filter(Boolean);
  const failures = [];
  for (const sha of shas) {
    const message = git(['log', '-1', '--format=%B', sha]);
    const errors = checkCommitMessage(message);
    if (errors.length > 0) {
      failures.push({ sha, suggestion: suggestCommitMessage(message) });
      console.error(`✖ ${sha.slice(0, 7)} ${message.split('\n')[0]}`);
      for (const error of errors) console.error(`    - ${error}`);
    }
  }
  return { total: shas.length, failed: failures.length, failures };
}

// ルールに沿っていないコミットの直し方を表示する
// tipSha: 検査したコミットの先端（push しようとしたコミット / PR の先頭のコミット）
// pushed: すでにリモートにあるコミットか（CI から呼ぶとき）。書き換えた後に強制 push が必要になる
//         CI では HEAD が PR のマージコミットになるため、利用者の手元では先端のコミットにいるとみなす
// branch: push しようとしたローカルのブランチ（pre-push から呼ぶとき）。今いるブランチと違えば切り替えを案内する
// pushedTo: CI で push されたブランチ（main / develop に直接入ったコミットを検査するとき）
function printRewordHint(failures, { tipSha, pushed, branch = null, pushedTo = null }) {
  if (pushedTo && isProtectedBranch(pushedTo)) {
    printProtectedBranchHint(pushedTo);
    return;
  }
  const oldest = failures[0].sha;
  const short = (sha) => sha.slice(0, 7);
  const onTip = pushed || tryGit(['rev-parse', 'HEAD']) === tipSha;
  const isTipOnly = failures.length === 1 && oldest === tipSha;
  const rebaseBase = tryGit(['rev-parse', '--verify', '--quiet', `${oldest}^`])
    ? `${short(oldest)}^`
    : '--root';

  console.error('\n  直し方:');
  if (!onTip) {
    console.error('    まず push しようとしたブランチに切り替える');
    console.error(
      branch && isSafeBareWord(branch)
        ? `      git switch ${branch}`
        : '      git switch <push しようとしたブランチ>',
    );
  }
  if (isTipOnly) {
    const { suggestion } = failures[0];
    const example = suggestion && isSafeToQuote(suggestion) ? suggestion : 'add: 日本語の説明';
    console.error('    直すのは最新のコミットだけなので、メッセージを上書きする');
    console.error(`      git commit --amend -m "${example}"`);
  } else {
    console.error('    git rebase -i でコミットのメッセージを書き換える');
    console.error(`      git rebase -i ${rebaseBase}`);
    console.error(
      `    1. 開いたエディタで、${failures.map(({ sha }) => short(sha)).join(' / ')} の行の先頭の pick を reword（または r）に変えて保存して閉じる`,
    );
    console.error(
      '    2. 続けてコミットごとにエディタが開くので、メッセージを直して保存して閉じる',
    );
  }

  const suggestions = failures.filter(({ suggestion }) => suggestion);
  if (suggestions.length > 0) {
    console.error('\n  直したメッセージの候補:');
    for (const { sha, suggestion } of suggestions) {
      console.error(`    ${short(sha)} → ${suggestion}`);
    }
  }

  if (pushed) {
    console.error(
      '\n  書き換えたら git push --force-with-lease で push し直す（自分の feature ブランチに限る）',
    );
  } else {
    console.error('\n  まだ push していないコミットなので、書き換えても他の人には影響しない');
    console.error('  直したら、もう一度 git push する');
  }
  console.error('  詳しくは CONTRIBUTING.md の「Git フックと CI による自動チェック」を参照');
}

// main / develop に入ってしまったコミットの扱いを表示する
// 共有のブランチなので、履歴の書き換え（rebase・amend・force push）は案内しない
function printProtectedBranchHint(branch) {
  console.error(`\n  ${branch} はみんなで使うブランチなので、入ってしまったコミットは書き換えない`);
  console.error('  （force push すると、他の人の手元の履歴と食い違って作業が壊れるため）');
  console.error('\n  次から同じことが起きないように、原因を確認する:');
  console.error(
    '    - PR を「Squash and merge」でマージしていないか（「Create a merge commit」を使う）',
  );
  console.error(
    '    - git push --no-verify でフックを飛ばしていないか、フックが有効か（npm run setup-hooks）',
  );
  console.error(
    '  詳しくは CONTRIBUTING.md の「プルリクエスト」「Git フックと CI による自動チェック」を参照',
  );
}

module.exports = { checkRange, printRewordHint };

if (require.main === module) {
  const [base, head = 'HEAD'] = process.argv.slice(2);
  if (!base) {
    console.error('使い方: node scripts/git-hooks/check-commits.js <base> <head>');
    process.exit(1);
  }
  const { total, failed, failures } = checkRange([head, '--not', base]);
  if (failed > 0) {
    console.error(
      `\n${total} 件中 ${failed} 件のコミットメッセージがルールに沿っていません（CONTRIBUTING.md 参照）`,
    );
    printRewordHint(failures, {
      tipSha: tryGit(['rev-parse', head]),
      pushed: true,
      // GitHub Actions の push イベント（main / develop に直接入ったコミットの検査）では push 先のブランチが入る
      pushedTo: process.env.GITHUB_EVENT_NAME === 'push' ? process.env.GITHUB_REF_NAME : null,
    });
    process.exit(1);
  }
  console.log(`✔ ${total} 件のコミットメッセージを確認しました`);
}
