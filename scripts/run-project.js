const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const projectName = process.argv[2];

if (!projectName) {
  console.error('Usage: node scripts/run-project.js <project-name>');
  process.exit(1);
}

const runLabel = projectName.replace(/[^a-zA-Z0-9-_]/g, '_');
const workspaceRoot = process.cwd();
const reportDir = path.join(workspaceRoot, 'playwright-report', runLabel);
const resultsDir = path.join(workspaceRoot, 'test-results', runLabel);
const logsDir = path.join(workspaceRoot, 'logs');
const logFilePath = path.join(logsDir, `${runLabel}.log`);

fs.rmSync(reportDir, { recursive: true, force: true });
fs.rmSync(resultsDir, { recursive: true, force: true });
fs.mkdirSync(logsDir, { recursive: true });
fs.writeFileSync(logFilePath, '');

const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const child = spawn(npxCommand, ['playwright', 'test', `--project=${projectName}`], {
  cwd: workspaceRoot,
  env: {
    ...process.env,
    PW_RUN_LABEL: runLabel,
  },
  stdio: ['inherit', 'pipe', 'pipe'],
});

child.stdout.on('data', (data) => {
  process.stdout.write(data);
  fs.appendFileSync(logFilePath, data);
});

child.stderr.on('data', (data) => {
  process.stderr.write(data);
  fs.appendFileSync(logFilePath, data);
});

child.on('close', (code) => {
  process.exit(code ?? 1);
});
