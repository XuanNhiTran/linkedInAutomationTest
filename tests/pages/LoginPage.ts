import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { logInfo } from '../utils/logger';

export class LoginPage extends BasePage {
	private emailInput: Locator;
	private passwordInput: Locator;
	private signInButton: Locator;
  private closeSignInWithGoogleButton: Locator;
  private welcomeBackText: Locator;
  private threeDotsButton: Locator;
  private removeAccountButton: Locator;

	constructor(page: Page) {
		super(page);
		this.emailInput = this.page.locator('input[type="email"]:visible');
		this.passwordInput = this.page.locator('input[type="password"]:visible');
		this.signInButton = this.page.getByRole('button', { name: 'Sign in', exact: true });
    this.closeSignInWithGoogleButton = this.page.locator('[role=button][id="close"]');
    this.welcomeBackText = this.page.locator('p:text-is("Welcome back"):visible');
    this.threeDotsButton = this.page.locator('button[aria-label=menu][aria-expanded]:visible');
    this.removeAccountButton = this.page.locator('[role=button]:has-text("Remove from this list")');
	}

  async handleWelcomeBackScreen(): Promise<void> {
    const welcomeBackVisible = await this.welcomeBackText.isVisible({ timeout: 5000 }).catch(() => false);
    if (welcomeBackVisible) {
      logInfo('Welcome back screen detected. Attempting to remove remembered account for clean login.');
      await this.threeDotsButton.click();
      await this.removeAccountButton.click();
    }
  }

	async login(email: string, password: string): Promise<void> {
		await this.page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await this.handleWelcomeBackScreen();
		await this.emailInput.fill(email);
		await this.passwordInput.fill(password);
    const signInWithGoogleVisible = await this.closeSignInWithGoogleButton.isVisible({ timeout: 5000 }).catch(() => false);
    if (signInWithGoogleVisible) {
      await this.closeSignInWithGoogleButton.click();
    }
		await this.signInButton.click();
		await this.page.waitForURL(/linkedin\.com\/(feed|jobs|in\/|checkpoint|challenge).*/, { timeout: 60000 });
    logInfo('Login successful, current URL: ' + this.page.url());
	}

  async handleSecurityCheckpoint(): Promise<void> {
    if (/checkpoint|challenge/.test(this.page.url())) {
      logInfo('Security checkpoint/challenge detected after login.');
      throw new Error('Login successful but security checkpoint/challenge detected. Manual intervention may be required for this account.');
    }
}
}
