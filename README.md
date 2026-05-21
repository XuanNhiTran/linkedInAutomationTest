# LinkedIn Apply Automation (Playwright + TypeScript)

## 1) What does this project do?

This automation suite simulates a LinkedIn Apply flow on the Jobs page:

- Open the Jobs page
- Search jobs by keyword
- Apply the LinkedIn Apply filter
- Filter by company
- Open the application form
- Validate required fields and prefilled information
- Upload a resume
- Answer additional questions
- Validate information on the review step

## 2) Which browsers/devices are covered?

The following projects are configured in [playwright.config.ts](playwright.config.ts):

- chrome-desktop
- edge-desktop
- chrome-iphone13 (mobile emulation)
- edge-galaxys9 (mobile emulation)

## 3) How user sessions are handled

Global setup logs in two users (if credentials are provided) and saves session states to:

- playwright/.auth/user1.json
- playwright/.auth/user2.json

Each test runs with each user state to simulate multi-user behavior.

If credentials are missing, setup creates empty storage states and tests requiring authentication will be skipped.

## 4) Installation

If this is your first time running an automation project, follow these steps in order.

### 4.1 Prerequisites (install once)

You need these tools first:

- Git
- Node.js (LTS version, includes npm)
- Google Chrome and Microsoft Edge

Check after install:

~~~bash
node -v
npm -v
git --version
~~~

If all 3 commands show a version, you are ready.

### 4.2 Get project code

~~~bash
git clone <your-repo-url>
cd solution-tests
~~~

### 4.3 Install project dependencies

~~~bash
npm install
~~~

### 4.4 Install Playwright browsers

~~~bash
npx playwright install chrome msedge
~~~

### 4.5 Setup account credentials (required for login scenarios)

Create a .env file in project root with:

~~~env
LINKEDIN_USER1_EMAIL=your_email_1
LINKEDIN_USER1_PASSWORD=your_password_1
LINKEDIN_USER2_EMAIL=your_email_2
LINKEDIN_USER2_PASSWORD=your_password_2
~~~

If credentials are missing, setup will create empty auth states and tests that require login may be skipped.

### 4.6 Common errors

1. Error: command not found (node/npm/git)
Cause: tool is not installed or terminal not restarted after install.
Fix: install missing tool and reopen terminal.

2. Error: Missing script
Cause: using npm run with a file path.
Fix: use npx playwright test or node with a real file path.

3. Browser not found
Cause: Playwright browsers not installed.
Fix: run npx playwright install chrome msedge.

4. Test redirects to LinkedIn login even with storage state
Cause: LinkedIn anti-bot / expired or invalid auth state.
Fix: refresh login state and rerun (see Known Issues section).

## 5) How to run tests

### Run all projects

This runs desktop and mobile emulation on both Chrome and Edge.

~~~bash
npx playwright test
~~~

Note: this command writes results to:

- test-results/all-projects
- playwright-report/all-projects


## 6) Custom commands for desktop-only or mobile-only

### Desktop only (Chrome + Edge desktop)

~~~bash
npx playwright test --project=chrome-desktop --project=edge-desktop
~~~

### Mobile only (Chrome iPhone 13 + Edge Galaxy S9+)

~~~bash
npx playwright test --project=chrome-iphone13 --project=edge-galaxys9
~~~

## 7) Open reports

~~~bash
npx playwright show-report <report_path>
~~~
e.g: chrome-edge-desktop:
~~~bash
npx playwright show-report playwright-report\all-projects\chrome-edge-desktop-reports-PASSED
~~~
e.g: chrome-edge-mobile
~~~bash
npx playwright show-report playwright-report\all-projects\chrome-edge-mobile-FAILED
~~~

## 8) Where latest results are stored

Each per-environment run keeps only the latest result for that environment.

When you run a command (for example, chrome-desktop), the runner clears old data for that environment before running.

Output locations:

- Test artifacts: test-results/<environment>
- HTML report: playwright-report/<environment>
- Console log file: logs/<environment>.log

Example mapping:

- chrome-desktop -> test-results/chrome-desktop, playwright-report/chrome-desktop, logs/chrome-desktop.log
- edge-desktop -> test-results/edge-desktop, playwright-report/edge-desktop, logs/edge-desktop.log
- chrome-mobile -> project chrome-iphone13 -> logs/chrome-iphone13.log
- edge-mobile -> project edge-galaxys9 -> logs/edge-galaxys9.log

## 9) If some projects are disabled in the Testing panel

Try these steps:

- Make sure VS Code is using [playwright.config.ts](playwright.config.ts)
- Clear project filters in the Testing panel
- List detected projects:

~~~bash
npx playwright test --list
~~~

- If Edge projects are missing, reinstall browser channels:

~~~bash
npx playwright install chrome msedge
~~~

## 10) Known Issues & Future Improvements

### Session State & LinkedIn Anti-Bot Protection

**Current Issue:**

- Even with saved `storageState`, navigating to `/jobs` can trigger redirects to login (mobile)
- LinkedIn's anti-bot protections can detect automation even with valid cookies
- LinkedIn UI elements (selectors, structure) change frequently, causing selector failures

**Impact:**

- Mobile tests may fail inconsistently due to redirect loops
- Storage state alone is not sufficient for reliable authentication

**Future Improvements (TODO):**

- [ ] Detect and handle checkpoint/challenge pages gracefully
- [ ] Investigate issue with storageState for mobile test, add multiple work-around if redirect
- [ ] Consider using LinkedIn's official API instead of UI automation where possible
