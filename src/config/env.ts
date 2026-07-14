// src/config/env.ts
import fs from 'fs';
import dotenv from 'dotenv';
import { envSchema, type EnvVars } from './env-schema';

/** Map NODE_ENV to local .env file suffixes */
const toFileSuffix = (env?: string) => {
  switch ((env || '').toLowerCase()) {
    case 'development':
    case 'dev':
      return 'dev';
    case 'production':
    case 'prod':
      return 'prod';
    case 'test':
      return 'test';
    default:
      return 'dev';
  }
};

/** Load .env.<suffix> if present */
const suffix = toFileSuffix(process.env.NODE_ENV);
const envFile = `.env.${suffix}`;

if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
  console.log(
    `- Loaded environment: ${envFile}\n- NODE_ENV: ${
      process.env.NODE_ENV ?? '(unset)'
    }`
  );
} else {
  if (suffix === 'prod') {
    console.log('- Using process.env for production configuration.');
  } else {
    console.warn(`- "${envFile}" not found. Using existing process.env.`);
  }
}

/** Normalize NODE_ENV shorthand */
const rawEnv = (process.env.NODE_ENV || '').toLowerCase();
if (rawEnv === 'dev') process.env.NODE_ENV = 'development';
if (rawEnv === 'prod') process.env.NODE_ENV = 'production';

/** Validate envs */
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const messages = parsed.error.issues.map((i) => {
    const key = i.path.join('.') || '(root)';
    return `- ${key}: ${i.message}`;
  });

  console.error(
    `\n❌ Invalid environment variables:\n${messages.join('\n')}\n`
  );
  process.exit(1); // ⛔ Stop here if envs are bad
}

export const env: EnvVars = parsed.data;

/** Extra variable detection (ignore system noise) */
const definedEnvKeys = Object.keys(process.env as NodeJS.ProcessEnv);
const allowedKeys = Object.keys(envSchema.shape);

const systemVars = new Set([
  'ACLOCAL_PATH',
  'ALLUSERSPROFILE',
  'APPDATA',
  'COLOR',
  'COMMONPROGRAMFILES',
  'CommonProgramFiles(x86)',
  'CommonProgramW6432',
  'COMPUTERNAME',
  'COMSPEC',
  'CONFIG_SITE',
  'DISPLAY',
  'DriverData',
  'EDITOR',
  'EXEPATH',
  'HOME',
  'HOMEDRIVE',
  'HOMEPATH',
  'HOSTNAME',
  'INFOPATH',
  'INIT_CWD',
  'LANG',
  'LOCALAPPDATA',
  'LOGONSERVER',
  'MANPATH',
  'MSYS',
  'MSYSTEM',
  'MSYSTEM_CARCH',
  'MSYSTEM_CHOST',
  'MSYSTEM_PREFIX',
  'NODE',
  'NODE_OPTIONS',
  'NODE_VERSION',
  'NUMBER_OF_PROCESSORS',
  'NVM_HOME',
  'NVM_SYMLINK',
  'OLDPWD',
  'OneDrive',
  'OneDriveConsumer',
  'ORIGINAL_PATH',
  'ORIGINAL_TEMP',
  'ORIGINAL_TMP',
  'OS',
  'PATH',
  'PATHEXT',
  'PKG_CONFIG_PATH',
  'PKG_CONFIG_SYSTEM_INCLUDE_PATH',
  'PKG_CONFIG_SYSTEM_LIBRARY_PATH',
  'PLINK_PROTOCOL',
  'PROCESSOR_ARCHITECTURE',
  'PROCESSOR_IDENTIFIER',
  'PROCESSOR_LEVEL',
  'PROCESSOR_REVISION',
  'ProgramData',
  'PROGRAMFILES',
  'ProgramFiles(x86)',
  'ProgramW6432',
  'PROMPT',
  'PSModulePath',
  'PUBLIC',
  'PWD',
  'SESSIONNAME',
  'SHELL',
  'SHLVL',
  'SSH_ASKPASS',
  'SYSTEMDRIVE',
  'SYSTEMROOT',
  'TEMP',
  'TERM',
  'TMP',
  'TMPDIR',
  'USERDOMAIN',
  'USERDOMAIN_ROAMINGPROFILE',
  'USERNAME',
  'USERPROFILE',
  'WINDIR',
  'WSLENV',
  'YARN_VERSION',
  'ZES_ENABLE_SYSMAN',
  '_',
  // Docker/runtime knobs used by Node or Puppeteer.
  'CHROMIUM_PATH',
  'PUPPETEER_CACHE_DIR',
  'PUPPETEER_EXECUTABLE_PATH',
  'PUPPETEER_SKIP_DOWNLOAD',
]);

const sensitiveNamePattern =
  /(SECRET|TOKEN|PASSWORD|PASS|PRIVATE|CREDENTIAL|ACCESS|KEY|AUTH)/i;

const isNoiseKey = (k: string) =>
  systemVars.has(k) ||
  k.startsWith('npm_') ||
  k.startsWith('MSYSTEM') ||
  k.startsWith('MINGW') ||
  k.startsWith('WT_');

const extraKeys = definedEnvKeys.filter(
  (k) => !allowedKeys.includes(k) && !isNoiseKey(k)
);

if (env.NODE_ENV !== 'production' && extraKeys.length > 0) {
  const visibleExtraKeys = extraKeys.filter(
    (k) => !sensitiveNamePattern.test(k)
  );
  const hiddenCount = extraKeys.length - visibleExtraKeys.length;
  const details = [
    visibleExtraKeys.length
      ? `unused environment variables detected: ${visibleExtraKeys.join(', ')}`
      : null,
    hiddenCount
      ? `${hiddenCount} sensitive-looking extra env var(s) hidden`
      : null,
  ]
    .filter(Boolean)
    .join('; ');

  console.warn(`- Warning: ${details}`);
}