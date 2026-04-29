#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');
const dotenv = require('dotenv');

const backendDir = path.resolve(__dirname, '..');
const repoRoot = path.resolve(backendDir, '..');

dotenv.config({ path: path.join(repoRoot, '.env') });
dotenv.config({ path: path.join(backendDir, '.env'), override: true });

const dbName = process.env.DB_NAME || 'ecommerce';
const dbUser = process.env.DB_USER || 'postgres';
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || '5432';
const dbPassword = process.env.DB_PASS || '';
const cliMethod = process.argv.includes('--docker')
  ? 'docker'
  : process.argv.includes('--local')
    ? 'local'
    : null;
const backupMethod = (cliMethod || process.env.BACKUP_METHOD || 'auto').toLowerCase();
const backupDir = path.resolve(
  process.env.BACKUP_DIR || path.join(repoRoot, 'backups', 'postgres'),
);

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const safeDbName = dbName.replace(/[^a-zA-Z0-9_-]/g, '_');
const outputFile = path.join(backupDir, `${safeDbName}-${timestamp}.dump`);

function commandExists(command, args) {
  const result = spawnSync(command, args, { stdio: 'ignore' });
  return result.status === 0;
}

function resolvePgDumpCommand() {
  if (process.env.PG_DUMP_PATH) {
    return process.env.PG_DUMP_PATH;
  }

  if (commandExists('pg_dump', ['--version'])) {
    return 'pg_dump';
  }

  if (process.platform !== 'win32') {
    return 'pg_dump';
  }

  const roots = [
    path.join(process.env.ProgramFiles || 'C:\\Program Files', 'PostgreSQL'),
    path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'PostgreSQL'),
  ];

  for (const root of roots) {
    if (!fs.existsSync(root)) {
      continue;
    }

    const versions = fs
      .readdirSync(root, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort((a, b) => Number(b) - Number(a));

    for (const version of versions) {
      const candidate = path.join(root, version, 'bin', 'pg_dump.exe');

      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
  }

  return 'pg_dump';
}

const pgDumpCommand = resolvePgDumpCommand();

function getDockerComposeCommand() {
  if (commandExists('docker', ['compose', 'version'])) {
    return { command: 'docker', args: ['compose'] };
  }

  if (commandExists('docker-compose', ['version'])) {
    return { command: 'docker-compose', args: [] };
  }

  return null;
}

function removePartialBackup() {
  if (fs.existsSync(outputFile)) {
    fs.rmSync(outputFile, { force: true });
  }
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    let childClosed = false;
    let outputFinished = false;
    let failed = false;

    const maybeResolve = () => {
      if (!failed && childClosed && outputFinished) {
        resolve();
      }
    };

    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env || process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const output = fs.createWriteStream(outputFile);
    child.stdout.pipe(output);
    child.stderr.pipe(process.stderr);

    output.on('finish', () => {
      outputFinished = true;
      maybeResolve();
    });

    child.on('error', (error) => {
      failed = true;
      output.destroy();
      removePartialBackup();
      reject(error);
    });

    child.on('close', (code) => {
      childClosed = true;

      if (code === 0) {
        maybeResolve();
        return;
      }

      failed = true;
      output.destroy();
      removePartialBackup();
      reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

async function createDockerBackup() {
  const compose = getDockerComposeCommand();

  if (!compose) {
    throw new Error(
      'Docker Compose is not available. Install Docker or run with BACKUP_METHOD=local and pg_dump installed.',
    );
  }

  const args = [
    ...compose.args,
    'exec',
    '-T',
    'db',
    'sh',
    '-c',
    'exec pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -F c --no-owner --no-acl',
  ];

  await runCommand(compose.command, args, { cwd: repoRoot });
}

async function createLocalBackup() {
  if (!commandExists(pgDumpCommand, ['--version'])) {
    throw new Error(
      `pg_dump is not available. Install PostgreSQL client tools or set PG_DUMP_PATH to the full pg_dump.exe path.`,
    );
  }

  const env = { ...process.env };

  if (dbPassword) {
    env.PGPASSWORD = dbPassword;
  }

  await runCommand(
    pgDumpCommand,
    [
      '-h',
      dbHost,
      '-p',
      dbPort,
      '-U',
      dbUser,
      '-d',
      dbName,
      '-F',
      'c',
      '--no-owner',
      '--no-acl',
    ],
    { cwd: backendDir, env },
  );
}

async function main() {
  fs.mkdirSync(backupDir, { recursive: true });

  console.log(`Creating PostgreSQL backup: ${outputFile}`);

  if (backupMethod === 'local') {
    await createLocalBackup();
  } else if (backupMethod === 'docker') {
    await createDockerBackup();
  } else if (commandExists(pgDumpCommand, ['--version'])) {
    await createLocalBackup();
  } else {
    await createDockerBackup();
  }

  console.log(`Backup created: ${outputFile}`);
}

main().catch((error) => {
  removePartialBackup();
  console.error(`Backup failed: ${error.message}`);
  process.exit(1);
});
