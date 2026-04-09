const { app, BrowserWindow, shell, Menu } = require("electron");
const path = require("path");

const APP_URL = "https://www.reconaitechnology.com/";
const PROTOCOL = "reconai";

// Register custom protocol so OAuth callbacks (e.g. Clerk) can return to the app.
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [
      path.resolve(process.argv[1]),
    ]);
  }
} else {
  app.setAsDefaultProtocolClient(PROTOCOL);
}

// Single-instance lock so deep links focus the existing window instead of spawning new ones.
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    backgroundColor: "#0b0b0f",
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.loadURL(APP_URL);

  // Open external links (target=_blank, http(s) outside our origin) in the user's browser.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const u = new URL(url);
      const appHost = new URL(APP_URL).hostname;
      if (u.hostname === appHost) return { action: "allow" };
      shell.openExternal(url);
      return { action: "deny" };
    } catch {
      return { action: "deny" };
    }
  });

  // Hide the menu bar by default; keep DevTools shortcut working.
  Menu.setApplicationMenu(null);
}

app.on("second-instance", (_event, argv) => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
  // Handle deep link on Windows/Linux (passed via argv).
  const deepLink = argv.find((arg) => arg.startsWith(`${PROTOCOL}://`));
  if (deepLink && mainWindow) {
    mainWindow.webContents.send("deep-link", deepLink);
  }
});

// macOS deep link handler.
app.on("open-url", (event, url) => {
  event.preventDefault();
  if (mainWindow) {
    mainWindow.webContents.send("deep-link", url);
  }
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
