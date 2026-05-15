import { chromium } from '@playwright/test';

(async () => {

    // Mở browser
    const browser = await chromium.launch({
        headless: false
    });

    // Tạo context
    const context = await browser.newContext();

    // Mở page
    const page = await context.newPage();

    // Vào LinkedIn login
    await page.goto('https://www.linkedin.com/login');

    console.log('\n====================================');
    console.log('1. Login manual');
    console.log('2. Solve captcha/checkpoint manual');
    console.log('3. Sau khi vào home page -> nhấn ENTER');
    console.log('====================================\n');

    // Chờ user nhấn Enter
    process.stdin.resume();

    await new Promise<void>((resolve) => {
        process.stdin.once('data', () => resolve());
    });

    // Save storage state
    await context.storageState({
        path: 'storageState/linkedin.json'
    });

    console.log('\nStorage state saved!');
    console.log('File: storageState/linkedin.json\n');

    await browser.close();

})();
