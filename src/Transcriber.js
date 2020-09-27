import SETTINGS from './settings.js'

const CONFIG = SETTINGS.config;

class Transcriber {
    constructor(speechInput, speechOutputs) {
        this.speechInput = speechInput;
        this.speechOutputs = speechOutputs;
        this.language = undefined;
        this.isTranscribeOn = false;
    }

    async setup() {
        for (const output of this.speechOutputs) await output.setup();
        await this.speechInput.setup((transcripts) => { // TODO refactor
            console.log('RECOGNITION: onresult', transcripts);
            for (const output of this.speechOutputs) output.receive(transcripts);
        });

        await this.setLanguage(CONFIG.defaultLanguage);
        console.log('ready');
    }

    // async reset() {
    //     // TODO if !page --> create again?
    //     // this.language = undefined;
    //     // await this.setLanguage(CONFIG.defaultLanguage);
    //     console.log('not implemented');
    // }

    async start() {
        console.log('start');
        this.isTranscribeOn = true;
        await this.speechInput.start();
        for (const output of this.speechOutputs) await output.start();
    }

    async stop() {
        console.log('stop');
        this.isTranscribeOn = false;
        await this.speechInput.stop();
        for (const output of this.speechOutputs) await output.stop();
    }
 
    async toggleAutoTranscribe() {
        if (!this.isTranscribeOn) await this.start();
        else await this.stop();
    }

    async setLanguage(language) {
        if (this.language === language) return;

        console.log('switch language', language);
        
        this.language = language;
        await this.speechInput.setLanguage(language);
        for (const output of this.speechOutputs) await output.setLanguage(language);
    }
};

export default Transcriber