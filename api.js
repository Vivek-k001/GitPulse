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
        const ratio = parseInt(remaining, 10) / parseInt(limit, 10);
        dot.style.background = ratio > 0.2 ? '#3fb950' : ratio > 0.05 ? '#d29922' : '#f85149';
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
        throw new Error('Rate limit exceeded. Provide a personal access token to continue.');
      }
      if (res.status === 404) {
        throw new Error('Repository not found. Please check owner/repo.');
      }
      throw new Error(`GitHub API error (${res.status})`);
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
