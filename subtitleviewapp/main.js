const {
    app,
    BrowserWindow,
    screen
} = require('electron')

const path = require('path')
const url = require('url')

// const SETTINGS = require('../src/settings.js')
// import SETTINGS = require('../src/settings.js');

var win = undefined;

app.on('ready', () => {
    createWindow();
    // console.log(SETTINGS);
})

app.on('window-all-closed', () => {
    // darwin = MacOS
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (win === null) {
        createWindow()
    }
})

function createWindow() {
    const { width: screenWidth , height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
    // Create the browser window.
    win = new BrowserWindow({
        width: screenWidth,
        height: 50,
        x: 0,
        y: screenHeight - 50,
        maximizable: false,
        frame: false,
        transparent: true,
        webPreferences: {
            nodeIntegration: true
        }
    })

    win.setAlwaysOnTop(true, 'screen');

    win.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }))

    // Open DevTools.
    // win.webContents.openDevTools()

    // When Window Close.
    win.on('closed', () => {
        win = null
    })
}