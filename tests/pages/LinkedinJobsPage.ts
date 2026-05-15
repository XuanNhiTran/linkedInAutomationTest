import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { logInfo } from '../utils/logger';

export class LinkedInJobsPage extends BasePage {
  private signInLink: Locator;
  private searchInput: Locator;
  private tryNewJobSearchButton: Locator;
  private searchContent: Locator;
  private companyFilterButton: Locator;
  private companySearchInput: Locator;
  private showResultsButton: Locator;
  // Easy Apply is not available anymore, use LinkedIn Apply instead
  private linkedApplyFilter: Locator;
  private linkedInApplyJobButton: Locator
  // Old UI fallback
  private oldSearchInput: Locator;
  private oldSearchContent: Locator;
  private oldSearchContentAlt: Locator;
  private oldCompanyFilterButton: Locator;
  private companySearchButton: Locator;
  private oldShowResultsButton: Locator;
  private oldLinkedApplyFilter: Locator;
  private oldLinkedInApplyJobButton: Locator;

  private applicationDialog: Locator;


  constructor(page: Page) {
    super(page);
    this.signInLink = this.page.getByRole('link', { name: 'Sign in' }).first();
    this.searchInput = this.page.locator('[componentkey="jobSearchBox"]');
    this.tryNewJobSearchButton = this.page.locator('button').filter({ hasText: 'Try the new job search' });
    this.searchContent = this.page.locator('[componentkey="SearchResultsMainContent"]');
    this.companyFilterButton = this.page.locator('div[aria-label="Filter by Company"]');
    this.companySearchInput = this.page.locator('input[placeholder*="company"]');
    this.showResultsButton = this.page.locator('span > span:has-text("results")');
    this.linkedApplyFilter = this.page.locator('div[role][aria-label="Filter by LinkedIn Apply"]');
    this.linkedInApplyJobButton = this.page.locator('[aria-label*="LinkedIn Apply"] > span');
    // Old UI fallback
    this.oldSearchInput = this.page.locator('input[id*=jobs-search][aria-label]');
    this.oldSearchContent = this.page.locator('ul[class*="search-results-list"]');
    this.oldSearchContentAlt = this.page.locator('ul[class] > li[data-occludable-job-id]');
    this.oldCompanyFilterButton = this.page.locator('button[id="searchFilter_company"]');
    this.companySearchButton = this.page.locator('p > span[class]:text-is("Add a company")');
    this.oldShowResultsButton = this.page.locator('button:has-text("results"):visible');
    this.oldLinkedApplyFilter = this.page.locator('button[aria-label*="LinkedIn Apply filter"]');
    this.oldLinkedInApplyJobButton = this.page.locator('button[aria-label*="LinkedIn Apply"][data-job-id]:visible');
    this.applicationDialog = this.page.locator('[data-test-modal][class*=easy-apply]');

  }

  getCompanyDropdownLocatorByName(companyName: string, oldUI?: boolean): Locator {
    if (oldUI) {
      return this.page.locator('fieldset[class*="search-filters"] span:text-is("' + companyName + '")');
    }
    return this.page.locator('[componentkey*="SearchResults_auto-component"] span:text-is("' + companyName + '")');
  }

  getJobCardByName(jobName: string): Locator {
    return this.page.getByText(`${jobName}`, { exact: true }).first();
  }

  async goto(): Promise<void> {
    await this.page.goto('/jobs', { waitUntil: 'domcontentloaded', timeout: 60000 });
  }

  async isAt(): Promise<boolean> {
    return /linkedin\.com\/jobs/.test(this.page.url());
  }

  async needsLogin(): Promise<boolean> {
    const signInVisible = await this.signInLink.waitFor({ state: 'visible', timeout: 5000 }).then(() => true).catch(() => false);

    return signInVisible || /\/login/.test(this.page.url());
  }

  async searchJob(keyword: string): Promise<void> {
    const searchInputVisible = await this.searchInput.waitFor({ state: 'visible', timeout: 5000 }).then(() => true).catch(() => false);
    let newUI = true;
    if (!searchInputVisible) {
      logInfo('Main search input not found, falling back to old search input.');
      await this.oldSearchInput.fill(keyword);
      newUI = false;
    }
    else {
      await this.searchInput.fill(keyword);
    }
    await this.page.keyboard.press('Enter');
    await this.page.waitForLoadState('domcontentloaded');
    const tryNewSearchVisible = await this.tryNewJobSearchButton.isVisible({ timeout: 5000 }).catch(() => false);
    if (tryNewSearchVisible) {
      logInfo('Try new job search button detected, clicking to load new search experience.');
      await this.tryNewJobSearchButton.click();
      await this.page.waitForLoadState('domcontentloaded');
    }
    if (newUI) {
      await this.searchContent.waitFor({ state: 'visible', timeout: 10000 });
    }
    else {
      await this.oldSearchContent.waitFor({ state: 'visible', timeout: 10000 });
    }
    await this.page.evaluate(() => window.scrollTo(0, 0));
  }

  async applyOldLinkedInApplyFilter(): Promise<void> {
    const oldLinkedInApplyFilterVisible = await this.oldLinkedApplyFilter.waitFor({ state: 'visible', timeout: 5000 }).then(() => true).catch(() => false);
    if (!oldLinkedInApplyFilterVisible) {
      throw new Error('Old LinkedIn Apply filter button not found.');
    }
    await this.oldLinkedApplyFilter.click();
    await this.oldSearchContent.waitFor({ state: 'visible', timeout: 10000 });
  }

  async applyLinkedInApplyFilter(): Promise<void> {

    const linkedInApplyFilter = await this.linkedApplyFilter.waitFor({ state: 'visible', timeout: 5000 }).then(() => true).catch(() => false);
    if (!linkedInApplyFilter) {
      logInfo('LinkedIn Apply filter button not found, falling back to old filter button.');
      await this.applyOldLinkedInApplyFilter();
      return;
    }
    else {
      await this.linkedApplyFilter.click();
      await this.searchContent.waitFor({ state: 'visible', timeout: 10000 });
    }
  }

  async filterByCompanyOld(companyName: string): Promise<void> {
    await this.oldCompanyFilterButton.click();
    await this.companySearchInput.fill(companyName);
    await this.getCompanyDropdownLocatorByName(companyName, true).click();
    await this.oldShowResultsButton.click();
    await this.oldSearchContent.or(this.oldSearchContentAlt.first()).waitFor({ state: 'visible', timeout: 10000 });
  }

  async filterByCompany(companyName: string, jobName: string): Promise<void> {
    await this.page.evaluate(() => window.scrollTo(0, 0));
    for (let attempt = 0; attempt < 3; attempt++) {
      const companyFilterVisible = await this.companyFilterButton.waitFor({ state: 'visible', timeout: 5000 }).then(() => true).catch(() => false);
      if (!companyFilterVisible) {
        logInfo('Company filter button not found, falling back to old filter method.');
        await this.filterByCompanyOld(companyName);
        return;
      }
      else
      {
      await this.companyFilterButton.click();
      try {
        const companySearchVisible = await this.companySearchInput.waitFor({ state: 'visible', timeout: 5000 }).then(() => true).catch(() => false);
        if (!companySearchVisible) {
          logInfo('Company search input not found, clicking company search button to reveal it.');
          await this.companySearchButton.click();
        }
        await this.companySearchInput.fill(companyName);
        await this.getCompanyDropdownLocatorByName(companyName).click();
        await this.showResultsButton.click();
        await this.searchContent.waitFor({ state: 'visible', timeout: 10000 });
        break;
      } catch (error) {
        if (attempt === 2) {
          throw error;
        }
      }
    }
  }
  }

  async clickJobByName(jobName: string): Promise<void> {
    await this.getJobCardByName(jobName).waitFor({ state: 'visible', timeout: 10000 });
    await this.getJobCardByName(jobName).click();
  }

  async openLinkedInApplyDialog(jobName: string): Promise<Locator> {
    await this.getJobCardByName(jobName).waitFor({ state: 'visible', timeout: 10000 });
    await this.getJobCardByName(jobName).click();
    const linkedInApplyButtonVisible = await this.linkedInApplyJobButton.waitFor({ state: 'visible', timeout: 30000 }).then(() => true).catch(() => false);
    if (!linkedInApplyButtonVisible) {
      logInfo('LinkedIn Apply button not found, falling back to old apply button.');
      await this.oldLinkedInApplyJobButton.waitFor({ state: 'visible', timeout: 10000 });
      await this.oldLinkedInApplyJobButton.click();
        }
      else {
        await this.linkedInApplyJobButton.click();
      }
    await expect(this.applicationDialog).toBeVisible( { timeout: 100000 });
    return this.applicationDialog;
  }
}
