import SETTINGS from './settings.js'

class SpeechRecogniter {
    constructor(page) {
        this.page = page;
        this.shouldOn = false;
        // this.isReallyOn = false;
    }

    async setup(onresultCallback) { // TODO move onresultCallback
        // create object // TODO refactor
        await this.page.addScriptTag({content: `
            const SpeechRecognition = webkitSpeechRecognition || SpeechRecognition;
            var recognition = new SpeechRecognition();
        `});

        // set attribute
        await this.set('interimResults', true);
        await this.set('continuous', true);

        // set method // refactor
        await this.setOnResult(onresultCallback);
        await this.setOnEnd();

        console.log('RECOGNITION: ready');
    }

    async setOnResult(callback) {
        // TODO allow changing exposed function?
        await this.page.exposeFunction('onSpeechRecognitionResult', callback);
        await this.page.evaluate(async () => {
            console.log('SET ONRESULT', recognition);
            recognition.onresult = async (event) => {
                let endedTranscripts = [];
                let ongoingTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal)
                        endedTranscripts.push(transcript);
                    else
                        ongoingTranscript = transcript;
                }

                newTranscript = {endedTranscripts, ongoingTranscript};
                await onSpeechRecognitionResult(newTranscript);
            }
        });
    }

    async setOnEnd() {
        await this.page.exposeFunction('onSpeechRecognitionEnd', () => { 
            // this.isReallyOn = false;
            this.onend();
        });
        await this.page.evaluate(async () => {
            recognition.onend = onSpeechRecognitionEnd;
        });
    }

    async set(attrName, value) {
        await this.page.evaluate((attrName, value) => {
            recognition[attrName] = value;
        }, attrName, value);
    }

    async setLanguage(lang) {
        console.log('RECOGNITION: lang', lang);

        const shouldOn = this.shouldOn;
        shouldOn && await this.stop();

        await this.set('lang', SETTINGS.languages[lang].name);

        await this.page.waitFor(500); // TODO remove waitFor
        shouldOn && await this.start();

    }

    async start() {
        console.log('RECOGNITION: start');
        this.shouldOn = true;
        await this.page.evaluate(() => {
            recognition.start();
        });
    }

    async stop() {
        console.log('RECOGNITION: stop');
        this.shouldOn = false;
        await this.page.evaluate(() => {
            recognition.stop();
        });
    }

    async onend() {
        console.log('RECOGNITION: auto stop', 'shouldOn', this.shouldOn);
        if (this.shouldOn) await this.start();
    }
};

export default SpeechRecogniter;