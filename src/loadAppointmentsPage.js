const puppeteer = require('puppeteer'); // v20.7.4 or later
const [waitForElement, waitForFunction, querySelectorAll, querySelectorsAll] = require('./commonPuppeteer.js')

require('dotenv').config();

const username = process.env.TLS_USERNAME;
const password = process.env.TLS_PASSWORD;

module.exports = async function tryWebsite() {
  // const browser = await puppeteer.launch({headless: 'new'});
  const browser = await puppeteer.launch({headless: false, slowMo: 10});
  const page = await browser.newPage();
  const timeout = 10000;
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
      await targetPage.goto('https://visas-de.tlscontact.com/appointment/gb/gbLON2de/2273157');
      await Promise.all(promises);
  }

  await goToAppointmentsPage();

  let loginPage = await isLoginPage();
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

  let appointmentErrorMessage = true;

  if (!loginPage) {
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
        console.log("May be success!!");
        appointmentErrorMessage = false;
      }
  } else {
    console.log("Couldn't login :/")
  }

  await browser.close();

  return appointmentErrorMessage;

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
          // .click({
          //   offset: {
          //     x: 166.53125,
          //     y: 24.390625,
          //   },
          // })
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
          // .click({
          //   offset: {
          //     x: 139.53125,
          //     y: 20.421875,
          //   },
          // })
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
