'use strict';

import puppeteer from 'puppeteer-core'

import Transcriber from './src/Transcriber.js'
import SpeechRecogniter from './src/SpeechRecogniter.js'
import SpeechSynthesizer from './src/SpeechSynthesizer.js'
import WebEditor from './src/WebEditor.js'
import Input from './src/Input.js'
import SETTINGS from './src/settings.js'

const CONFIG = SETTINGS.config;

(async () => {
    const browser = await puppeteer.launch(CONFIG.puppeteer);
    const page = (await browser.pages())[0];

    // create transcriber
    const speechRecogniter = new SpeechRecogniter(page);
    const speechSynthesizer = new SpeechSynthesizer(page);
    const texteditor = new WebEditor(page);
    const transcriber = new Transcriber(speechRecogniter, [speechSynthesizer, texteditor]);
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
