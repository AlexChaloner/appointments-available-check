const puppeteer = require('puppeteer'); // v20.7.4 or later
const {username, password} = require('./loginDetails.js');

module.exports = async function tryWebsite() {
  (async () => {
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
  
    let returnValue = false;
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
      const targetPage = page;
      const promises = [];
      const startWaitingForEvents = () => {
        promises.push(targetPage.waitForNavigation());
      }
      startWaitingForEvents();
      await Promise.all(promises);
      loginPage = await isLoginPage();
      attempts += 1;
    }

    console.log(loginPage);

    async function login() {
      await enterEmail(username);
      await enterPassword(password);
      await pressLogIn();
    }

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
          returnValue = true;
        }
    } else {
      console.log("Couldn't login :/")
    }

    await browser.close();

    return returnValue;

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

    async function waitForElement(step, frame, timeout) {
      const {
        count = 1,
        operator = '>=',
        visible = true,
        properties,
        attributes,
      } = step;
      const compFn = {
        '==': (a, b) => a === b,
        '>=': (a, b) => a >= b,
        '<=': (a, b) => a <= b,
      }[operator];
      await waitForFunction(async () => {
        const elements = await querySelectorsAll(step.selectors, frame);
        let result = compFn(elements.length, count);
        const elementsHandle = await frame.evaluateHandle((...elements) => {
          return elements;
        }, ...elements);
        await Promise.all(elements.map((element) => element.dispose()));
        if (result && (properties || attributes)) {
          result = await elementsHandle.evaluate(
            (elements, properties, attributes) => {
              for (const element of elements) {
                if (attributes) {
                  for (const [name, value] of Object.entries(attributes)) {
                    if (element.getAttribute(name) !== value) {
                      return false;
                    }
                  }
                }
                if (properties) {
                  if (!isDeepMatch(properties, element)) {
                    return false;
                  }
                }
              }
              return true;

              function isDeepMatch(a, b) {
                if (a === b) {
                  return true;
                }
                if ((a && !b) || (!a && b)) {
                  return false;
                }
                if (!(a instanceof Object) || !(b instanceof Object)) {
                  return false;
                }
                for (const [key, value] of Object.entries(a)) {
                  if (!isDeepMatch(value, b[key])) {
                    return false;
                  }
                }
                return true;
              }
            },
            properties,
            attributes
          );
        }
        await elementsHandle.dispose();
        return result === visible;
      }, timeout);
    }

    async function querySelectorsAll(selectors, frame) {
      for (const selector of selectors) {
        const result = await querySelectorAll(selector, frame);
        if (result.length) {
          return result;
        }
      }
      return [];
    }

    async function querySelectorAll(selector, frame) {
      if (!Array.isArray(selector)) {
        selector = [selector];
      }
      if (!selector.length) {
        throw new Error('Empty selector provided to querySelectorAll');
      }
      let elements = [];
      for (let i = 0; i < selector.length; i++) {
        const part = selector[i];
        if (i === 0) {
          elements = await frame.$$(part);
        } else {
          const tmpElements = elements;
          elements = [];
          for (const el of tmpElements) {
            elements.push(...(await el.$$(part)));
          }
        }
        if (elements.length === 0) {
          return [];
        }
        if (i < selector.length - 1) {
          const tmpElements = [];
          for (const el of elements) {
            const newEl = (await el.evaluateHandle(el => el.shadowRoot ? el.shadowRoot : el)).asElement();
            if (newEl) {
              tmpElements.push(newEl);
            }
          }
          elements = tmpElements;
        }
      }
      return elements;
    }

    async function waitForFunction(fn, timeout) {
      let isActive = true;
      const timeoutId = setTimeout(() => {
        isActive = false;
      }, timeout);
      while (isActive) {
        const result = await fn();
        if (result) {
          clearTimeout(timeoutId);
          return;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      throw new Error('Timed out');
    }
  })().catch(err => {
      console.error(err);
      process.exit(1);
  });
}
