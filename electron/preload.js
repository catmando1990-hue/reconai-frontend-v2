const { contextBridge, ipcRenderer } = require("electron");

// Minimal, safe bridge. Expand as the desktop app needs more native capabilities.
contextBridge.exposeInMainWorld("reconai", {
  platform: process.platform,
  isDesktop: true,
  onDeepLink: (handler) => {
    const listener = (_event, url) => handler(url);
    ipcRenderer.on("deep-link", listener);
    return () => ipcRenderer.removeListener("deep-link", listener);
  },
});
