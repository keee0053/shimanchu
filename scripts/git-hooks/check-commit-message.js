#!/usr/bin/env node
// 使い方:
//   node scripts/git-hooks/check-commit-message.js <コミットメッセージのファイル>   … commit-msg フックから
//   node scripts/git-hooks/check-commit-message.js --title "<PR タイトル>"          … CI から

const fs = require('fs');

const {
  checkCommitMessage,
  checkTitle,
  findAiMarkers,
  isSafeToQuote,
  suggestCommitMessage,
  suggestTitle,
} = require('./commit-rules');

const EXAMPLE = 'add: 位置情報が取れないときにアバターが海を漂流する処理を実装';

function main(args) {
  if (args[0] === '--title') {
    const title = args[1] ?? '';
    const errors = [...checkTitle(title)];
    const markers = findAiMarkers(title);
    if (markers.length > 0) errors.push(`AI ツール表記を含めない（${markers.join(', ')}）`);
    if (errors.length === 0) return 0;
    report(`PR タイトル「${title}」`, errors);
    printTitleHint(suggestTitle(title));
    return 1;
  }

  const file = args[0];
  if (!file) {
    console.error('コミットメッセージのファイルを指定してください');
    return 1;
  }
  const message = fs.readFileSync(file, 'utf8');
  const errors = checkCommitMessage(message);
  if (errors.length === 0) return 0;
  report(`コミットメッセージ「${message.split(/\r?\n/)[0]}」`, errors);
  printCommitHint(suggestCommitMessage(message));
  return 1;
}

function report(target, errors) {
  console.error(`\n✖ ${target} がルールに沿っていません:`);
  for (const error of errors) console.error(`  - ${error}`);
}

function printCommitHint(suggestion) {
  console.error('\n  直し方: コミットは作られていません。変更はステージされたままなので、');
  console.error('  メッセージを直してもう一度コミットする');
  if (suggestion && isSafeToQuote(suggestion)) {
    console.error(`    git commit -m "${suggestion}"`);
    console.error('  （上のメッセージは自動で直した候補です。内容が合っているか確認してください）');
  } else if (suggestion) {
    console.error('    git commit -m "add: 日本語の説明"');
    console.error(`  候補: ${suggestion}`);
    console.error(
      '  （記号を含むため、候補はコマンドに入れていません。確認して書き直してください）',
    );
  } else {
    console.error('    git commit -m "add: 日本語の説明"');
    console.error(`  例: ${EXAMPLE}`);
  }
  console.error('  git commit --amend の途中だった場合は git commit --amend -m "..." で直す');
  console.error('  詳しくは CONTRIBUTING.md の「コミットメッセージ」を参照\n');
}

function printTitleHint(suggestion) {
  console.error('\n  直し方: GitHub の PR 画面でタイトルの横の「Edit」からタイトルを直す');
  console.error('  （直すと CI が自動で再実行される）');
  if (suggestion) {
    console.error(`  候補: ${suggestion}`);
  } else {
    console.error(`  例: ${EXAMPLE}`);
  }
  console.error('  詳しくは CONTRIBUTING.md の「プルリクエスト」を参照\n');
}

process.exit(main(process.argv.slice(2)));
