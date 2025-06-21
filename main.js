const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;

class EnvironmentManager {
  constructor() {
    this.mainWindow = null;
    this.envDir = path.join(app.getPath('userData'), 'environments');
    this.currentFolder = 'default'; // Default folder
  }

  
  createWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1000,
      height: 700,
      minWidth: 800,
      minHeight: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
        enableRemoteModule: false
      },
      icon: path.join(__dirname, 'assets', 'icon.png'),
      titleBarStyle: 'default',
      show: false
    });

    this.mainWindow.loadFile('index.html');
    
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow.show();
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    if (process.argv.includes('--dev')) {
      this.mainWindow.webContents.openDevTools();
    }
  }

  async initializeEnvDirectory() {
    try {
      await fs.access(this.envDir);
    } catch (error) {
      await fs.mkdir(this.envDir, { recursive: true });
    }
    
    await this.ensureFolderExists(this.currentFolder);
  }

  async ensureFolderExists(folderName) {
    const folderPath = path.join(this.envDir, folderName);
    try {
      await fs.access(folderPath);
    } catch (error) {
      await fs.mkdir(folderPath, { recursive: true });
    }
  }

  getCurrentEnvFilePath() {
    return path.join(this.envDir, this.currentFolder, 'env.json');
  }

  async readEnvFile() {
    try {
      const filePath = this.getCurrentEnvFilePath();
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return {};
      }
      console.error('Error reading env file:', error);
      throw new Error('Failed to read environment variables file');
    }
  }


  async writeEnvFile(data) {
    try {
      const filePath = this.getCurrentEnvFilePath();
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
      console.error('Error writing env file:', error);
      throw new Error('Failed to write environment variables file');
    }
  }

  async getFolders() {
    try {
      const items = await fs.readdir(this.envDir, { withFileTypes: true });
      const folders = items
        .filter(item => item.isDirectory())
        .map(item => item.name)
        .sort();
      
      return folders;
    } catch (error) {
      console.error('Error reading folders:', error);
      return ['default'];
    }
  }


  async createFolder(folderName) {
    try {
      if (!folderName || folderName.trim() === '') {
        throw new Error('Folder name cannot be empty');
      }

      const sanitizedName = folderName.trim().replace(/[<>:"/\\|?*]/g, '_');
      const folderPath = path.join(this.envDir, sanitizedName);
      
      await fs.mkdir(folderPath, { recursive: true });
      
      const envFilePath = path.join(folderPath, 'env.json');
      await fs.writeFile(envFilePath, '{}', 'utf8');
      
      return { success: true, folderName: sanitizedName };
    } catch (error) {
      return { error: error.message };
    }
  }


  async deleteFolder(folderName) {
    try {
      if (folderName === 'default') {
        throw new Error('Cannot delete the default folder');
      }

      const folderPath = path.join(this.envDir, folderName);
      
      try {
        await fs.access(folderPath);
      } catch (error) {
        throw new Error('Folder does not exist');
      }

      await fs.rm(folderPath, { recursive: true, force: true });
      
      if (this.currentFolder === folderName) {
        this.currentFolder = 'default';
      }
      
      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
  }


  async switchFolder(folderName) {
    try {
      const folderPath = path.join(this.envDir, folderName);
      
      try {
        await fs.access(folderPath);
      } catch (error) {
        throw new Error('Folder does not exist');
      }

      this.currentFolder = folderName;
      return { success: true, folderName };
    } catch (error) {
      return { error: error.message };
    }
  }


  parseEnvFile(content) {
    const envVars = {};
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue;
      }
      
      const equalIndex = trimmedLine.indexOf('=');
      if (equalIndex > 0) {
        const key = trimmedLine.substring(0, equalIndex).trim();
        let value = trimmedLine.substring(equalIndex + 1).trim();
        
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        
        if (key) {
          envVars[key] = value;
        }
      }
    }
    
    return envVars;
  }


  convertToEnvFormat(envVars) {
    const lines = [];
    
    for (const [key, value] of Object.entries(envVars)) { 
      let formattedValue = value;
      if (value.includes(' ') || value.includes('"') || value.includes("'") || value.includes('\\')) {
        formattedValue = `"${value.replace(/"/g, '\\"')}"`;
      }
      
      lines.push(`${key}=${formattedValue}`);
    }
    
    return lines.join('\n');
  }


  isEnvFileContent(content) {
    if (!content || typeof content !== 'string') {
      return false;
    }
    
    const lines = content.split('\n');
    let envLineCount = 0;
    let totalLines = 0;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue;
      }
      
      totalLines++;
      
      const equalIndex = trimmedLine.indexOf('=');
      if (equalIndex > 0) {
        const key = trimmedLine.substring(0, equalIndex).trim();
        if (key && /^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
          envLineCount++;
        }
      }
    }
    
    return totalLines > 0 && (envLineCount / totalLines) >= 0.5;
  }


  setupIpcHandlers() {
    ipcMain.handle('load-env-vars', async () => {
      try {
        return await this.readEnvFile();
      } catch (error) {
        return { error: error.message };
      }
    });

    ipcMain.handle('get-current-folder', async () => {
      return this.currentFolder;
    });

    ipcMain.handle('get-folders', async () => {
      try {
        return await this.getFolders();
      } catch (error) {
        return { error: error.message };
      }
    });

    ipcMain.handle('create-folder', async (event, folderName) => {
      try {
        return await this.createFolder(folderName);
      } catch (error) {
        return { error: error.message };
      }
    });

    ipcMain.handle('delete-folder', async (event, folderName) => {
      try {
        return await this.deleteFolder(folderName);
      } catch (error) {
        return { error: error.message };
      }
    });

    ipcMain.handle('switch-folder', async (event, folderName) => {
      try {
        return await this.switchFolder(folderName);
      } catch (error) {
        return { error: error.message };
      }
    });

    ipcMain.handle('save-env-var', async (event, key, value) => {
      try {
        if (!key || key.trim() === '') {
          throw new Error('Key cannot be empty');
        }

        const envVars = await this.readEnvFile();
        envVars[key.trim()] = value;
        await this.writeEnvFile(envVars);
        
        return { success: true, message: 'Environment variable saved successfully' };
      } catch (error) {
        return { error: error.message };
      }
    });


    ipcMain.handle('update-env-var', async (event, oldKey, newKey, newValue) => {
      try {
        if (!newKey || newKey.trim() === '') {
          throw new Error('Key cannot be empty');
        }

        const envVars = await this.readEnvFile();
        
        if (oldKey !== newKey) {
          delete envVars[oldKey];
          
          if (envVars.hasOwnProperty(newKey.trim())) {
            throw new Error('Key already exists');
          }
        }
        
        envVars[newKey.trim()] = newValue;
        await this.writeEnvFile(envVars);
        
        return { success: true, message: 'Environment variable updated successfully' };
      } catch (error) {
        return { error: error.message };
      }
    });


    ipcMain.handle('delete-env-var', async (event, key) => {
      try {
        const envVars = await this.readEnvFile();
        
        if (!envVars.hasOwnProperty(key)) {
          throw new Error('Environment variable not found');
        }
        
        delete envVars[key];
        await this.writeEnvFile(envVars);
        
        return { success: true, message: 'Environment variable deleted successfully' };
      } catch (error) {
        return { error: error.message };
      }
    });


    ipcMain.handle('export-env-vars', async (event, options = {}) => {
      try {
        const envVars = await this.readEnvFile();
        
        if (Object.keys(envVars).length === 0) {
          return { error: 'No environment variables to export' };
        }

        let filePath;
        
        if (options.directExport) {
          const defaultPath = path.join(app.getPath('downloads'), `${this.currentFolder}.env`);
          filePath = defaultPath;
        } else {
          const result = await dialog.showSaveDialog(this.mainWindow, {
            title: 'Export Environment Variables',
            defaultPath: `${this.currentFolder}.env`,
            filters: [
              { name: 'Environment Files', extensions: ['env'] },
              { name: 'JSON Files', extensions: ['json'] },
              { name: 'All Files', extensions: ['*'] }
            ]
          });

          if (result.canceled) {
            return { success: false, message: 'Export canceled' };
          }
          
          filePath = result.filePath;
        }
        
        if (filePath.endsWith('.env')) {
          const envContent = this.convertToEnvFormat(envVars);
          await fs.writeFile(filePath, envContent, 'utf8');
        } else {
          await fs.writeFile(filePath, JSON.stringify(envVars, null, 2), 'utf8');
        }
        
        return { 
          success: true, 
          message: 'Environment variables exported successfully',
          filePath: filePath
        };
      } catch (error) {
        return { error: error.message };
      }
    });


    ipcMain.handle('import-env-vars', async (event, options = {}) => {
      try {
        let filePath;
        
        if (options.directImport && options.filePath) {
          filePath = options.filePath;
        } else {
          const result = await dialog.showOpenDialog(this.mainWindow, {
            title: 'Import Environment Variables',
            filters: [
              { name: 'Environment Files', extensions: ['env'] },
              { name: 'JSON Files', extensions: ['json'] },
              { name: 'All Files', extensions: ['*'] }
            ],
            properties: ['openFile']
          });

          if (result.canceled || result.filePaths.length === 0) {
            return { success: false, message: 'Import canceled' };
          }
          
          filePath = result.filePaths[0];
        }

        const importData = await fs.readFile(filePath, 'utf8');
        let importedVars;
        
        if (filePath.endsWith('.env') || this.isEnvFileContent(importData)) {
          importedVars = this.parseEnvFile(importData);
        } else {
          try {
            importedVars = JSON.parse(importData);
          } catch (parseError) {
            importedVars = this.parseEnvFile(importData);
          }
        }
        
        if (typeof importedVars !== 'object' || importedVars === null) {
          throw new Error('Invalid file format');
        }

        const currentVars = await this.readEnvFile();
        const mergedVars = { ...currentVars, ...importedVars };
        await this.writeEnvFile(mergedVars);
        
        return { 
          success: true, 
          message: 'Environment variables imported successfully',
          importedCount: Object.keys(importedVars).length
        };
      } catch (error) {
        return { error: error.message };
      }
    });
  }


  async initialize() {
    await this.initializeEnvDirectory();
    this.setupIpcHandlers();
    this.createWindow();
  }
}

const envManager = new EnvironmentManager();


app.whenReady().then(() => {
  envManager.initialize();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      envManager.createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});


app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, url) => {
    event.preventDefault();
  });
});