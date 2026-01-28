import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import pkg from 'electron-updater';
const { autoUpdater } = pkg;
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import si from 'systeminformation';
import DiscordRPC from 'discord-rpc';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Considerar status do app empacotado ao invés de NODE_ENV para evitar tela em branco no dev quando NODE_ENV não estiver definido
const isDev = !app.isPackaged;

let mainWindow;
// Checar atualizações ao iniciar
function setupAutoUpdater() {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', () => {
    if (mainWindow) {
      mainWindow.webContents.send('update-available');
    }
  });
  autoUpdater.on('update-downloaded', () => {
    if (mainWindow) {
      mainWindow.webContents.send('update-downloaded');
    }
  });
  autoUpdater.on('error', (err) => {
    if (mainWindow) {
      mainWindow.webContents.send('update-error', err.message || String(err));
    }
  });
}
let discordClient = null;

// Discord Application ID (você precisa criar um app em https://discord.com/developers/applications)
const DISCORD_CLIENT_ID = '1458884424765800632'; // Substitua pelo seu Client ID real

// Inicializar Discord RPC
function initializeDiscordRPC() {
  if (discordClient) return;

  try {
    discordClient = new DiscordRPC.Client({ transport: 'ipc' });

    discordClient.on('ready', () => {
      console.log('[Discord] RPC connected as', discordClient.user.username);
      
      // Definir presença inicial
      setDiscordActivity({
        state: 'No Dashboard',
        details: 'Byte Latency - PC Optimizer',
        largeImageKey: 'bytelatency_logo',
        largeImageText: 'ByteLatency',
        startTimestamp: Date.now()
      });
    });

    discordClient.on('error', (error) => {
      console.error('[Discord] RPC error:', error);
    });

    discordClient.login({ clientId: DISCORD_CLIENT_ID }).catch((error) => {
      console.error('[Discord] Failed to login:', error);
      discordClient = null;
    });
  } catch (error) {
    console.error('[Discord] Failed to initialize RPC:', error);
    discordClient = null;
  }
}

// Definir atividade do Discord
function setDiscordActivity(activity) {
  if (!discordClient || !discordClient.user) {
    console.warn('[Discord] Client not ready');
    return;
  }

  try {
    const activityData = {
      state: activity.state || 'Navegando',
      details: activity.details || 'ByteLatency - PC Optimizer',
      startTimestamp: activity.startTimestamp || Date.now(),
      largeImageKey: activity.largeImageKey || 'bytelatency_logo',
      largeImageText: activity.largeImageText || 'ByteLatency',
      instance: false,
    };

    if (activity.smallImageKey) {
      activityData.smallImageKey = activity.smallImageKey;
      activityData.smallImageText = activity.smallImageText || '';
    }

    discordClient.setActivity(activityData);
  } catch (error) {
    console.error('[Discord] Failed to set activity:', error);
  }
}

// Limpar atividade do Discord
function clearDiscordActivity() {
  if (!discordClient) return;
  
  try {
    discordClient.clearActivity();
  } catch (error) {
    console.error('[Discord] Failed to clear activity:', error);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    frame: true,
    titleBarStyle: 'default',
    // Usar icon.ico que existe na pasta public
    icon: path.join(__dirname, '../public/icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.cjs')
    },
    backgroundColor: '#0a0a0a',
    show: false
  });

  // Carregar o aplicativo
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // NÃO abrir DevTools automaticamente para economizar recursos
    // mainWindow.webContents.openDevTools();
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html');
    console.log('[Electron] Loading from:', indexPath);
    mainWindow.loadFile(indexPath).catch(err => {
      console.error('[Electron] Error loading file:', err);
      mainWindow.loadURL(`file://${path.join(__dirname, '../dist/index.html')}`);
    });
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('close', () => {
    // Limpar Discord quando a janela fechar
    if (discordClient) {
      try {
        console.log('[Discord] Cleaning up on window close...');
        discordClient.clearActivity();
      } catch (error) {
        console.error('[Discord] Cleanup error on close:', error);
      }
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Logs de debug
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[Electron] Page loaded successfully');
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('[Electron] Failed to load:', errorCode, errorDescription);
  });
}

app.whenReady().then(() => {
  // Remover menu padrão do Electron
  Menu.setApplicationMenu(null);

  // Inicializar Discord RPC
  initializeDiscordRPC();

  createWindow();

  // Setup autoUpdater
  setupAutoUpdater();
  autoUpdater.checkForUpdatesAndNotify();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Limpar Discord RPC
  if (discordClient) {
    try {
      console.log('[Discord] Destroying RPC client...');
      discordClient.clearActivity();
      discordClient.destroy();
      discordClient = null;
    } catch (error) {
      console.error('[Discord] Failed to destroy client:', error);
    }
  }
  
  // Sempre sair no Windows
  app.quit();
});

// Lidar com saída do aplicativo
app.on('before-quit', () => {
  if (discordClient) {
    try {
      console.log('[Discord] Cleaning up before quit...');
      discordClient.clearActivity();
      discordClient.destroy();
      discordClient = null;
    } catch (error) {
      console.error('[Discord] Cleanup error:', error);
    }
  }
});

// Lidar com mensagens IPC se necessário
ipcMain.on('minimize-window', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('maximize-window', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('close-window', () => {
  if (mainWindow) mainWindow.close();
});

// Handlers do Discord RPC
ipcMain.on('set-discord-activity', (event, activity) => {
  setDiscordActivity(activity);
});

ipcMain.on('clear-discord-activity', () => {
  clearDiscordActivity();
});

// Obter métricas do sistema
ipcMain.handle('get-system-metrics', async () => {
  try {
    const [cpuData, memData, diskData, processData, cpuTemp, networkStats] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.fsSize(),
      si.processes(),
      si.cpuTemperature(),
      si.networkStats()
    ]);

    const cpuUsage = Math.round(cpuData.currentLoad || 0);
    const cpuCores = cpuData.cpus?.length || 0;
    const temperature = Math.round(cpuTemp.main || 0);

    const memTotal = memData.total;
    const memUsed = memData.used;
    const memFree = memData.free;
    const memUsagePercent = Math.round((memUsed / memTotal) * 100);

    const mainDisk = diskData[0] || { size: 0, used: 0, available: 0 };
    const diskTotal = mainDisk.size;
    const diskUsed = mainDisk.used;
    const diskFree = mainDisk.available;
    const diskUsagePercent = Math.round((diskUsed / diskTotal) * 100);

    const processAll = await getProcessCountExact(processData.all);
    const processRunning = processData.running || 0;
    const processBlocked = processData.blocked || 0;

    const netRx = networkStats[0]?.rx_sec || 0;
    const netTx = networkStats[0]?.tx_sec || 0;

    // Calcular score de otimização (100 = perfeito, 0 = precisa otimizar urgentemente)
    let score = 100;
    
    // CPU: penalizar uso alto (peso: 25%)
    let cpuScore = 100;
    if (cpuUsage < 30) {
      cpuScore = 100; // Uso baixo = excelente
    } else if (cpuUsage < 50) {
      cpuScore = 100 - ((cpuUsage - 30) / 20) * 20; // 30-50% = bom
    } else if (cpuUsage < 70) {
      cpuScore = 80 - ((cpuUsage - 50) / 20) * 30; // 50-70% = regular
    } else {
      cpuScore = Math.max(0, 50 - ((cpuUsage - 70) / 30) * 50); // 70-100% = ruim
    }
    score -= (100 - cpuScore) * 0.25;

    // RAM: penalizar uso alto (peso: 30%)
    let memScore = 100;
    if (memUsagePercent < 40) {
      memScore = 100; // Uso muito baixo = excelente
    } else if (memUsagePercent < 60) {
      memScore = 100 - ((memUsagePercent - 40) / 20) * 20; // 40-60% = bom (100-80)
    } else if (memUsagePercent < 80) {
      memScore = 80 - ((memUsagePercent - 60) / 20) * 30; // 60-80% = regular (80-50)
    } else {
      memScore = Math.max(0, 50 - ((memUsagePercent - 80) / 20) * 50); // 80-100% = ruim (50-0)
    }
    score -= (100 - memScore) * 0.30;

    // Disco: penalizar uso alto (peso: 10%)
    let diskScore = 100;
    if (diskUsagePercent < 60) {
      diskScore = 100; // Disco com espaço = bom
    } else if (diskUsagePercent < 80) {
      diskScore = 100 - ((diskUsagePercent - 60) / 20) * 30; // 60-80% = regular
    } else {
      diskScore = Math.max(0, 70 - ((diskUsagePercent - 80) / 20) * 70); // 80-100% = ruim
    }
    score -= (100 - diskScore) * 0.10;

    // Processos: penalizar muitos processos (peso: 35%)
    let processScore = 100;
    if (processAll < 50) {
      processScore = 100; // Poucos processos = excelente
    } else if (processAll < 100) {
      processScore = 100 - ((processAll - 50) / 50) * 20; // 50-100 = bom (100-80)
    } else if (processAll < 150) {
      processScore = 80 - ((processAll - 100) / 50) * 30; // 100-150 = regular (80-50)
    } else {
      processScore = Math.max(0, 50 - ((processAll - 150) / 150) * 50); // 150+ = ruim (50-0)
    }
    score -= (100 - processScore) * 0.35;

    const optimizationScore = Math.round(Math.max(0, Math.min(100, score)));

    return {
      cpu: { usage: cpuUsage, temperature, cores: cpuCores },
      memory: { total: memTotal, used: memUsed, free: memFree, usagePercent: memUsagePercent },
      disk: { total: diskTotal, used: diskUsed, free: diskFree, usagePercent: diskUsagePercent },
      processes: { all: processAll, running: processRunning, blocked: processBlocked },
      network: { upload: netTx, download: netRx },
      optimizationScore
    };
  } catch (error) {
    console.error('Error getting system metrics:', error);
    return null;
  }
});

// Contagem de processos usando tasklist para alinhar com o que o usuário vê no Windows
async function getProcessCountExact(defaultCount = 0) {
  try {
    if (process.platform !== 'win32') return defaultCount || 0;

    const { stdout } = await execAsync('tasklist /FO CSV /NH');
    // Cada linha representa um processo; remover linhas vazias
    const lines = stdout
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);
    
    // Contar todos os processos (igual ao Task Manager do Windows)
    return lines.length || defaultCount || 0;
  } catch (error) {
    console.error('[Metrics] tasklist count failed, falling back to systeminformation:', error);
    return defaultCount || 0;
  }
}

// Executar comando com privilégios de administrador
ipcMain.handle('execute-command', async (event, command, asAdmin) => {
  try {
    let fullCommand = command;
    
    if (asAdmin && process.platform === 'win32') {
      // Executar comando com privilégios de administrador
      fullCommand = `powershell -Command "Start-Process -FilePath 'cmd.exe' -ArgumentList '/c','${command.replace(/"/g, '""')}' -Verb RunAs -WindowStyle Hidden -Wait"`;
    } else if (process.platform === 'win32') {
      fullCommand = `cmd.exe /c "${command}"`;
    }
    
    const { stdout, stderr } = await execAsync(fullCommand);
    
    if (stderr && !stderr.includes('WARNING')) {
      console.error('Command stderr:', stderr);
    }
    
    return { success: true, output: stdout, error: stderr };
  } catch (error) {
    console.error('Error executing command:', error);
    return { success: false, error: error.message };
  }
});

// Handler para download de arquivo
ipcMain.handle('download-file', async (event, options) => {
  const fs = require('fs').promises;
  const path = require('path');
  const https = require('https');
  
  try {
    const { url, path: filePath, onProgress } = options;
    
    // Criar diretório se não existir
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    
    return new Promise((resolve, reject) => {
      https.get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Download failed with status ${response.statusCode}`));
          return;
        }
        
        const totalSize = parseInt(response.headers['content-length'], 10);
        let downloadedSize = 0;
        const chunks = [];
        
        response.on('data', (chunk) => {
          chunks.push(chunk);
          downloadedSize += chunk.length;
          
          if (onProgress && totalSize) {
            const percentage = (downloadedSize / totalSize) * 100;
            event.sender?.send('download-progress', {
              fileName: path.basename(filePath),
              downloaded: downloadedSize,
              total: totalSize,
              percentage
            });
          }
        });
        
        response.on('end', async () => {
          try {
            const buffer = Buffer.concat(chunks);
            await fs.writeFile(filePath, buffer);
            resolve({ success: true, path: filePath });
          } catch (error) {
            reject(error);
          }
        });
      }).on('error', reject);
    });
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
});

// Handler para verificar se arquivo existe
ipcMain.handle('file-exists', async (event, filePath) => {
  const fs = require('fs');
  try {
    await fs.promises.access(filePath);
    return true;
  } catch {
    return false;
  }
});

// Handler para obter caminho da app
ipcMain.handle('get-app-path', (event) => {
  return app.getPath('userData');
});

