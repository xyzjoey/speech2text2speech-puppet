import puppeteer from 'puppeteer-core'

import config from './config.json'
import GoogleDoc from './src/googledoc.js'
import Input from './src/inputs.js'

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        executablePath: config.browser.executablePath,
        userDataDir: config.browser.userDataDir,
        devtools: true
    });

    const page = (await browser.pages())[0];

    const googledoc = await GoogleDoc.create(page, config.googledoc.editableLink);
    
    Input.registerShortcut('', ['leftShift', 'leftAlt', 'P'], key => {
        googledoc.toggleAutoTranscribe();
    })

    console.log('ready');
})();
