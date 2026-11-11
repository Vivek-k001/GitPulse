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

  updateRateLimit(headers) {
    const remaining = headers.get('x-ratelimit-remaining');
    const limit = headers.get('x-ratelimit-limit');
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
  }
};

