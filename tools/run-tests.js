'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const dir = path.join(__dirname, '..', 'tests');
const files = fs.readdirSync(dir).filter(name => name.endsWith('-check.js')).sort();
let failures = 0;
for (const file of files) {
  const result = spawnSync(process.execPath, [path.join(dir, file)], { stdio: 'inherit' });
  if (result.status !== 0) {
    failures++;
    process.stderr.write(`FAILED: ${file}\n`);
  }
}
process.stdout.write(`\nTESTS_TOTAL=${files.length} TESTS_FAILED=${failures}\n`);
process.exitCode = failures ? 1 : 0;
