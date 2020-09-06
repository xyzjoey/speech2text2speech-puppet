
import { last, removeSpace, pixelToNumber } from './utils.js'
import SETTINGS from './settings.js'

const SELECTOR = SETTINGS.googledoc.selector;

class VoiceType {
    constructor(page) {
        this.page = page;
        this.intervals = {
            keepOn: undefined
        };
    }

    async getMic() 
    { return this.page.$(SELECTOR.voicetype.mic); }
    async getLanguageButton()
    { return this.page.$(SELECTOR.voicetype.lang.button); }

    async setLanguage(language) {
        console.log(`GOOGLEDOC: voicetype: switch lang ${language}`);

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
        
        if (!this.intervals.keepOn) {
            this.intervals.keepOn = setInterval(async () => {
                await this.on();
            }, 1000);
        }
    }

    async stopOn() {
        console.log('GOOGLEDOC: voicetype: stop');
        clearInterval(this.intervals.keepOn);
        this.intervals.keepOn = undefined;
        await this.off();
    }
};

class GoogleDoc {
    constructor(page, url) {
        this.page = page;
        this.url = url;
        this.id = /docs.google.com\/document\/d\/(?<id>.*)\/edit/.exec(url).groups.id;

        this.voicetype = new VoiceType(page);
        this.currText = '';
        this.intervals = {
            newLine: undefined,
            updateText: undefined
        };
    }

    async getPageBottoms() 
    { return this.page.$$(SELECTOR.pageBottom); }
    async getParagraphs() 
    { return this.page.$$(SELECTOR.paragraph); }
    async getCursor()
    { return this.page.$(SELECTOR.cursor); }

    async setup() {
        // setup page
        if (!this.page.url().includes(this.id))
            await this.page.goto(this.url);
        try { // expose helper functions if haven't
            await this.page.exposeFunction('removeSpace', removeSpace);
            await this.page.exposeFunction('pixelToNumber', pixelToNumber);
        } catch (e) {}

        // close left panel if haven't
        try {
            await this.page.waitForSelector('.navigation-widget-hat-close', {visible:true, timeout:3000});
            await this.page.click('.navigation-widget-hat-close');
        } catch (e) {}

        // setup cursor position
        await this.activateCursor();
        await this.moveCursorToEnd(); // FIXME: not working from 2nd time

        // setup voicetype
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

    async getText() {
        return this.currText;
    }

    // set text that is not overlapped by dots
    async updateText() {
        this.currText = await last(await this.getParagraphs()).evaluate(async (paragraph, SELECTOR) => {
            let visibleText = '';
            const lines = paragraph.querySelectorAll(SELECTOR.line);
            
            for (let i = 0; i < lines.length; ++i) {
                const line = lines[i];
                const wordNode = line.querySelector(SELECTOR.wordNode);
                const allText = await removeSpace(wordNode.innerText, /(\u200C)/g);
                const visibleWidth = await pixelToNumber(line.querySelector(SELECTOR.dots)?.style?.left);

                if ((await removeSpace(allText)).length == 0) continue;

                if (visibleWidth === null || isNaN(visibleWidth)) {
                    visibleText += allText;
                }
                else { // increment characters until invisible
                    const nodeCopy = wordNode.cloneNode(true);
                    nodeCopy.style.position = 'absolute';
                    nodeCopy.style.left = 0;
                    nodeCopy.style.top = 0;
                    nodeCopy.style.opacity = 0;
                    document.body.appendChild(nodeCopy);

                    for (let i = 0; i < allText.length; ++i) {
                        nodeCopy.innerText = allText.substring(0, i+1);
                        if (visibleWidth - nodeCopy.offsetWidth > -1) visibleText += allText[i];
                        else break;
                    }

                    document.body.removeChild(nodeCopy);
                    break;
                }
            }
            console.log('visibleText', visibleText);
            return visibleText;
        }, SELECTOR);
    }

    async insertNewLine() {
        await this.page.keyboard.press(String.fromCharCode(13)); // press enter
    }

    async autoNewLine() {
        console.log('GOOGLEDOC: start auto new line');

        if (this.intervals.newLine) return;

        // const / var
        const intervalTime = 750;
        const maxIdleTime = 3000;
        let idleTime = 0;
        let currCursorPos = await this.getCursorPos();
        // helpers
        const isPosChanged = (pos1, pos2) => pos1.x != pos2.x || pos1.y != pos2.y;
        const isLineEmpty = line => removeSpace(line).length < 1;

        // set interval
        this.intervals.newLine = setInterval(async () => {
            await this.moveCursorToEnd();
            const newCursorPos = await this.getCursorPos();

            if (isPosChanged(currCursorPos, newCursorPos) || isLineEmpty(this.currText)) idleTime = 0;
            else idleTime += intervalTime;

            if (idleTime >= maxIdleTime) {
                console.log('GOOGLEDOC: insert new line')
                await this.insertNewLine();
                idleTime = 0;
            }

            currCursorPos = newCursorPos;
        }, intervalTime);
    }

    stopAutoNewLine() {
        console.log('GOOGLEDOC: stop auto new line');
        clearInterval(this.intervals.newLine);
        this.intervals.newLine = undefined;
    }

    autoUpdateText() {
        if (!this.intervals.updateText)
            this.intervals.updateText = setInterval(() => this.updateText(), 250);
    }

    stopAutoUpdateText() {
        clearInterval(this.intervals.updateText);
        this.intervals.updateText = undefined;
    }

    async setLanguage(language) {
        await this.voicetype.setLanguage(language);
        await this.activateCursor();
        await this.insertNewLine();
    }

    async autoTranscribe() {
        this.autoNewLine();
        this.autoUpdateText();
        await this.moveCursorToEnd();
        this.voicetype.keepOn();
    }

    async stopAutoTranscribe() {
        this.stopAutoNewLine();
        this.stopAutoUpdateText();
        this.voicetype.stopOn();
    }
};

export default GoogleDoc;