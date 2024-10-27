const puppeteer = require('puppeteer'); // v20.7.4 or later
const [waitForElement, waitForFunction, querySelectorAll, querySelectorsAll] = require('./commonPuppeteer.js')

require('dotenv').config();

const username = process.env.TLS_USERNAME;
const password = process.env.TLS_PASSWORD;

module.exports = async function tryWebsite(appointmentEmitter, countryCode, groupNumbers) {
  // const browser = await puppeteer.launch({headless: 'new'});
  const browser = await puppeteer.launch({headless: false, slowMo: 10});
  const page = await browser.newPage();
  const pollingTime = 600_000; // Milliseconds
  const pollingMinutes = pollingTime / 60 / 1000;
  const timeout = 20000;
  page.setDefaultTimeout(timeout);

  {
    const targetPage = page;
    await targetPage.setViewport({
        width: 1076,
        height: 1279
    })
  }

  const appointmentUrls = groupNumbers.map((groupNumber) => {
    return `https://visas-${countryCode}.tlscontact.com/appointment/gb/gbLON2${countryCode}/${groupNumber}`;
  })

  const appointmentUrlLength = appointmentUrls.length;

  async function goToAppointmentsPage(appointmentUrl) {
      const targetPage = page;
      const promises = [];
      const startWaitingForEvents = () => {
          promises.push(targetPage.waitForNavigation());
      }
      startWaitingForEvents();
      console.log(`Going to appointments page ${appointmentUrl}`);
      await targetPage.goto(appointmentUrl);
      await Promise.all(promises);
  }

  await goToAppointmentsPage(appointmentUrls[0]);

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
    console.log("Logging in if needed");
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



  if (!loginPage) {
    console.log("Setting testing with minutes:", pollingMinutes);
    await testAppointmentPage();
  }

  async function testAppointmentPage(cycle=0) {
    const appointmentUrl = appointmentUrls[cycle];
    try {
      await goToAppointmentsPage(appointmentUrl);
    } catch (err) {
      console.log("Error loading appointments page?")
      console.log(err);
      await targetPage.screenshot({ path: `./screenshots/failure-loading-${dateString}.jpg` });
      try {
        await loginIfNeeded();
      } catch (err) {
        console.log("Error logging in after failure");
        console.log(err);
      }
    }
    const targetPage = page;
    const appointmentsMessage = await checkForAppointmentsMessage();
    if (!appointmentsMessage) {
      const dateString = getFormattedDateForFilename();
      console.log(dateString, "May be success!");
      await targetPage.screenshot({ path: `./screenshots/possible-success-${dateString}.jpg` });
      const timeSlotsPresent = await checkForTimesSlotsPresent();
      if (timeSlotsPresent) {
        // Capture screenshot and save it in the screenshots folder
        console.log(dateString, "Deemed to be success!");
        await targetPage.screenshot({ path: `./screenshots/success-${dateString}.jpg` });
        appointmentEmitter.emit('appointmentFound', true);
      } else {
        sendAppointmentNotFound();
        await loginIfNeeded();
      }
    } else {
      sendAppointmentNotFound();
    }
    
    function sendAppointmentNotFound() {
      console.log((new Date()).toLocaleString('en-GB'), "Appointment not found.");
      appointmentEmitter.emit('appointmentFound', false);
    }

    console.log(new Date(), `Setting ${pollingMinutes} minute testing`);
    setTimeout(async () => await testAppointmentPage((cycle + 1) % appointmentUrls.length), pollingTime);
  }

  async function checkForAppointmentsMessage() {
    try {
      const targetPage = page;
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
      return true;
    } catch (err) {
      return false;
    }
  }

  async function checkForTimesSlotsPresent() {
    try {
      const targetPage = page;
      await waitForElement({
          type: 'waitForElement',
          target: 'main',
          selectors: [
            'button.tls-time-unit'
          ]
      }, targetPage, 5000);
      return true;
    } catch (err) {
      return false;
    }
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

  function getFormattedDateForFilename() {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Convert to 2 digits
    const day = date.getDate().toString().padStart(2, '0'); // Convert to 2 digits
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
  
    // Create a date string for filename: "YYYY-MM-DD_HH-MM-SS"
    return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
  }
}
