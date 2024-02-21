const puppeteer = require('puppeteer'); // v20.7.4 or later
const [waitForElement, waitForFunction, querySelectorAll, querySelectorsAll] = require('./commonPuppeteer.js')

require('dotenv').config();

const username = process.env.TLS_USERNAME;
const password = process.env.TLS_PASSWORD;

module.exports = async function tryWebsite(appointmentEmitter) {
  // const browser = await puppeteer.launch({headless: 'new'});
  const browser = await puppeteer.launch({headless: false, slowMo: 10});
  const page = await browser.newPage();
  const timeout = 20000;
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
      await targetPage.goto('https://visas-de.tlscontact.com/appointment/gb/gbLON2de/2273157');
      await Promise.all(promises);
  }

  await goToAppointmentsPage();

  let loginPage = true;

  async function loginIfNeeded() {
    console.log("Logging in");
    loginPage = await isLoginPage();
    async function isLoginPage() {
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
        return false;
      }
    }
  
    attempts = 0;
    while (loginPage && attempts < 2) {
      await login();
      await goToAppointmentsPage();
      {
        const targetPage = page;
        const promises = [];
        const startWaitingForEvents = () => {
          promises.push(targetPage.waitForNavigation());
        }
        startWaitingForEvents();
        await Promise.all(promises);
      }
      loginPage = await isLoginPage();
      attempts += 1;
    }
  
    console.log(loginPage);
  
    async function login() {
      await enterEmail(username);
      await enterPassword(password);
      await pressLogIn();
    }
  }


  let errorFound = true;
  let attempts = 0;

  while (errorFound && attempts < 2) {
    try {

      await loginIfNeeded();
      errorFound = false;
    } catch (err) {
      console.log("Had difficulty logging in or loading appointments page", attempts)
      console.log(err);
      errorFound = true;
      attempts += 1
    }
  }

  if (loginPage) {
    console.log("Couldn't log in");
    return;
  }

  if (!loginPage) {
    console.log("Setting 5 minute testing");
    setTimeout(async () => await testAppointmentPage(), 300000);
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
      await waitForElement({
        type: 'waitForElement',
        target: 'main',
        selectors: [
            'div.tls-popup-display--container > div > div div:nth-of-type(2) > div:nth-of-type(1) > div',
            'xpath///*[@id="app"]/div[4]/div[3]/div[2]/div/div/div[2]/div[2]/div[1]/div',
            'pierce/div.tls-popup-display--container > div > div div:nth-of-type(2) > div:nth-of-type(1) > div'
        ],
        visible: true
      }, targetPage, timeout);
    } catch (err) {
      console.log(err);
      console.log("May be success!");
      appointmentEmitter.emit('appointmentFound', true);
    }
  }

  await browser.close();

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
