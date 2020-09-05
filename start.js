import puppeteer from 'puppeteer-core'

import GoogleDoc from './src/googledoc.js'
import Input from './src/inputs.js'
import { readYaml } from './src/utils.js'

const config = readYaml('./config.yml');

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        executablePath: config.browser.executablePath,
        userDataDir: config.browser.userDataDir,
        devtools: true
    });

    // set google doc
    const page = (await browser.pages())[0];
    const googledoc = await GoogleDoc.create(page, config.googledoc.editableLink);
    await googledoc.voicetype.setLanguage(config.defaultLanguage);
    
    // set shorcuts
    Input.registerShortcut('init', config.shortcuts.init, key => googledoc.init())
    Input.registerShortcut('autoTranscribe', config.shortcuts.autoTranscribe, key => {
        googledoc.toggleAutoTranscribe();
    })
    const langShorcuts = config.shortcuts.lang;
    for (let lang in langShorcuts) {
        Input.registerShortcut(lang, langShorcuts[lang], key => {
            googledoc.voicetype.setLanguage(lang);
        })
    }

    console.log('ready');
})();
