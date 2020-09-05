import puppeteer from 'puppeteer-core'

import GoogleDoc from './src/GoogleDoc.js'
import Input from './src/Input.js'
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
    
    // set text handling interval
    // const 

    // set shorcuts
    Input.registerShortcut('init', 
                            config.shortcuts.init, 
                            key => googledoc.init());
    Input.registerShortcut('autoTranscribe', 
                            config.shortcuts.autoTranscribe, 
                            key => googledoc.toggleAutoTranscribe());
    Object.entries(config.shortcuts.lang).forEach(([lang, keynames]) =>
        Input.registerShortcut(lang,
                                keynames,
                                key => googledoc.voicetype.setLanguage(lang))
    );

    console.log('ready');
})();
