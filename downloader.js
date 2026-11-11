// Sparse Subdirectory Downloader Engine (Browser Zip without Git Clone)
class SubdirectoryDownloader {
  constructor() {
    this.container = document.getElementById('tree-container');
    this.breadcrumb = document.getElementById('tree-breadcrumb');
    this.downloadBtn = document.getElementById('download-zip-btn');
    this.statusEl = document.getElementById('downloader-status');
    this.currentOwner = '';
    this.currentRepo = '';
    this.currentBranch = 'main';
    this.treeData = [];
    this.selectedPath = ''; // '' means root

    this.initEvents();
  }

  initEvents() {
    this.downloadBtn.addEventListener('click', () => {
      this.downloadSelectedFolder();
    });
  }

  async loadRepoTree(owner, repo, defaultBranch = 'main') {
    this.currentOwner = owner;
    this.currentRepo = repo;
    this.currentBranch = defaultBranch;
    this.selectedPath = '';
    this.downloadBtn.disabled = true;

    this.container.innerHTML = '<div class="empty-state"><p>Indexing repository tree...</p></div>';
    this.statusEl.textContent = `Fetching file tree for ${owner}/${repo}...`;

    try {
      let res = null;
      try {
        res = await API.getTree(owner, repo, defaultBranch);
      } catch (err) {
        // Fallback to master if main branch fails
        res = await API.getTree(owner, repo, 'master');
        this.currentBranch = 'master';
      }

      if (!res.tree || res.tree.length === 0) {
        this.container.innerHTML = '<div class="empty-state"><p>Empty repository or tree unavailable.</p></div>';
        return;
      }

      this.treeData = res.tree;
      this.renderCurrentView();
      this.statusEl.textContent = `Repository tree indexed (${this.treeData.length} items). Click a folder to select and download.`;
    } catch (err) {
      this.container.innerHTML = `<div class="empty-state"><p>Failed to load file tree: ${err.message}</p></div>`;
      this.statusEl.textContent = `Error: ${err.message}`;
    }
  }

  renderBreadcrumb() {
    this.breadcrumb.innerHTML = '';
    const rootSpan = document.createElement('span');
    rootSpan.className = `crumb-item ${this.selectedPath === '' ? 'active' : ''}`;
    rootSpan.textContent = `${this.currentRepo} (root)`;
    rootSpan.addEventListener('click', () => {
      this.selectedPath = '';
      this.renderCurrentView();
    });
    this.breadcrumb.appendChild(rootSpan);

    if (this.selectedPath) {
      const parts = this.selectedPath.split('/');
      let accumulated = '';
      parts.forEach((p, idx) => {
        const sep = document.createElement('span');
        sep.className = 'crumb-sep';
        sep.textContent = '/';
        this.breadcrumb.appendChild(sep);

        accumulated = accumulated ? `${accumulated}/${p}` : p;
        const currentAccumulated = accumulated;
        const item = document.createElement('span');
        item.className = `crumb-item ${idx === parts.length - 1 ? 'active' : ''}`;
        item.textContent = p;
        item.addEventListener('click', () => {
          this.selectedPath = currentAccumulated;
          this.renderCurrentView();
        });
        this.breadcrumb.appendChild(item);
      });
    }
  }

  renderCurrentView() {
    this.renderBreadcrumb();
    this.container.innerHTML = '';

    const prefix = this.selectedPath ? `${this.selectedPath}/` : '';
    const directChildren = [];
    const seen = new Set();

    this.treeData.forEach(item => {
      if (prefix === '' || item.path.startsWith(prefix)) {
        const relative = prefix ? item.path.slice(prefix.length) : item.path;
        const parts = relative.split('/');
        const immediate = parts[0];

        if (!seen.has(immediate)) {
          seen.add(immediate);
          const isDir = parts.length > 1 || item.type === 'tree';
          directChildren.push({
            name: immediate,
            path: prefix ? `${prefix}${immediate}` : immediate,
            isDir: isDir
          });
        }
      }
    });

    if (directChildren.length === 0) {
      this.container.innerHTML = '<div class="empty-state"><p>Folder is empty.</p></div>';
      return;
    }

    // Sort folders first, then files
    directChildren.sort((a, b) => {
      if (a.isDir === b.isDir) return a.name.localeCompare(b.name);
      return a.isDir ? -1 : 1;
    });

    const list = document.createElement('div');
    list.className = 'tree-file-list';

    directChildren.forEach(child => {
      const row = document.createElement('div');
      row.className = `tree-row ${child.isDir ? 'is-folder' : 'is-file'}`;

      const icon = child.isDir ? '📁' : '📄';
      row.innerHTML = `
        <span class="tree-icon">${icon}</span>
        <span class="tree-name">${child.name}</span>
      `;

      if (child.isDir) {
        row.addEventListener('click', () => {
          this.selectedPath = child.path;
          this.renderCurrentView();
        });
      }

      list.appendChild(row);
    });

    this.container.appendChild(list);

    // Update download button
    const folderName = this.selectedPath ? this.selectedPath.split('/').pop() : this.currentRepo;
    this.downloadBtn.textContent = `Download "${folderName}" as .zip`;
    this.downloadBtn.disabled = false;
  }

  async downloadSelectedFolder() {
    if (!window.JSZip) {
      alert('JSZip library failed to load.');
      return;
    }

    const prefix = this.selectedPath ? `${this.selectedPath}/` : '';
    const targetFiles = this.treeData.filter(item => {
      return item.type === 'blob' && (prefix === '' || item.path.startsWith(prefix));
    });

    if (targetFiles.length === 0) {
      alert('No files found inside the selected folder.');
      return;
    }

    if (targetFiles.length > 250) {
      const proceed = confirm(`This directory contains ${targetFiles.length} files. Downloading many files may take a minute and consume API quota. Proceed?`);
      if (!proceed) return;
    }

    const zip = new JSZip();
    this.downloadBtn.disabled = true;
    let completed = 0;

    for (const file of targetFiles) {
      completed++;
      this.statusEl.textContent = `Downloading (${completed}/${targetFiles.length}): ${file.path}...`;
      try {
        const content = await API.getRawFile(this.currentOwner, this.currentRepo, this.currentBranch, file.path);
        const relativeInZip = prefix ? file.path.slice(prefix.length) : file.path;
        zip.file(relativeInZip, content);
      } catch (err) {
        console.warn(`Skipped ${file.path}:`, err);
      }
    }

    this.statusEl.textContent = 'Compressing files into .zip archive...';
    const blob = await zip.generateAsync({ type: 'blob' });

    // Trigger download
    const folderName = this.selectedPath ? this.selectedPath.split('/').pop() : this.currentRepo;
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `${folderName}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);

    this.statusEl.textContent = `Downloaded "${folderName}.zip" (${targetFiles.length} files).`;
    this.downloadBtn.disabled = false;
  }
}

window.SubdirectoryDownloader = SubdirectoryDownloader;

