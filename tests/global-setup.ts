import { chromium, type FullConfig } from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'node:fs/promises';
import path from 'node:path';
import { logInfo, logWarn, logError } from './utils/logger';

dotenv.config();

type UserCreds = {
  key: 'user1' | 'user2';
  email?: string;
  password?: string;
};

type StorageStateCookie = {
  name: string;
  expires: number;
};

type StorageStateShape = {
  cookies?: StorageStateCookie[];
};

const AUTH_DIR = path.join(process.cwd(), 'playwright', '.auth');
const AUTH_MIN_VALID_SECONDS = Number(process.env.AUTH_MIN_VALID_SECONDS ?? 7200);
const FORCE_REFRESH_AUTH = process.env.FORCE_REFRESH_AUTH === 'true';
const AUTH_VALIDATE_STATE = process.env.AUTH_VALIDATE_STATE !== 'false';

async function ensureAuthDir(): Promise<void> {
  await fs.mkdir(AUTH_DIR, { recursive: true });
}

async function writeEmptyState(statePath: string): Promise<void> {
  await fs.writeFile(statePath, JSON.stringify({ cookies: [], origins: [] }, null, 2), 'utf-8');
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function isSessionExpired(statePath: string): Promise<boolean> {
  const exists = await fileExists(statePath);
  if (!exists) return true;

  try {
    const raw = await fs.readFile(statePath, 'utf-8');
    const parsed = JSON.parse(raw) as StorageStateShape;
    const cookies = parsed.cookies ?? [];

    // LinkedIn auth cookie, if missing => treat as expired
    const liAt = cookies.find((c) => c.name === 'li_at');
    if (!liAt) return true;

    // session cookie style (rare here), assume valid if present
    if (liAt.expires === -1) return false;

    const nowInSeconds = Date.now() / 1000;
    return liAt.expires <= nowInSeconds + AUTH_MIN_VALID_SECONDS;
  } catch (error) {
    logWarn(`Cannot parse storage state ${statePath}. Will refresh login.`);
    return true;
  }
}

async function isStateStillAuthenticated(statePath: string): Promise<boolean> {
  const exists = await fileExists(statePath);
  if (!exists) return false;

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ storageState: statePath });
  const page = await context.newPage();

  try {
    await page.goto('https://www.linkedin.com/jobs', { waitUntil: 'domcontentloaded', timeout: 60000 });

    const currentUrl = page.url();
    if (/\/login|checkpoint|challenge/.test(currentUrl)) {
      return false;
    }

    const signInVisible = await page.getByRole('link', { name: 'Sign in' }).first().isVisible({ timeout: 3000 }).catch(() => false);

    return !signInVisible;
  } catch (error) {
    logWarn(`Failed to validate auth state at ${statePath}. Will refresh login.`);
    return false;
  } finally {
    await context.close();
    await browser.close();
  }
}

async function loginAndSaveState(user: UserCreds): Promise<void> {
  const statePath = path.join(AUTH_DIR, `${user.key}.json`);

  if (!FORCE_REFRESH_AUTH) {
    const expired = await isSessionExpired(statePath);
    if (!expired) {
      if (!AUTH_VALIDATE_STATE) {
        logInfo(`Using existing valid state for ${user.key} at ${statePath}. Skipping login.`);
        return;
      }

      const stillAuthenticated = await isStateStillAuthenticated(statePath);
      if (stillAuthenticated) {
        logInfo(`Using existing authenticated state for ${user.key} at ${statePath}. Skipping login.`);
        return;
      }

      logWarn(`State for ${user.key} looks unexpired but is no longer authenticated. Re-login required.`);
    }
    logWarn(`State for ${user.key} is missing or expired. Re-login required.`);
  } else {
    logWarn(`FORCE_REFRESH_AUTH=true, always refreshing state for ${user.key}.`);
  }

  if (!user.email || !user.password) {
    logWarn(`Skipping login for ${user.key}. Missing credentials.`);
    await writeEmptyState(statePath);
    return;
  }

  const browser = await chromium.launch({ channel: 'chrome', headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    logInfo(`Logging in ${user.key} and capturing session state.`);
    await page.goto('https://www.linkedin.com/login', { waitUntil: 'domcontentloaded', timeout: 80000 });

    await page.locator('input[type="email"]:visible').fill(user.email);
    await page.locator('input[type="password"]:visible').fill(user.password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();

    await page.waitForURL(/linkedin\.com\/(feed|checkpoint|jobs|in\/)?.*/, { timeout: 60000 });

    const checkpointDetected = /checkpoint|challenge/.test(page.url());
    if (checkpointDetected) {
      logWarn(`${user.key} hit a security checkpoint/challenge. Empty storage state will be used.`);
      await writeEmptyState(statePath);
    } else {
      await context.storageState({ path: statePath });
      logInfo(`Saved authenticated storage state for ${user.key} at ${statePath}`);
    }
  } catch (error) {
    logError(`Login failed for ${user.key}. Writing empty state.`, error);
    await writeEmptyState(statePath);
  } finally {
    await context.close();
    await browser.close();
  }
}

async function globalSetup(_config: FullConfig): Promise<void> {
  await ensureAuthDir();

  const users: UserCreds[] = [
    {
      key: 'user1',
      email: process.env.LINKEDIN_USER1_EMAIL,
      password: process.env.LINKEDIN_USER1_PASSWORD,
    },
    {
      key: 'user2',
      email: process.env.LINKEDIN_USER2_EMAIL,
      password: process.env.LINKEDIN_USER2_PASSWORD,
    },
  ];

  for (const user of users) {
    await loginAndSaveState(user);
  }
}

export default globalSetup;
