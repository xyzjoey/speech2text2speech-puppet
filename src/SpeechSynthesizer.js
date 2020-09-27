import SETTINGS from './settings.js'

class SpeechSynthesizer {
    constructor(page) {
        this.page = page;
        this.lang = {
            name: undefined,
            voice: undefined,
            speed: undefined
        };
    }

    async setup() {
        await this.page.evaluate(() => speechSynthesis.getVoices());
    }

    async receive(transcripts) {
        const { endedTranscripts: speeches } = transcripts;

        if (!speeches) return;
        console.log('SYNTHESIS: receive');

        for (const text of speeches) {
            await this.page.evaluate((text, lang) => {
                const uttr = new SpeechSynthesisUtterance();
                uttr.text = text;
                uttr.rate = lang.speed;
                uttr.lang = lang.name;
                uttr.voice = speechSynthesis.getVoices().filter(voice => voice.name == lang.voice)[0];
                console.log(uttr);
                speechSynthesis.speak(uttr);
            }, text, this.lang);
        }
    }

    setLanguage(lang) {
        this.lang = SETTINGS.languages[lang];
        console.log('SYNTHESIS: lang', this.lang);
    }

    start() {}
    stop() {}
};

export default SpeechSynthesizer;
