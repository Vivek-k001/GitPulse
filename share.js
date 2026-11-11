// Modal generator for 1-click Markdown Badge & Social Snippets
class ShareModal {
  constructor() {
    this.modal = null;
    this.createModal();
  }

  createModal() {
    this.modal = document.createElement('div');
    this.modal.className = 'modal-overlay hidden';
    this.modal.id = 'share-modal';
    this.modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Share & Embed Badge</h3>
          <button class="modal-close-btn" id="close-share-btn">&times;</button>
        </div>
        <div class="modal-body">
          <p class="modal-desc">
            Copy and paste this badge into your repository's README to link directly to GitPulse 3D inspection.
          </p>
          <div class="snippet-box">
            <label class="snippet-label">Markdown</label>
            <textarea id="markdown-snippet" readonly rows="3" style="width:100%; background:var(--bg-inset); border:1px solid var(--border-default); border-radius:var(--radius-sm); color:var(--text-primary); font-family:var(--font-mono); font-size:12px; padding:8px; resize:none;"></textarea>
          </div>
          <div class="modal-actions">
            <button id="copy-snippet-btn" class="primary-btn">Copy Snippet</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(this.modal);

    document.getElementById('close-share-btn').addEventListener('click', () => {
      this.modal.classList.add('hidden');
    });

    document.getElementById('copy-snippet-btn').addEventListener('click', () => {
      const textarea = document.getElementById('markdown-snippet');
      textarea.select();
      navigator.clipboard.writeText(textarea.value);
      const btn = document.getElementById('copy-snippet-btn');
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = 'Copy Snippet'; }, 2000);
    });
  }

  open(owner, repo) {
    const md = `[![GitPulse 3D](https://img.shields.io/badge/GitPulse-3D%20Inspect-2f81f7?style=flat&logo=github)](https://vivek-k001.github.io/GitPulse/?repo=${owner}/${repo})`;
    const textarea = document.getElementById('markdown-snippet');
    if (textarea) textarea.value = md;
    this.modal.classList.remove('hidden');
  }
}

window.ShareModal = ShareModal;
