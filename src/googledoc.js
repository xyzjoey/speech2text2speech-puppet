import { last } from './utils.js'

class GoogleDocSelector {
    static get pageBottoms() { return '.kix-page-column-bottom'; }
    static get paragraphs() { return '.kix-paragraphrenderer'; }
    static get micSwitch() { return '.docs-mic-control'; }
    static get cursor() { return '.kix-cursor'; }
}

class VoiceType {
    constructor(page) {
        this.page = page;
        this.keepOnInterval = undefined;
    }

    async getMicSwitch() 
    { return this.page.$(GoogleDocSelector.micSwitch); }

    async toggle() {
        // press shortcut Shift + Ctrl + S
        await this.page.keyboard.down('ControlLeft');
        await this.page.keyboard.down('Shift');
        await this.page.keyboard.press("KeyS", {delay: 50}); 
        await this.page.keyboard.up('ControlLeft');
        await this.page.keyboard.up('Shift');
    }

    async isOn() {
        const switchPressed = await (await this.getMicSwitch())?.evaluate(el => el.ariaPressed);
        return switchPressed === 'true';
    }

    async on() {
        if (!(await this.isOn())) await this.toggle();
    }
    async off() {
        if (await this.isOn()) await this.toggle();
    }

    async keepOn() {
        console.log('googledoc: voicetype: keep on');
        await this.on();
        
        if (!this.keepOnInterval) {
            this.keepOnInterval = setInterval(async () => {
                await this.on();
            }, 1000);
        }
    }

    async stopOn() {
        console.log('googledoc: voicetype: stop');
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
    constructor(page) {
        this.page = page;
        this.voicetype = new VoiceType(page);

        this.isAutoTranscribeOn = false;
        this.cursorInterval = undefined;
    }

    async getPageBottoms() 
    { return this.page.$$(GoogleDocSelector.pageBottoms); }
    async getParagraphs() 
    { return this.page.$$(GoogleDocSelector.paragraphs); }
    async getCursor()
    { return this.page.$(GoogleDocSelector.cursor); }

    static async create(page, url) {
        const googledoc = new GoogleDoc(page);

        await page.goto(url);

        // close left panel
        await page.waitForSelector('.navigation-widget-hat-close', {visible:true, timeout:3000});
        await page.click('.navigation-widget-hat-close');
        // init cursor position
        await googledoc.activateCursor();
        await googledoc.moveCursorToEnd();
        // open voicetype popup
        await googledoc.voicetype.toggle();
        await googledoc.voicetype.toggle();

        return googledoc;
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
        console.log('googledoc: start auto new line');

        // const / var
        const intervalTime = 750;
        const maxIdleTime = 3000;
        let idleTime = 0;
        let currCursorPos = await this.getCursorPos();
        // helpers
        const isPosChanged = (pos1, pos2) => (pos1.x != pos2.x || pos1.y != pos2.y);
        const isLineEmpty = (line) => (line.replace(/(\s|\u200C)/g,'').length < 1);

        // set interval
        if (!this.cursorInterval) {
            this.cursorInterval = setInterval(async () => {
                await this.moveCursorToEnd();
                const newCursorPos = await this.getCursorPos();
                const lastline = await this.getLastLine();

                if (isPosChanged(currCursorPos, newCursorPos) || isLineEmpty(lastline)) idleTime = 0;
                else idleTime += intervalTime;

                if (idleTime >= maxIdleTime) {
                    console.log('googledoc: insert new line')
                    await this.insertNewLine();
                    idleTime = 0;
                }

                currCursorPos = newCursorPos;
            }, intervalTime);
        }
    }

    stopAutoNewLine() {
        console.log('googledoc: stop auto new line');
        clearInterval(this.cursorInterval);
        this.cursorInterval = undefined;
    }

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