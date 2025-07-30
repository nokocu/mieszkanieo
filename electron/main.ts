import { app, BrowserWindow, shell } from 'electron';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';

let mainWindow: BrowserWindow | null = null;
let backendProcess: ChildProcess | null = null;

// ensure single instance
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    // start backend first, then create window
    startBackendServer()
      .then(() => {
        setTimeout(createWindow, 1500); // wait for backend to fully start
      })
      .catch((error) => {
        console.error('failed to start backend:', error);
        app.quit();
      });
  });
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    },
    icon: path.join(__dirname, '../assets/icon.ico'),
    show: false,
    titleBarStyle: 'default'
  });

  // load the built frontend directly from file system
  mainWindow.loadFile(path.join(__dirname, '../frontend/dist/index.html'));

  // handle external links - open in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // handle navigation to external urls
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    // if it's not our local server, open in external browser
    if (parsedUrl.origin !== 'http://localhost:8000') {
      event.preventDefault();
      shell.openExternal(navigationUrl);
    }
  });

  mainWindow.once('ready-to-show', () => {
    if (mainWindow) mainWindow.show();
  });

  mainWindow.on('closed', () => {
    stopBackendServer();
    app.quit();
  });
}

function startBackendServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log('starting backend server...');
    
    const backendPath = path.join(__dirname, '../backend');
    const serverScript = path.join(backendPath, 'dist', 'server.js');

    try {
      // production environment
      const env = { ...process.env, NODE_ENV: 'production' };
      
      backendProcess = spawn('node', [serverScript], {
        cwd: backendPath,
        stdio: ['pipe', 'pipe', 'pipe'], // capture output
        env: env
      });

      let started = false;

      backendProcess.stdout?.on('data', (data: Buffer) => {
        const output = data.toString();
        console.log('backend:', output.trim());
        
        // check if server started successfully
        if (output.includes('Server running on') && !started) {
          started = true;
          console.log('backend server started successfully');
          resolve();
        }
      });

      backendProcess.stderr?.on('data', (data: Buffer) => {
        console.error('backend error:', data.toString());
      });

      backendProcess.on('error', (error: Error) => {
        console.error('failed to start backend:', error);
        if (!started) reject(error);
      });

      backendProcess.on('close', (code: number | null) => {
        console.log(`backend server closed with code ${code}`);
        if (!started) reject(new Error(`Backend exited with code ${code}`));
      });

      // fallback timeout
      setTimeout(() => {
        if (!started) {
          console.log('backend startup timeout, assuming it started');
          resolve();
        }
      }, 3000);

    } catch (error) {
      console.error('failed to spawn backend process:', error);
      reject(error);
    }
  });
}

function stopBackendServer(): void {
  if (backendProcess) {
    console.log('stopping backend server...');
    backendProcess.kill('SIGTERM');
    backendProcess = null;
  }
}

// app event handlers
app.on('window-all-closed', () => {
  stopBackendServer();
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  stopBackendServer();
});
