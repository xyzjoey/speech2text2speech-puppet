import fs from 'fs'
import SETTINGS from './settings.js'

class SubtitleView {
    constructor() {
        this.filepath = SETTINGS.config.subtitle.outputFile;
    }

    setup() {
        if (fs.existsSync(this.filepath)) console.log('SUBTITLE: file ready');
        else throw new Error(`file ${this.filepath} does not exist`);
    }

    writetxt(filepath, data) {
        fs.writeFile(filepath, data, (err) => err && console.log(err));
    }

    receive({endedTranscripts, ongoingTranscript}) {
        console.log('SUBTITLE: receive');
        const lasttext =  ongoingTranscript || endedTranscripts[endedTranscripts.length-1];
        this.writetxt(this.filepath, lasttext);
    }

    setLanguage() {}
    start() {}
    stop() {}
}

export default SubtitleView;
