#!/usr/bin/env node

const { spawnSync } = require('node:child_process');
const path = require('node:path');

const packageJsonPath = require.resolve('prettier/package.json');
const prettierPackage = require(packageJsonPath);
const prettierBin =
  typeof prettierPackage.bin === 'string'
    ? prettierPackage.bin
    : prettierPackage.bin?.prettier;

if (!prettierBin) {
  throw new Error('Could not resolve the installed Prettier binary.');
}

const result = spawnSync(
  process.execPath,
  [
    path.resolve(path.dirname(packageJsonPath), prettierBin),
    ...process.argv.slice(2),
  ],
  { stdio: 'inherit' }
);

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
