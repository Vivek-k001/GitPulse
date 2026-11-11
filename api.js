// GitHub REST API Client with token caching & rate limit tracking
const API = {
  baseUrl: 'https://api.github.com',

  getToken() {
    return localStorage.getItem('gitpulse_pat') || '';
  },

  setToken(token) {
    if (token) {
      localStorage.setItem('gitpulse_pat', token.trim());
    } else {
      localStorage.removeItem('gitpulse_pat');
    }
  },

  getHeaders() {
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'GitPulse-Dashboard'
    };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `token ${token}`;
    }
    return headers;
  },

  resetTimestamp: null,
  timerInterval: null,

  updateRateLimit(headers) {
    const remaining = headers.get('x-ratelimit-remaining');
    const limit = headers.get('x-ratelimit-limit');
    const reset = headers.get('x-ratelimit-reset');

    if (reset !== null) {
      this.resetTimestamp = parseInt(reset, 10);
      this.startCountdown();
    }

    if (remaining !== null && limit !== null) {
      const el = document.getElementById('rate-text');
      const dot = document.querySelector('.rate-dot');
      if (el) el.textContent = `${remaining}/${limit} calls`;
      if (dot) {
        const remNum = parseInt(remaining, 10);
        const limitNum = parseInt(limit, 10);
        const ratio = remNum / limitNum;
        dot.style.background = remNum === 0 ? '#f85149' : ratio > 0.2 ? '#3fb950' : '#d29922';
      }
    }
  },

  startCountdown() {
    if (this.timerInterval) clearInterval(this.timerInterval);

    const updateTimerUI = () => {
      const countdownEl = document.getElementById('rate-countdown');
      const modalCountdownEl = document.getElementById('modal-countdown-text');
      if (!this.resetTimestamp) return;

      const nowSec = Math.floor(Date.now() / 1000);
      const diffSec = this.resetTimestamp - nowSec;

      if (diffSec <= 0) {
        if (countdownEl) countdownEl.textContent = '';
        if (modalCountdownEl) modalCountdownEl.textContent = 'Free quota reset! You can make requests now.';
        clearInterval(this.timerInterval);
        return;
      }

      const m = Math.floor(diffSec / 60);
      const s = diffSec % 60;
      const timeStr = m > 0 ? `${m}m ${s}s` : `${s}s`;
      if (countdownEl) countdownEl.textContent = `free access resets in ${timeStr}`;
      if (modalCountdownEl) modalCountdownEl.textContent = `Free access automatically resets in ${timeStr}.`;
    };

    updateTimerUI();
    this.timerInterval = setInterval(updateTimerUI, 1000);
  },

  async request(endpoint) {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: this.getHeaders()
    });
    this.updateRateLimit(res.headers);

    if (!res.ok) {
      if (res.status === 403 || res.status === 429) {
        // Automatically open the token modal directly instead of ugly browser alert()
        const tokenModal = document.getElementById('token-modal');
        if (tokenModal) tokenModal.classList.remove('hidden');
        throw new Error('API rate limit reached (60/hr for unauthenticated IP). Paste a GitHub token to unlock 5,000/hr.');
      }
      if (res.status === 404) {
        throw new Error('Repository not found. Please verify the name or privacy settings.');
      }
      throw new Error(`GitHub API request failed (${res.status})`);
    }
    return res.json();
  },

  async getRepo(owner, repo) {
    return this.request(`/repos/${owner}/${repo}`);
  },

  async getLanguages(owner, repo) {
    return this.request(`/repos/${owner}/${repo}/languages`);
  },

  async getPunchCard(owner, repo) {
    return this.request(`/repos/${owner}/${repo}/stats/punch_card`);
  },

  async getContributors(owner, repo) {
    return this.request(`/repos/${owner}/${repo}/contributors?per_page=30`);
  },

  async getRecentCommits(owner, repo) {
    return this.request(`/repos/${owner}/${repo}/commits?per_page=10`);
  },

  async getTree(owner, repo, branch = 'main') {
    return this.request(`/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`);
  },

  async getRawFile(owner, repo, branch, path) {
    const token = this.getToken();
    const headers = {
      'Accept': 'application/vnd.github.v3.raw',
      'User-Agent': 'GitPulse-Dashboard'
    };
    if (token) {
      headers['Authorization'] = `token ${token}`;
    }
    const res = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`, {
      headers
    });
    if (!res.ok) {
      // Fallback to API blob if raw blocked
      const blobRes = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`, {
        headers: this.getHeaders()
      });
      const data = await blobRes.json();
      return atob(data.content.replace(/\s/g, ''));
    }
    return res.text();
  }
};

