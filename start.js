'use strict';

import puppeteer from 'puppeteer-core'

import Transcriber from './src/Transcriber.js'
import SETTINGS from './src/settings.js'

const CONFIG = SETTINGS.config;

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        executablePath: CONFIG.browser.executablePath,
        userDataDir: CONFIG.browser.userDataDir,
        devtools: true
    });

    const transcriber = await Transcriber.create(browser);
    await transcriber.setup();
    transcriber.start();
})();
