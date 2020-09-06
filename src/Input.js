import iohook from 'iohook'
import SETTINGS from './settings.js'

const KEYCODES = SETTINGS.keycodes;

iohook.start();
process.on('exit', () => {
    iohook.unregisterAllShortcuts();
    iohook.unload();
});

class Input {
    static shortcutIds = {};

    static registerShortcut(shortcutName, keynames, callback) {
        const keynameList = typeof(keynames) === 'string' ? keynames.split(/\s/) : keynames;

        const keycodes = keynameList.map(name => KEYCODES[name]);
        if (keycodes.includes(undefined))
            throw Error(`undefined key(s) [${keynameList}] to [${keycodes.map(k => String(k))}]`);

        const id = iohook.registerShortcut(keycodes, key => {
            console.log('INPUT: receive shortcut:', shortcutName, keynameList);
            callback(key);
        });

        Input.shortcutIds[shortcutName] = id;
    }
}

export default Input
