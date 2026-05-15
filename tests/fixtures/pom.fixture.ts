import { test as base, expect, type Locator } from '@playwright/test';
import { LinkedInApplyModal } from '../pages/LinkedInApplyModal';
import { LinkedInJobsPage } from '../pages/LinkedinJobsPage';
import { LoginPage } from '../pages/LoginPage';

type PageObjectFixtures = {
  jobsPage: LinkedInJobsPage;
  loginPage: LoginPage;
  linkedInApplyModalFromDialog: (dialog: Locator) => LinkedInApplyModal;
};

const test = base.extend<PageObjectFixtures>({
  jobsPage: async ({ page }, use) => {
    await use(new LinkedInJobsPage(page));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  linkedInApplyModalFromDialog: async ({}, use) => {
    await use((dialog: Locator) => new LinkedInApplyModal(dialog));
  },
});

export { test, expect };
