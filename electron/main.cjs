const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');

const APP_URL = process.env.APP_URL || 'https://skst.lovable.app';

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    title: 'Sức Khoẻ Siêu Thị',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadURL(APP_URL);
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

Menu.setApplicationMenu(null);

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
