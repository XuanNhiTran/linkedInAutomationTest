import { test, expect } from './fixtures/pom.fixture';
import path from 'node:path';
import { users } from './data/users';
import data from './data/applicants_information.json';
import { logError, logInfo } from './utils/logger';
import { generateRandomArray } from './utils/helper';
import dotenv from 'dotenv';

dotenv.config();

const { applicantInformation } = data;
const resumePath = path.join(process.cwd(), 'tests', 'data', 'sample-resume.pdf');


for (const user of users) {
  test.describe(`LinkedIn Apply flow (${user.name})`, () => {
    test.use({ storageState: user.storageStatePath });

  test('Validates required fields, resume upload, and button state', async ({
    page,
    jobsPage,
    loginPage,
    linkedInApplyModalFromDialog,
  }, testInfo) => {
    try {
      logInfo(`[${user.name}] Starting LinkedIn Apply validation flow.`);

      await test.step('Go to jobs page and check login', async () => {
        logInfo(`[${user.name}] Navigating to LinkedIn Jobs page.`);
        await jobsPage.goto();
        if (await jobsPage.needsLogin()) {
          logInfo(`[${user.name}] Session is not authenticated. Attempting fallback login.`);
          await loginPage.login(user.email, user.password);
          await jobsPage.goto();
          if (await jobsPage.needsLogin()) {
            test.skip(true, 'LinkedIn still requires login/challenge for this user in current context.');
          }
        }
      });

      await test.step('Search job and open LinkedIn Apply dialog', async () => {
        await jobsPage.searchJob(applicantInformation.job);
        await jobsPage.applyLinkedInApplyFilter();
        await jobsPage.filterByCompany(applicantInformation.company, applicantInformation.job);
        await jobsPage.clickJobByName(applicantInformation.job);
      });

      const applicationDialog = await test.step('Open LinkedIn Apply dialog', async () => {
        return await jobsPage.openLinkedInApplyDialog(applicantInformation.job);
      });

      const modal = linkedInApplyModalFromDialog(applicationDialog);

      await test.step('Check required fields and prefilled info', async () => {
        await modal.assertRequiredFieldsVisible();
        const prefilledEmail = await modal.getCurrentEmailAddress();
        const prefilledPhoneCountryCode = await modal.getCurrentPhoneCountryCode();
        expect(prefilledEmail, 'Expected email field to be pre-filled with user information.').toBe(user.email);
        expect(prefilledPhoneCountryCode, 'Expected phone country code field to be pre-filled with user information.').toBe(applicantInformation.phoneCountryCode);
        logInfo(`[${user.name}] Prefilled email: ${prefilledEmail}`);
        logInfo(`[${user.name}] Prefilled phone country code: ${prefilledPhoneCountryCode}`);
      });

      await test.step('Input contact info and upload resume', async () => {
        await modal.inputContactInformation(applicantInformation.phoneNumber, applicantInformation.phoneCountryCode);
        await modal.uploadResume(resumePath);
      });

      const numberOfExperienceEntries = generateRandomArray(4);
      await test.step('Answer additional questions', async () => {
        await modal.answerAdditionalQuestion(numberOfExperienceEntries);
      });

      await test.step('Validate review information', async () => {
        const expectedReviewInfo = [
          user.email,
          applicantInformation.phoneCountryCode,
          applicantInformation.phoneNumber,
          `${path.basename(resumePath)}`,
          ...numberOfExperienceEntries,
        ];
        const reviewInfo = await modal.getReviewInformation();
        const expectedReviewInfoSorted = [...expectedReviewInfo].sort();
        const reviewInfoSorted = [...reviewInfo].sort();
        logInfo(`[${user.name}] Review information: ${JSON.stringify(reviewInfo)}`);
        expect(reviewInfoSorted, 'Review information does not match expected input.').toEqual(expectedReviewInfoSorted);
      });

      logInfo(`[${user.name}] LinkedIn Apply flow completed successfully.`);
    } catch (error) {
      logError(`[${user.name}] LinkedIn Apply validation failed.`, error);
      await page.screenshot({
        path: testInfo.outputPath(`${user.name}-linkedin-apply-failure.png`),
        fullPage: true,
      });
      throw error;
    }
  });
  });
}
