const electron = require('electron');
const { app, BrowserWindow, ipcMain, dialog, shell } = electron;
const path = require('path');
const fs = require('fs');
const { simpleGit } = require('simple-git');
const chokidar = require('chokidar');

let mainWindow;
let currentRepoPath = null;
let fileWatcher = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 1024,
        minHeight: 768,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        backgroundColor: '#0d1117',
        show: false
    });

    mainWindow.loadFile('index.html');

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
        if (fileWatcher) {
            fileWatcher.close();
        }
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

function parseGitHubUrl(url) {
    const patterns = [
        /github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?\/?$/,
        /^([^\/]+)\/([^\/]+)$/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            return { owner: match[1], repo: match[2] };
        }
    }
    return null;
}

ipcMain.handle('parse-github-url', async (event, url) => {
    const parsed = parseGitHubUrl(url.trim());
    if (parsed) {
        return { success: true, owner: parsed.owner, repo: parsed.repo };
    }
    return { success: false, error: 'Invalid GitHub URL format' };
});

ipcMain.handle('select-clone-directory', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
        title: 'Select Clone Directory'
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
        return { success: true, path: result.filePaths[0] };
    }
    return { success: false, error: 'No directory selected' };
});

ipcMain.handle('clone-repository', async (event, { url, targetDir }) => {
    try {
        const parsed = parseGitHubUrl(url);
        if (!parsed) {
            return { success: false, error: 'Invalid GitHub URL' };
        }

        const repoPath = path.join(targetDir, parsed.repo);
        
        if (fs.existsSync(repoPath)) {
            currentRepoPath = repoPath;
            setupFileWatcher(repoPath);
            return { success: true, path: repoPath, exists: true };
        }

        const git = simpleGit();
        
        mainWindow.webContents.send('clone-progress', { status: 'Cloning repository...', progress: 0 });
        
        await git.clone(url, repoPath, ['--progress']);
        
        currentRepoPath = repoPath;
        setupFileWatcher(repoPath);
        
        return { success: true, path: repoPath };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

function setupFileWatcher(repoPath) {
    if (fileWatcher) {
        fileWatcher.close();
    }
    
    fileWatcher = chokidar.watch(repoPath, {
        ignored: /(^|[\/\\])\../,
        persistent: true,
        ignoreInitial: true
    });
    
    fileWatcher.on('all', (event, filePath) => {
        if (mainWindow) {
            mainWindow.webContents.send('file-changed', { event, path: filePath });
        }
    });
}

ipcMain.handle('get-file-structure', async (event, repoPath) => {
    try {
        const result = await getDirectoryTree(repoPath);
        return { success: true, structure: result };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

async function getDirectoryTree(dirPath, relativePath = '') {
    const items = fs.readdirSync(dirPath);
    const tree = [];
    
    for (const item of items) {
        if (item.startsWith('.') && item !== '.git') continue;
        
        const fullPath = path.join(dirPath, item);
        const relPath = path.join(relativePath, item);
        const stats = fs.statSync(fullPath);
        
        if (stats.isDirectory()) {
            tree.push({
                name: item,
                type: 'directory',
                path: relPath,
                children: await getDirectoryTree(fullPath, relPath)
            });
        } else {
            tree.push({
                name: item,
                type: 'file',
                path: relPath,
                extension: path.extname(item).slice(1)
            });
        }
    }
    
    return tree.sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'directory' ? -1 : 1;
    });
}

ipcMain.handle('read-file', async (event, { repoPath, filePath }) => {
    try {
        const fullPath = path.join(repoPath, filePath);
        const content = fs.readFileSync(fullPath, 'utf-8');
        return { success: true, content };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('write-file', async (event, { repoPath, filePath, content }) => {
    try {
        const fullPath = path.join(repoPath, filePath);
        const dir = path.dirname(fullPath);
        
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(fullPath, content, 'utf-8');
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('delete-file', async (event, { repoPath, filePath }) => {
    try {
        const fullPath = path.join(repoPath, filePath);
        
        if (fs.statSync(fullPath).isDirectory()) {
            fs.rmdirSync(fullPath, { recursive: true });
        } else {
            fs.unlinkSync(fullPath);
        }
        
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('create-file', async (event, { repoPath, filePath, content = '' }) => {
    try {
        const fullPath = path.join(repoPath, filePath);
        const dir = path.dirname(fullPath);
        
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(fullPath, content, 'utf-8');
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('git-status', async (event, repoPath) => {
    try {
        const git = simpleGit(repoPath);
        const status = await git.status();
        return { success: true, status };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('git-commit', async (event, { repoPath, message }) => {
    try {
        const git = simpleGit(repoPath);
        await git.add('.');
        const result = await git.commit(message);
        return { success: true, result };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('get-repo-info', async (event, repoPath) => {
    try {
        const git = simpleGit(repoPath);
        const remotes = await git.getRemotes(true);
        const branch = await git.branch();
        
        return {
            success: true,
            info: {
                currentBranch: branch.current,
                remotes: remotes,
                path: repoPath
            }
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('get-current-repo', () => {
    return currentRepoPath;
});

ipcMain.handle('open-external', async (event, url) => {
    await shell.openExternal(url);
});

ipcMain.handle('show-item-in-folder', async (event, fullPath) => {
    shell.showItemInFolder(fullPath);
});

ipcMain.handle('search-files', async (event, { repoPath, query }) => {
    try {
        const results = await searchInFiles(repoPath, query);
        return { success: true, results };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

async function searchInFiles(dirPath, query, results = []) {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
        if (item.startsWith('.') && item !== '.git') continue;
        
        const fullPath = path.join(dirPath, item);
        const stats = fs.statSync(fullPath);
        
        if (stats.isDirectory() && item !== 'node_modules' && item !== '.git') {
            await searchInFiles(fullPath, query, results);
        } else if (stats.isFile()) {
            try {
                const content = fs.readFileSync(fullPath, 'utf-8');
                const lines = content.split('\n');
                
                lines.forEach((line, index) => {
                    if (line.toLowerCase().includes(query.toLowerCase())) {
                        results.push({
                            file: path.relative(dirPath, fullPath),
                            line: index + 1,
                            content: line.trim()
                        });
                    }
                });
            } catch (e) {
                // Skip binary files
            }
        }
    }
    
    return results;
}