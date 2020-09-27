import http from 'http'
import fs from 'fs'
import { getParentHandle, handleEqual } from './utils.js'

// serve editor
const hostname = '127.0.0.1';
const port = 3000;
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'content-type': 'text/html' });
    fs.createReadStream('./webeditor/index.html').pipe(res);
});
server.listen(port, hostname, () => {
    console.log(`EDITOR: serving at http://${hostname}:${port}/`);
});

class WebEditor {
    constructor (page) {
        this.page = page;
    }

    async setup() {
        const url = `http://${hostname}:${port}/`;
        await this.page.goto(url);
        console.log('EDITOR: ready');
    }

    async getLastLine() {
        return this.page.$('#textarea>div:last-child');
    }

    async getRecognizingSpan() {
        return this.page.$('#recognizing');
    }

    async addNewline(line = undefined) {
        await (line || await this.getLastLine()).evaluate(el => el.outerHTML += '<div><br></div>');
    }

    async addToLine(line, innerhtml) {
        await line.evaluate((el, innerhtml) => {
            if (el.innerHTML === '<br>') el.innerHTML = innerhtml;
            else el.innerHTML += innerhtml;
        }, innerhtml);
    }

    async clearRecognizingText() {
        console.log('EDITOR: clear');
        const span = await this.getRecognizingSpan();
        await span?.evaluate(el => el.outerHTML = '');
    }

    async receive({endedTranscripts, ongoingTranscript}) {
        console.log('EDITOR: receive');
        const getLineToWrite = async () => {
            const span = await this.getRecognizingSpan();
            const lastline = await this.getLastLine();
            const islastline = !span || await handleEqual(lastline, await getParentHandle(span));
            return {span, lastline, islastline};
        };

        for (const transcript of endedTranscripts) {
            const { span, lastline, islastline } = await getLineToWrite();
            
            if (span) await span.evaluate((el, transcript) => el.outerHTML = transcript, transcript);
            else await this.addToLine(lastline, transcript);

            if (islastline) await this.addNewline(lastline);
        }
        if (ongoingTranscript) {
            const { span, lastline } = await getLineToWrite();
            if (span) await span.evaluate((el, transcript) => el.innerHTML = transcript, ongoingTranscript);
            else await this.addToLine(lastline, `
                    <span id='recognizing' class='underdotted' contenteditable='false'>
                        ${ongoingTranscript}
                    </span>
                `);
        }
    }

    setLanguage() {}
    start() {}
    async stop() { await this.clearRecognizingText(); }
};

export default WebEditor;
