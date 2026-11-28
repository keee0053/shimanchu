// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');
const jest = require('eslint-plugin-jest');

// ---------------------------------------------------------------------------
// クリーンアーキテクチャの依存ルール（docs/ARCHITECTURE.md・docs/CODING_GUIDELINES.md）
//   presentation（src/app・src/presentation）→ application → domain ← infrastructure
//   すべてをつなぐのは src/container.ts だけ
// ---------------------------------------------------------------------------

// 層への import を禁止するパターン（@/ のエイリアスと相対パスの両方）
const layer = (name) => [`@/${name}`, `@/${name}/**`, `**/${name}`, `**/${name}/**`];

const forbid = (name, message) => ({ group: layer(name), message });
const forbidContainer = {
  group: ['@/container', '**/container'],
  message: 'container は presentation（画面）からだけ使う',
};

// domain / application では使わない外部ライブラリ（フレームワーク・外部サービスに依存させない）
const frameworkPackages = {
  group: [
    'react',
    'react-*',
    'react-native',
    'react-native-*',
    'expo',
    'expo-*',
    '@expo/*',
    '@react-native-async-storage/*',
    '@supabase/*',
    '@tanstack/*',
    'zustand',
    'zustand/*',
  ],
  message:
    'domain / application は React・Expo・Supabase などに依存させない（純粋な TypeScript で書く）',
};

// テーブルテストを促すためのルール（普通の it / test を警告する）
// it.each(...)(...) は呼び出し元が it ではなく it.each(...) の戻り値なので対象にならない
const tablePlugin = {
  rules: {
    'prefer-table': {
      meta: {
        type: 'suggestion',
        messages: {
          preferTable:
            'テストはなるべく it.each / test.each のテーブルで書く（入力と期待する値の組を並べる）',
        },
      },
      create: (context) => ({
        CallExpression(node) {
          if (node.callee.type === 'Identifier' && ['it', 'test'].includes(node.callee.name)) {
            context.report({ node: node.callee, messageId: 'preferTable' });
          }
        },
      }),
    },
  },
};

module.exports = defineConfig([
  expoConfig,
  eslintPluginPrettierRecommended,
  {
    ignores: ['dist/*', '.expo/*', 'supabase/*', 'src/infrastructure/supabase/database.types.ts'],
  },
  {
    name: 'layers/domain',
    files: ['src/domain/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            forbid('application', 'domain は他の層に依存しない'),
            forbid('infrastructure', 'domain は他の層に依存しない'),
            forbid('presentation', 'domain は他の層に依存しない'),
            forbid('app', 'domain は他の層に依存しない'),
            forbidContainer,
            frameworkPackages,
          ],
        },
      ],
    },
  },
  {
    name: 'layers/application',
    files: ['src/application/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            forbid(
              'infrastructure',
              'application は domain のインターフェース（repositories）経由でデータを扱う',
            ),
            forbid('presentation', 'application は presentation に依存しない'),
            forbid('app', 'application は presentation に依存しない'),
            forbidContainer,
            frameworkPackages,
          ],
        },
      ],
    },
  },
  {
    name: 'layers/infrastructure',
    files: ['src/infrastructure/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            forbid('application', 'infrastructure は domain のインターフェースを実装するだけ'),
            forbid('presentation', 'infrastructure は presentation に依存しない'),
            forbid('app', 'infrastructure は presentation に依存しない'),
            forbidContainer,
          ],
        },
      ],
    },
  },
  {
    name: 'layers/presentation',
    files: ['src/presentation/**/*.{ts,tsx}', 'src/app/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            forbid(
              'infrastructure',
              'presentation から infrastructure を直接使わない（application のユースケースか @/container 経由で使う）',
            ),
            {
              group: ['@supabase/*', 'expo-location', 'expo-task-manager'],
              message: 'Supabase・位置情報は infrastructure に実装し、@/container 経由で使う',
            },
          ],
        },
      ],
    },
  },
  // -------------------------------------------------------------------------
  // テスト（docs/CODING_GUIDELINES.md の「8. テスト」）
  //   入力と期待する値の組は it.each / test.each のテーブルで書く
  // -------------------------------------------------------------------------
  {
    name: 'tests',
    files: ['src/**/__tests__/**/*.{ts,tsx}'],
    ...jest.configs['flat/recommended'],
    plugins: { ...jest.configs['flat/recommended'].plugins, table: tablePlugin },
    rules: {
      ...jest.configs['flat/recommended'].rules,
      // for 文でテストを量産しない（it.each / test.each を使う）
      'jest/prefer-each': 'error',
      // forEach / map でテストを量産しない（jest/prefer-each は for 文しか見ないため補う）
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'CallExpression[callee.property.name=/^(forEach|map)$/] CallExpression[callee.name=/^(it|test|describe)$/]',
          message: 'forEach / map でテストを量産しない（it.each / test.each を使う）',
        },
      ],
      // 普通の it / test は警告にとどめる（1ケースだけのテストなど、テーブルにしにくいときは使ってよい）
      'table/prefer-table': 'warn',
    },
  },
]);
