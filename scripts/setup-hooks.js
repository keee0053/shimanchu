#!/usr/bin/env node
// Git フック（.githooks/）を有効にする。npm install 時に自動で実行される（package.json の prepare）
// 手動で実行する場合: npm run setup-hooks

const { execFileSync } = require('child_process');

try {
  execFileSync('git', ['rev-parse', '--is-inside-work-tree'], { stdio: 'ignore' });
} catch {
  // git リポジトリの外（npm pack など）では何もしない
  process.exit(0);
}

execFileSync('git', ['config', 'core.hooksPath', '.githooks']);
console.log('✔ Git フックを有効にしました（.githooks/）');
