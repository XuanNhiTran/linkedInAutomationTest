import type { Page } from '@playwright/test';


export class BasePage {
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Common methods for all pages can be added here

}
