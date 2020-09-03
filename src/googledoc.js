import { last } from './utils.js'

class GoogleDocSelector {
    static get pageBottoms() { return '.kix-page-column-bottom'; }
    static get paragraphs() { return '.kix-paragraphrenderer'; }
    static get micSwitch() { return '.docs-mic-control'; }
}

class VoiceType {
    constructor(page) {
        this.page = page;
        this.keepOnInterval = undefined;
    }

    async getMicSwitch() 
    { return this.page.$(GoogleDocSelector.micSwitch); }

    async toggle() {
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
        console.log('googledoc: voicetype: stop on');
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
    }

    async getPageBottoms() 
    { return this.page.$$(GoogleDocSelector.pageBottoms); }
    async getParagraphs() 
    { return this.page.$$(GoogleDocSelector.paragraphs); }

    static async create(page, url) {
        const googledoc = new GoogleDoc(page);

        await page.goto(url);

        // close left panel
        await page.waitForSelector('.navigation-widget-hat-close', {visible:true, timeout:3000});
        await page.click('.navigation-widget-hat-close');

        // wait ready
        await page.waitForSelector(GoogleDocSelector.pageBottoms, {timeout:1000});
        return googledoc;
    }

    async scrollToBottom() {
        last(await this.getPageBottoms()).evaluate(el => el.scrollIntoViewIfNeeded());
    }

    async scrollToLastLine() {
        last(await this.getParagraphs()).evaluate(el => el.scrollIntoViewIfNeeded());
    }

    async moveCursorToEnd() {
        const lastParagraph = last(await this.getParagraphs());
        const rect = await lastParagraph.boundingBox();
        await this.page.mouse.click(rect.x + rect.width, rect.y + rect.height);
    }
}

export default GoogleDoc;