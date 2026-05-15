import { expect, type Locator } from '@playwright/test';

export class LinkedInApplyModal {
  private dialog: Locator;
  private emailDropdown: Locator;
  private phoneCountryCodeDropdown: Locator;
  private mobilePhoneNumberInput: Locator;
  private uploadResumeFile: Locator;
  private resumeRequiredEnforcementLocator: Locator;
  private downloadResumeButton: Locator;
  private nextButton: Locator;
  private additionalQuestionsInput: Locator;
  private reviewButton: Locator;
  private reviewInformationText: Locator;
  private reviewResumeText: Locator;

  constructor(dialog: Locator) {
    this.dialog = dialog;
    this.emailDropdown = this.dialog.getByLabel('Email address');
    this.phoneCountryCodeDropdown = this.dialog.getByLabel('Phone country code');
    this.mobilePhoneNumberInput = this.dialog.getByRole('textbox', { name: 'Mobile phone number*' });
    this.uploadResumeFile = this.dialog.locator('label').filter({ hasText: 'Upload resume' });
    this.resumeRequiredEnforcementLocator = this.dialog.locator('[class*=jobs-document-upload][class*=is-required]');
    this.downloadResumeButton = this.dialog.locator('button[aria-label*="Download resume"]');
    this.nextButton = this.dialog.getByRole('button', { name: 'Continue to next step' });
    this.additionalQuestionsInput = this.dialog.locator('input[required]');
    this.reviewButton = this.dialog.getByRole('button', { name: 'Review your application' });
    this.reviewInformationText = this.dialog.locator('[class*=white-space-pre-line]');
    this.reviewResumeText = this.dialog.locator('h3[class*=filename]');
  }

  getPhoneCountryCodeDropdown(): Locator {
    return this.phoneCountryCodeDropdown;
  }

  getMobilePhoneNumberInput(): Locator {
    return this.mobilePhoneNumberInput;
  }

  getEmailDropdown(): Locator {
    return this.emailDropdown;
  }

  getNextButton(): Locator {
    return this.nextButton;
  }

  async assertRequiredFieldsVisible(): Promise<void> {
    await expect(this.getEmailDropdown(), 'Missing required email field in Easy Apply form.').toBeVisible({ timeout: 10000 });
    await expect(this.getEmailDropdown()).toHaveAttribute('aria-required', 'true');
    await expect(this.getPhoneCountryCodeDropdown(), 'Missing required phone country code field in Easy Apply form.').toBeVisible({ timeout: 10000 });
    await expect(this.getPhoneCountryCodeDropdown()).toHaveAttribute('aria-required', 'true');
    await expect(this.getMobilePhoneNumberInput(), 'Missing required mobile phone number field in Easy Apply form.').toBeVisible({ timeout: 10000 });
    await expect(this.getMobilePhoneNumberInput()).toHaveAttribute('required');
    await expect(this.getNextButton(), 'Missing Next button in Easy Apply form.').toBeVisible({ timeout: 10000 });
  }

  async getCurrentEmailAddress(): Promise<string> {
    return this.getEmailDropdown().inputValue();
  }

  async getCurrentPhoneCountryCode(): Promise<string> {
    return this.getPhoneCountryCodeDropdown().inputValue();
  }

  async inputContactInformation(phoneNumber: string, phoneCountryCode?: string): Promise<void> {
    if (phoneCountryCode) {
      await this.getPhoneCountryCodeDropdown().selectOption({ label: phoneCountryCode });
    }
    await this.getMobilePhoneNumberInput().fill(phoneNumber);
    await this.getNextButton().click();
  }

  async uploadResume(filePath: string): Promise<void> {
    await expect(this.resumeRequiredEnforcementLocator, 'Resume upload field is not marked as required.').toBeVisible({ timeout: 10000 });
    await this.uploadResumeFile.setInputFiles(filePath);
    await expect(this.downloadResumeButton).toBeVisible({ timeout: 10000 });
    await this.nextButton.click();
  }

  async answerAdditionalQuestion(answer: string[]): Promise<void> {
    // await expect(this.additionalQuestionsInput.first()).toBeVisible({ timeout: 10000 });
    const totalQuestions = await this.additionalQuestionsInput.all();
    for (let i = 0; i < totalQuestions.length; i++) {
      expect(this.additionalQuestionsInput.nth(i)).toHaveAttribute('required');
      const questionInput = this.additionalQuestionsInput.nth(i);
      await questionInput.fill(answer[i]);
    }
    await this.reviewButton.click();
  }

async getReviewInformation(): Promise<string[]> {
  const reviewInfo: string[] = [];
  const reviewInfoText = (await this.reviewInformationText.allInnerTexts()).map(s => s.replace(/\n/g, '').trim());
  const reviewResumeText = (await this.reviewResumeText.innerText())?.replace(/\n/g, '').trim();
  reviewInfo.push(...reviewInfoText);
  if (reviewResumeText) reviewInfo.push(reviewResumeText);
  return reviewInfo;
}}
