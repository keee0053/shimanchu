#!/usr/bin/env node
// PR のブランチ名を検査する（CI から使う）
// 使い方: node scripts/git-hooks/check-branch-name.js <head ブランチ> <base ブランチ>
//   develop → main のリリース用 PR は対象外

const { checkBranchName } = require('./commit-rules');

const [head, base] = process.argv.slice(2);
if (!head) {
  console.error(
    '使い方: node scripts/git-hooks/check-branch-name.js <head ブランチ> <base ブランチ>',
  );
  process.exit(1);
}

if (head === 'develop' && base === 'main') {
  console.log('✔ develop → main のリリース用 PR のため、ブランチ名の検査は対象外です');
  process.exit(0);
}

const errors = checkBranchName(head);
if (errors.length > 0) {
  console.error(`\n✖ ブランチ「${head}」:`);
  for (const error of errors) console.error(`  - ${error}`);
  console.error(
    '\n  直し方: PR のブランチ名は後から変えられないため、ブランチ名を変えて PR を作り直す',
  );
  console.error(`    git branch -m ${head} feature/作業内容  （例: feature/AvatarDrift）`);
  console.error('    git push -u origin feature/作業内容');
  console.error('    → 新しいブランチで PR を作り、今の PR は閉じる');
  console.error('\n  ブランチ名のルールは CONTRIBUTING.md の「feature ブランチ」を参照\n');
  process.exit(1);
}
console.log(`✔ ブランチ名「${head}」はルールに沿っています`);
