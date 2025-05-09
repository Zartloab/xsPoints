#!/usr/bin/env node

import { exec } from 'child_process';

// Execute vitest with the appropriate command line arguments
const args = process.argv.slice(2);
const command = ['npx', 'vitest', ...args].join(' ');

console.log(`Running command: ${command}`);

const child = exec(command);

child.stdout.pipe(process.stdout);
child.stderr.pipe(process.stderr);

child.on('exit', (code) => {
  process.exit(code);
});