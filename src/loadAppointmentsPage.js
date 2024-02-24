const puppeteer = require('puppeteer'); // v20.7.4 or later
const [waitForElement, waitForFunction, querySelectorAll, querySelectorsAll] = require('./commonPuppeteer.js')

require('dotenv').config();

const username = process.env.TLS_USERNAME;
const password = process.env.TLS_PASSWORD;

module.exports = async function tryWebsite(appointmentEmitter) {
  // const browser = await puppeteer.launch({headless: 'new'});
  const browser = await puppeteer.launch({headless: false, slowMo: 10});
  const page = await browser.newPage();
  const timeout = 30000;
  page.setDefaultTimeout(timeout);

  {
    const targetPage = page;
    await targetPage.setViewport({
        width: 1076,
        height: 1279
    })
  }

  async function goToAppointmentsPage() {
      const targetPage = page;
      const promises = [];
      const startWaitingForEvents = () => {
          promises.push(targetPage.waitForNavigation());
      }
      startWaitingForEvents();
      console.log("Going to appointments page");
      await targetPage.goto('https://visas-de.tlscontact.com/appointment/gb/gbLON2de/2279305');
      // await targetPage.goto('https://visas-de.tlscontact.com/appointment/gb/gbLON2de/2273157');
      await Promise.all(promises);
  }

  await goToAppointmentsPage();

  let loginPage = true;

  async function isLoginPage() {
    console.log("Checking if login page");
    const targetPage = page;
    try {
      await waitForElement({
        type: 'waitForElement',
        target: 'main',
        selectors: [
            'aria/Log in[role="heading"]',
            '#form-title',
            'xpath///*[@id="form-title"]',
            'pierce/#form-title'
        ]
      }, targetPage, timeout);
      console.log("Found login page D:");
      return true;
    } catch (err) {
      console.log(err);
      console.log("Did not find login page");
      return false;
    }
  }

  /**
   * Checks if page is login page. If login page, logins in.
   */
  async function loginIfNeeded() {
    console.log("Logging in");
    loginPage = await isLoginPage();
  
    attempts = 0;
    while (loginPage && attempts < 2) {
      console.log("Logging in, attempt", attempts)
      await login();
      loginPage = await isLoginPage();
      attempts += 1;
    }
  
    console.log("Is login page:", loginPage);
  
    async function login() {
      await enterEmail(username);
      await enterPassword(password);
      await pressLogIn();
    }
  }

  try {
    await loginIfNeeded();
  } catch (err) {
    console.log("Had difficulty logging in or loading appointments page")
    console.log(err);
  }

  if (loginPage) {
    console.log("Couldn't log in");
    await browser.close();
    return;
  } else {
    console.log("Logged in!");
  }

  const pollingTime = 120000; // Milliseconds
  const pollingMinutes = pollingTime / 60 / 1000;

  if (!loginPage) {
    console.log("Setting testing with minutes:", pollingMinutes);
    await testAppointmentPage();
  }

  async function testAppointmentPage() {
    try {
      await goToAppointmentsPage();
    } catch (err) {
      console.log("Error loading appointments page?")
      console.log(err);
      await loginIfNeeded();
    }
    const targetPage = page;
    try {
      await checkForTimesSlotsPresent();
      console.log((new Date()).toLocaleString('en-GB'), "May be success!");
      // Capture screenshot and save it in the screenshots folder
      await targetPage.screenshot({ path: `./screenshots/success-${new Date()}.jpg` });
      appointmentEmitter.emit('appointmentFound', true);
    } catch (err) {
      console.log((new Date()).toLocaleString('en-GB'), "Appointment not found.");
      appointmentEmitter.emit('appointmentFound', false);
    }
    console.log(new Date(), `Setting ${pollingMinutes} minute testing`);
    setTimeout(async () => await testAppointmentPage(), pollingTime);
  }

  async function checkForTimesSlotsPresent() {
    const targetPage = page;
    await waitForElement({
        type: 'waitForElement',
        target: 'main',
        selectors: [
          'button.tls-time-unit'
        ]
    }, targetPage, timeout);
  }

  // TODO - Requires a little more work to check through multiple pages
  async function checkForTimesSlotsAvailableOnCurrentPage() {
    const targetPage = page;
    await waitForElement({
        type: 'waitForElement',
        target: 'main',
        selectors: [
          'button.tls-time-unit.-available'
        ]
    }, targetPage, timeout);
  }

  // await browser.close();

  async function enterEmail(username) {
    {
      const targetPage = page;
      await puppeteer.Locator.race([
          targetPage.locator('::-p-aria(Email)'),
          targetPage.locator('#username'),
          targetPage.locator('::-p-xpath(//*[@id=\\"username\\"])'),
          targetPage.locator(':scope >>> #username')
      ])
          .setTimeout(timeout)
          .fill(username);
    }
  }

  async function enterPassword(password) {
    {
      const targetPage = page;
      await puppeteer.Locator.race([
          targetPage.locator('::-p-aria(Password)'),
          targetPage.locator('#password'),
          targetPage.locator('::-p-xpath(//*[@id=\\"password\\"])'),
          targetPage.locator(':scope >>> #password')
      ])
          .setTimeout(timeout)
          .fill(password);
    }    
  }

  async function pressLogIn() {
    {
      const targetPage = page;
      const promises = [];
      const startWaitingForEvents = () => {
          promises.push(targetPage.waitForNavigation());
      }
      await puppeteer.Locator.race([
          targetPage.locator('::-p-aria(Log in[role=\\"button\\"])'),
          targetPage.locator('#kc-login'),
          targetPage.locator('::-p-xpath(//*[@id=\\"kc-login\\"])'),
          targetPage.locator(':scope >>> #kc-login')
      ])
          .setTimeout(timeout)
          .on('action', () => startWaitingForEvents())
          .click({
            offset: {
              x: 53.015625,
              y: 16.421875,
            },
          });
      await Promise.all(promises);
    }
  }
}
