#!/usr/bin/env node
// 使い方:
//   node scripts/git-hooks/check-commit-message.js <コミットメッセージのファイル>   … commit-msg フックから
//   node scripts/git-hooks/check-commit-message.js --title "<PR タイトル>"          … CI から

const fs = require('fs');

const { checkCommitMessage, checkTitle, findAiMarkers } = require('./commit-rules');

function main(args) {
  if (args[0] === '--title') {
    const title = args[1] ?? '';
    const errors = [...checkTitle(title)];
    const markers = findAiMarkers(title);
    if (markers.length > 0) errors.push(`AI ツール表記を含めない（${markers.join(', ')}）`);
    return report(`PR タイトル「${title}」`, errors);
  }

  const file = args[0];
  if (!file) {
    console.error('コミットメッセージのファイルを指定してください');
    return 1;
  }
  const message = fs.readFileSync(file, 'utf8');
  return report(`コミットメッセージ「${message.split(/\r?\n/)[0]}」`, checkCommitMessage(message));
}

function report(target, errors) {
  if (errors.length === 0) return 0;
  console.error(`\n✖ ${target} がルールに沿っていません:`);
  for (const error of errors) console.error(`  - ${error}`);
  console.error('\n  例: add: 位置情報が取れないときにアバターが海を漂流する処理を実装');
  console.error('  詳しくは CONTRIBUTING.md の「コミットメッセージ」を参照\n');
  return 1;
}

process.exit(main(process.argv.slice(2)));
