// Main Application Orchestrator
document.addEventListener('DOMContentLoaded', () => {
  const galaxy = new GalaxyEngine('galaxy-container');
  const punchcard = new PunchcardChart('punchcard-container');
  const constellation = new ConstellationGraph('constellation-container');
  const shareModal = new ShareModal();
  const downloader = new SubdirectoryDownloader();

  let currentRepoFullName = 'facebook/react';
  let currentRepoData = null;

  // App View Toggle (Inspector vs Downloader)
  const inspectorView = document.getElementById('inspector-view');
  const downloaderView = document.getElementById('downloader-view');

  document.querySelectorAll('[data-app-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-app-view]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const view = btn.getAttribute('data-app-view');

      if (view === 'downloader') {
        inspectorView.classList.add('hidden');
        downloaderView.classList.remove('hidden');
        const [owner, repo] = currentRepoFullName.split('/');
        downloader.loadRepoTree(owner, repo, currentRepoData ? currentRepoData.default_branch : 'main');
      } else {
        downloaderView.classList.add('hidden');
        inspectorView.classList.remove('hidden');
        galaxy.onResize();
      }
    });
  });

  const searchForm = document.getElementById('search-form');
  const repoInput = document.getElementById('repo-input');
  const repoHeading = document.getElementById('repo-heading');
  const languageLegend = document.getElementById('language-legend');
  const toggleRotationBtn = document.getElementById('toggle-rotation-btn');
  const resetCamBtn = document.getElementById('reset-cam-btn');

  // Mode buttons
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = btn.getAttribute('data-mode');
      galaxy.setMode(mode);
    });
  });

  // Metrics elements
  const metricStars = document.getElementById('metric-stars');
  const metricForks = document.getElementById('metric-forks');
  const metricIssues = document.getElementById('metric-issues');
  const metricLicense = document.getElementById('metric-license');
  const metricSize = document.getElementById('metric-size');
  const metricBranch = document.getElementById('metric-branch');
  const metricCreated = document.getElementById('metric-created');
  const metricPushed = document.getElementById('metric-pushed');

  // Token Modal
  const tokenModal = document.getElementById('token-modal');
  const tokenBtn = document.getElementById('token-btn');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const patInput = document.getElementById('pat-input');
  const saveTokenBtn = document.getElementById('save-token-btn');
  const clearTokenBtn = document.getElementById('clear-token-btn');
  const shareBtn = document.getElementById('share-btn');

  shareBtn.addEventListener('click', () => {
    const [owner, repo] = currentRepoFullName.split('/');
    if (owner && repo) {
      shareModal.open(owner, repo);
    }
  });

  // Galaxy Controls
  toggleRotationBtn.addEventListener('click', () => {
    const active = galaxy.toggleRotation();
    toggleRotationBtn.classList.toggle('active', active);
  });

  resetCamBtn.addEventListener('click', () => {
    galaxy.resetCamera();
  });

  // Token Modal Logic
  tokenBtn.addEventListener('click', () => {
    patInput.value = API.getToken();
    tokenModal.classList.remove('hidden');
  });

  closeModalBtn.addEventListener('click', () => {
    tokenModal.classList.add('hidden');
  });

  saveTokenBtn.addEventListener('click', () => {
    API.setToken(patInput.value);
    tokenModal.classList.add('hidden');
  });

  clearTokenBtn.addEventListener('click', () => {
    API.setToken('');
    patInput.value = '';
    tokenModal.classList.add('hidden');
  });

  // Form Submission
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = repoInput.value.trim();
    if (query) {
      loadRepository(query);
    }
  });

  function parseRepoInput(raw) {
    if (!raw) return null;
    let cleaned = raw.trim();
    // Remove protocol and domain if full URL is pasted
    cleaned = cleaned.replace(/^https?:\/\/(www\.)?github\.com\//i, '');
    // Remove trailing .git and slashes
    cleaned = cleaned.replace(/\.git$/i, '').replace(/^\/+|\/+$/g, '');
    const parts = cleaned.split('/').map(p => p.trim());
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return { owner: parts[0], repo: parts[1] };
    }
    return null;
  }

  async function loadRepository(repoFullName) {
    const parsed = parseRepoInput(repoFullName);
    if (!parsed) {
      alert('Please enter a valid repository format, e.g. "owner/repo" or "https://github.com/owner/repo"');
      return;
    }

    const { owner, repo } = parsed;
    currentRepoFullName = `${owner}/${repo}`;
    repoHeading.textContent = `${owner} / ${repo}`;

    try {
      // 1. Fetch Repository Overview
      const repoData = await API.getRepo(owner, repo);
      currentRepoData = repoData;
      metricStars.textContent = Number(repoData.stargazers_count).toLocaleString();
      metricForks.textContent = Number(repoData.forks_count).toLocaleString();
      metricIssues.textContent = Number(repoData.open_issues_count).toLocaleString();
      metricLicense.textContent = repoData.license ? (repoData.license.spdx_id || repoData.license.name) : 'None';
      metricSize.textContent = repoData.size > 1024 ? `${(repoData.size / 1024).toFixed(1)} MB` : `${repoData.size} KB`;
      metricBranch.textContent = repoData.default_branch || 'main';
      metricCreated.textContent = new Date(repoData.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
      
      const pushedDate = new Date(repoData.pushed_at);
      const diffDays = Math.floor((new Date() - pushedDate) / (1000 * 60 * 60 * 24));
      metricPushed.textContent = diffDays === 0 ? 'Today' : `${diffDays}d ago`;

      // 2. Fetch Languages & Render Galaxy
      const languagesData = await API.getLanguages(owner, repo);
      galaxy.buildGalaxy(languagesData);
      renderLanguageLegend(languagesData);

      // 3. Fetch Punchcard
      try {
        const punchData = await API.getPunchCard(owner, repo);
        punchcard.render(punchData);
      } catch (err) {
        console.warn('Punchcard error:', err);
      }

      // 4. Fetch Contributors
      try {
        const contribData = await API.getContributors(owner, repo);
        constellation.render(contribData);
      } catch (err) {
        console.warn('Contributors error:', err);
      }

      // 5. Fetch Recent Commits
      try {
        const commits = await API.getRecentCommits(owner, repo);
        renderRecentCommits(commits);
      } catch (err) {
        console.warn('Commits error:', err);
      }

    } catch (err) {
      console.warn('Repository inspection error:', err.message);
    }
  }

  function renderLanguageLegend(languagesData) {
    languageLegend.innerHTML = '';
    const totalBytes = Object.values(languagesData).reduce((a, b) => a + b, 0);
    if (totalBytes === 0) return;

    Object.entries(languagesData).forEach(([lang, bytes]) => {
      const pct = ((bytes / totalBytes) * 100).toFixed(1);
      const color = getLanguageColor(lang);

      const chip = document.createElement('div');
      chip.className = 'lang-chip';
      chip.style.display = 'inline-flex';
      chip.style.alignItems = 'center';
      chip.style.gap = '6px';
      chip.style.fontSize = '12px';
      chip.style.padding = '2px 8px';
      chip.style.borderRadius = '12px';
      chip.style.background = '#21262d';
      chip.style.border = '1px solid #30363d';
      chip.style.color = '#f0f6fc';

      const dot = document.createElement('span');
      dot.style.width = '8px';
      dot.style.height = '8px';
      dot.style.borderRadius = '50%';
      dot.style.backgroundColor = color;

      chip.appendChild(dot);
      chip.appendChild(document.createTextNode(`${lang} ${pct}%`));
      languageLegend.appendChild(chip);
    });
  }

  function renderRecentCommits(commits) {
    const container = document.getElementById('commits-container');
    if (!container) return;
    container.innerHTML = '';

    if (!Array.isArray(commits) || commits.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>No recent commits found.</p></div>';
      return;
    }

    commits.forEach(c => {
      const item = document.createElement('a');
      item.className = 'commit-item';
      item.href = c.html_url;
      item.target = '_blank';
      item.rel = 'noopener noreferrer';

      const avatarUrl = c.author ? c.author.avatar_url : 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png';
      const shortSha = c.sha.substring(0, 7);
      const msg = c.commit.message.split('\n')[0];
      const date = new Date(c.commit.author.date);
      const diffHours = Math.round((new Date() - date) / (1000 * 60 * 60));
      const timeStr = diffHours < 24 ? `${diffHours}h ago` : `${Math.round(diffHours / 24)}d ago`;

      item.innerHTML = `
        <div class="commit-left">
          <img class="commit-avatar" src="${avatarUrl}" alt="author avatar" />
          <span class="commit-msg">${msg}</span>
        </div>
        <div class="commit-meta">
          <span class="commit-sha">${shortSha}</span>
          <span class="commit-time">${timeStr}</span>
        </div>
      `;
      container.appendChild(item);
    });
  }

  // Keyboard ergonomics
  document.addEventListener('keydown', (e) => {
    // Press '/' to jump to search bar
    if (e.key === '/' && document.activeElement !== repoInput && document.activeElement !== patInput) {
      e.preventDefault();
      repoInput.focus();
      repoInput.select();
    }
    // Press 'Escape' to dismiss any modal
    if (e.key === 'Escape') {
      tokenModal.classList.add('hidden');
      const shareModalEl = document.getElementById('share-modal');
      if (shareModalEl) shareModalEl.classList.add('hidden');
    }
    // Press 'Space' to toggle 3D rotation (when not typing in an input)
    if (e.code === 'Space' && document.activeElement !== repoInput && document.activeElement !== patInput) {
      e.preventDefault();
      const active = galaxy.toggleRotation();
      toggleRotationBtn.classList.toggle('active', active);
    }
    // Press 'r' or 'R' to reset 3D camera
    if ((e.key === 'r' || e.key === 'R') && document.activeElement !== repoInput && document.activeElement !== patInput) {
      galaxy.resetCamera();
    }
  });

  // Clear search input on initial load so placeholder/hinttext is clearly visible
  repoInput.value = '';

  // Load repository from URL param if present, otherwise default to user's GitPulse repo
  const urlParams = new URLSearchParams(window.location.search);
  const initialRepo = urlParams.get('repo') || 'Vivek-k001/GitPulse';
  loadRepository(initialRepo);
});
