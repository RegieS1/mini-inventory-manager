import { app, BrowserWindow } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: "Kugi",
    backgroundColor: "#f3efe6",
    autoHideMenuBar: true,
    icon: path.join(root, "public", "icon-512.png"),
  });

  win.loadURL(process.env.KUGI_URL || "http://127.0.0.1:3000");
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
