// Main Application Orchestrator
document.addEventListener('DOMContentLoaded', () => {
  const galaxy = new GalaxyEngine('galaxy-container');
  const punchcard = new PunchcardChart('punchcard-container');
  const constellation = new ConstellationGraph('constellation-container');

  const searchForm = document.getElementById('search-form');
  const repoInput = document.getElementById('repo-input');
  const repoHeading = document.getElementById('repo-heading');
  const languageLegend = document.getElementById('language-legend');
  const toggleRotationBtn = document.getElementById('toggle-rotation-btn');
  const resetCamBtn = document.getElementById('reset-cam-btn');

  // Metrics elements
  const metricStars = document.getElementById('metric-stars');
  const metricForks = document.getElementById('metric-forks');
  const metricIssues = document.getElementById('metric-issues');
  const metricLicense = document.getElementById('metric-license');

  // Token Modal
  const tokenModal = document.getElementById('token-modal');
  const tokenBtn = document.getElementById('token-btn');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const patInput = document.getElementById('pat-input');
  const saveTokenBtn = document.getElementById('save-token-btn');
  const clearTokenBtn = document.getElementById('clear-token-btn');

  // Preset chips
  document.querySelectorAll('.preset-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const repo = btn.getAttribute('data-repo');
      if (repo) {
        repoInput.value = repo;
        loadRepository(repo);
      }
    });
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

  async function loadRepository(repoFullName) {
    const parts = repoFullName.split('/').map(p => p.trim());
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      alert('Please enter a valid repository format: owner/repository');
      return;
    }

    const [owner, repo] = parts;
    repoHeading.textContent = `${owner} / ${repo}`;

    try {
      // 1. Fetch Repository Overview
      const repoData = await API.getRepo(owner, repo);
      metricStars.textContent = Number(repoData.stargazers_count).toLocaleString();
      metricForks.textContent = Number(repoData.forks_count).toLocaleString();
      metricIssues.textContent = Number(repoData.open_issues_count).toLocaleString();
      metricLicense.textContent = repoData.license ? repoData.license.spdx_id || repoData.license.name : 'None';

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

    } catch (err) {
      alert(err.message || 'Error loading repository data.');
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

  // Load default repository
  loadRepository('facebook/react');
});
