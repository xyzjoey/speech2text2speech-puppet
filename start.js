'use strict';

import puppeteer from 'puppeteer-core'

import Transcriber from './src/Transcriber.js'
import SpeechRecogniter from './src/SpeechRecogniter.js'
import SpeechSynthesizer from './src/SpeechSynthesizer.js'
import WebEditor from './src/WebEditor.js'
import SubtitleViewer from './src/SubtitleViewer.js'
import Input from './src/Input.js'
import SETTINGS from './src/settings.js'

const CONFIG = SETTINGS.config;

(async () => {
    const browser = await puppeteer.launch(CONFIG.puppeteer);
    const page = (await browser.pages())[0];

    // create transcriber
    const transcriber = new Transcriber(new SpeechRecogniter(page), [
        new WebEditor(page), 
        new SpeechSynthesizer(page),
        new SubtitleViewer(page),
    ]);
    await transcriber.setup();

    // set shorcuts
    // Input.registerShortcut('init', 
    //                         CONFIG.shortcuts.init, 
    //                         key => this.reset());
    Input.registerShortcut('autoTranscribe', 
                            CONFIG.shortcuts.autoTranscribe, 
                            key => transcriber.toggleAutoTranscribe());
    Object.entries(CONFIG.shortcuts.lang).forEach(([lang, keynames]) =>
        Input.registerShortcut(lang,
                                keynames,
                                key => transcriber.setLanguage(lang))
    );
})();
