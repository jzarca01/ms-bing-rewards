const puppeteer = require('puppeteer');
const isPi = require('detect-rpi');
const Chance = require('chance');

const chance = new Chance();
const userAgent = require('./config').userAgent;

function rewardsApi() {
    
};

rewardsApi.prototype.getRewards = async function (user, pass) {

    let browser;

    if(isPi()) {
        browser = puppeteer.launch({
            headless: false,
            slowMo: 50,
            executablePath: '/usr/bin/chromium-browser'
        })
    }
    else {
        browser = puppeteer.launch({
            headless: false,
            slowMo: 50,
        }) 
    }

    browser.then(async browser => {
        const page = await browser.newPage();
    
        await login(page, user, pass);
        const level = await getStatus(page)
        if(level === 2) {
            console.log("Level 2");          
            await getSearchLinks(page, 30, false);
            await getSearchLinks(page, 20, true);
        }
        else if(level === 1) {
            console.log("Level 1");                        
            await getSearchLinks(page, 10, false);
        }
        await browser.close();
    });
};

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array)
    }
}

async function login(page, username, password) {
    console.log(username);
    await page.goto('http://www.bing.com/rewards/signup/signin', {
        waitUntil: ['load', 'domcontentloaded', 'networkidle0']        
    });
    await page.click('.identityOption a');
    await page.waitForSelector('input[name="loginfmt"]')
    await page.type('input[name="loginfmt"]', username);
    await page.click('input[type="submit"]');
    await page.waitForSelector('input[name="passwd"]');
    await page.type('input[name="passwd"]', password);
    await page.waitForSelector('input[name="KMSI"]');
    await page.click('input[name="KMSI"]');
    await page.click('input[type="submit"]');
    await page.waitForSelector('div[role="complementary"]')
        .then(() => console.log('Logged in'));
}

async function getStatus(page) {

    page.on('dialog', async dialog => {
        await dialog.dismiss();
    });

    await page.goto('https://www.bing.com/rewards/dashboard', {
        waitUntil: ['load']
    });
    await page.waitForSelector("a[id=status-level]", {
        visible: true
    });

    const level = await page.$eval('a[id=status-level]', e => e.innerHTML)
    .then(el => parseInt(el.replace("Niveau&nbsp;", "").replace("Level&nbsp;", "").trim() ));

    return level;
}

async function getSearchLinks(page, nbSearch = 10, isMobile = false) {

    const searchTerms = generateRandomSearch(nbSearch);

    if(isMobile) {
        page.setUserAgent(userAgent.mobile);
        page.setViewport({
            width: 768,
            height: 1024,
            isMobile: true,
            hasTouch: true
        });
    }

    else {
        page.setUserAgent(userAgent.desktop);
    }

    await asyncForEach(searchTerms, async(term) => {
        await page.goto('https://www.bing.com/', {
            waitUntil: ['load', 'domcontentloaded', 'networkidle0']
        });
        await page.type('input[type=search]', term);
        await page.click('input[type=submit]');
        await page.waitForSelector('ol[id=b_results]', {
            visible: true
        });
        await page.waitFor(chance.integer({min: 1000, max: 5000}));
    });

    return true;
}

function generateRandomSearch(number) {
    return Array.from(new Array(number), (x, i) => chance.currency().name);
}

module.exports = rewardsApi;
