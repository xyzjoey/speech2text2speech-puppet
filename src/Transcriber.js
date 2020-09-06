import GoogleDoc from './GoogleDoc.js'
import Input from './Input.js'
import SETTINGS from './settings.js'

const CONFIG = SETTINGS.config;

class Transcriber {
    constructor(browser, googledoc) {
        this.browser = browser;
        this.googledoc = googledoc;

        this.language = undefined;
        this.currText = undefined;
        this.isAutoTranscribeOn = false;
    }

    static async create(browser) {
        // set google doc
        const googledocPage = (await browser.pages())[0];
        const googledoc = new GoogleDoc(googledocPage, CONFIG.googledoc.editableLink);

        return new Transcriber(browser, googledoc);
    }

    async setup() {
        await this.googledoc.setup();
        // await this.text2speech.setup();
        await this.setLanguage(CONFIG.defaultLanguage);

        // set shorcuts
        Input.registerShortcut('init', 
                                CONFIG.shortcuts.init, 
                                key => this.resetup());
        Input.registerShortcut('autoTranscribe', 
                                CONFIG.shortcuts.autoTranscribe, 
                                key => this.toggleAutoTranscribe());
        Object.entries(CONFIG.shortcuts.lang).forEach(([lang, keynames]) =>
            Input.registerShortcut(lang,
                                    keynames,
                                    key => this.setLanguage(lang))
        );

        console.log('ready')
    }

    async start() {
    }

    async resetup() {
        // if !page --> create again
        await this.googledoc.setup();
        // await this.text2speech.setup();

        this.language = undefined;
        await this.setLanguage(CONFIG.defaultLanguage);

        console.log('ready')
    }

    async toggleAutoTranscribe() {
        if (!this.isAutoTranscribeOn) {
            this.isAutoTranscribeOn = true;
            // cancel clear subtitle txt timeout
            // await this.text2speech.autoTranscribe();
            await this.googledoc.autoTranscribe();
        }
        else {
            this.isAutoTranscribeOn = false;
            // await this.text2speech.stopAutoTranscribe();
            await this.googledoc.stopAutoTranscribe();
            // clear subtitle txt after x sec
        }
    }

    async setLanguage(language) {
        if (this.language === language) return;
        this.language = language;
        await this.googledoc.setLanguage(language);
        // await this.text2speech.setLanguage(language);
    }

    // async updateText() {
    //     const newText = await this.googledoc.getLastParagraphText();
    //     // write text to .txt
    //     const textDiff = diff(this.currText, newText);
    //     // this.text2speech.speak(textDiff)

    //     this.currText = newText;
    // }
};

export default Transcriber