import iohook from 'iohook'

iohook.start();
process.on('exit', () => {
    iohook.unregisterAllShortcuts();
    iohook.unload();
});

class Input {
    static get keycodes () {
        return {
            'leftCtrl': 29,
            'leftShift': 42,
            'leftAlt': 56,
            'P': 25,
        }
    }

    static ids = {};

    static registerShortcut(shortcutName, keynames, callback) {
        const keycodes = keynames.map(name => Input.keycodes[name]);
        const id = iohook.registerShortcut(keycodes, callback);
        Input.ids[shortcutName] = id;
    }
}

export default Input
