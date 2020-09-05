'use strict';

import { last, removeSpace, readData } from './utils.js'

const SELECTOR = readData('googledoc.yml').selector;
// const TEXT = readData('googledoc.yml').text; // TODO read once

class VoiceType {
    constructor(page) {
        this.page = page;
        this.keepOnInterval = undefined;
        this.language = undefined; // TODO put default language in config
    }

    async getMic() 
    { return this.page.$(SELECTOR.voicetype.mic); }
    async getLanguageButton()
    { return this.page.$(SELECTOR.voicetype.lang.button); }

    async setLanguage(language) {
        if (this.language === language) return;
        
        console.log(`GOOGLEDOC: voicetype: switch lang ${language}`);
        this.language = language;

        await this.off();
        await this.page.click(SELECTOR.voicetype.lang.button);
        await this.page.waitForSelector(SELECTOR.voicetype.lang[language], {timeout: 1000});
        await this.page.click(SELECTOR.voicetype.lang[language]);
    }

    async toggle() {
        // press shortcut Shift + Ctrl + S
        await this.page.keyboard.down('ControlLeft');
        await this.page.keyboard.down('Shift');
        await this.page.keyboard.press("KeyS", {delay: 50}); 
        await this.page.keyboard.up('ControlLeft');
        await this.page.keyboard.up('Shift');
    }

    async isOn() {
        const switchPressed = await (await this.getMic())?.evaluate(el => el.ariaPressed);
        return switchPressed === 'true';
    }

    async on() {
        if (!await this.isOn()) {
            await this.toggle();
            return true;
        }
        return false;
    }
    async off() {
        if (await this.isOn()) {
            await this.toggle();
            return true;
        }
        return false;
    }

    async keepOn() {
        console.log('GOOGLEDOC: voicetype: keep on');
        await this.on();
        
        if (!this.keepOnInterval) {
            this.keepOnInterval = setInterval(async () => {
                await this.on();
            }, 1000);
        }
    }

    async stopOn() {
        console.log('GOOGLEDOC: voicetype: stop');
        clearInterval(this.keepOnInterval);
        this.keepOnInterval = undefined;
        await this.off();
    }

    // TODO remove
    async keepOrStop() {
        if (this.keepOnInterval === undefined)
            await this.keepOn();
        else
            await this.stopOn();
    }
}

class GoogleDoc {
    constructor(page, url) {
        this.page = page;
        this.url = url;
        this.id = /docs.google.com\/document\/d\/(?<id>.*)\/edit/.exec(url).groups.id;

        this.voicetype = new VoiceType(page);
        this.isAutoTranscribeOn = false; // TODO remove
        this.cursorInterval = undefined;
    }

    async getPageBottoms() 
    { return this.page.$$(SELECTOR.pageBottoms); }
    async getParagraphs() 
    { return this.page.$$(SELECTOR.paragraphs); }
    async getCursor()
    { return this.page.$(SELECTOR.cursor); }

    static async create(page, url) {
        const googledoc = new GoogleDoc(page, url);

        await googledoc.init();
        return googledoc;
    }

    async init() {
        // goto url
        if (!this.page.url().includes(this.id))
            await this.page.goto(this.url);

        // close left panel
        try {
            await this.page.waitForSelector('.navigation-widget-hat-close', {visible:true, timeout:3000});
            await this.page.click('.navigation-widget-hat-close');
        } catch (e) {}

        // init cursor position
        await this.activateCursor();
        await this.moveCursorToEnd();

        // open voicetype
        try{
            await this.page.waitForSelector(SELECTOR.voicetype.mic, {visible:true, timeout:100});
        } catch (e) {
            await this.voicetype.toggle();
            await this.voicetype.toggle();
        }

        console.log('GOOGLEDOC: ready');
    }

    // async scrollToBottom() {
    //     last(await this.getPageBottoms()).evaluate(el => el.scrollIntoViewIfNeeded());
    // }
    // async scrollToLastLine() {
    //     last(await this.getParagraphs()).evaluate(el => el.scrollIntoViewIfNeeded());
    // }

    async activateCursor() {
        const cursorPos = await this.getCursorPos();
        await this.page.mouse.click(cursorPos.x, cursorPos.y);
    }

    async moveCursorToEnd() {
        // press Ctrl + End
        await this.page.keyboard.down('ControlLeft');
        await this.page.keyboard.press("End", {delay: 50}); 
        await this.page.keyboard.up('ControlLeft');
    }

    async getCursorPos() {
        return (await this.getCursor()).evaluate(el => ({
            x: +el.style.left?.replace('px', ''),
            y: +el.style.top?.replace('px', '')
        }));
    }

    async getLastLine() {
        return last(await this.getParagraphs()).evaluate(el => el.innerText);
    }
    async insertNewLine() {
        await this.page.keyboard.press(String.fromCharCode(13)); // press enter
    }

    async autoNewLine() {
        console.log('GOOGLEDOC: start auto new line');

        // const / var
        const intervalTime = 750;
        const maxIdleTime = 3000;
        let idleTime = 0;
        let currCursorPos = await this.getCursorPos();
        // helpers
        const isPosChanged = (pos1, pos2) => pos1.x != pos2.x || pos1.y != pos2.y;
        const isLineEmpty = line => removeSpace(line).length < 1;

        // set interval
        if (!this.cursorInterval) {
            this.cursorInterval = setInterval(async () => {
                await this.moveCursorToEnd();
                const newCursorPos = await this.getCursorPos();
                const lastline = await this.getLastLine();

                if (isPosChanged(currCursorPos, newCursorPos) || isLineEmpty(lastline)) idleTime = 0;
                else idleTime += intervalTime;

                if (idleTime >= maxIdleTime) {
                    console.log('GOOGLEDOC: insert new line')
                    await this.insertNewLine();
                    idleTime = 0;
                }

                currCursorPos = newCursorPos;
            }, intervalTime);
        }
    }

    stopAutoNewLine() {
        console.log('GOOGLEDOC: stop auto new line');
        clearInterval(this.cursorInterval);
        this.cursorInterval = undefined;
    }

    // TODO remove
    async toggleAutoTranscribe() {
        if (!this.isAutoTranscribeOn) {
            this.isAutoTranscribeOn = true;
            this.autoNewLine();
            this.voicetype.keepOn();
        }
        else {
            this.isAutoTranscribeOn = false;
            this.stopAutoNewLine();
            this.voicetype.stopOn();
        }
    }
}

export default GoogleDoc;