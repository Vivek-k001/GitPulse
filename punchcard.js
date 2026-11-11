// 24x7 Commit Punchcard Heatmap Renderer using Canvas
class PunchcardChart {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.canvas = null;
    this.ctx = null;
    this.days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  }

  render(punchData) {
    if (!this.container) return;
    this.container.innerHTML = '';

    const width = this.container.clientWidth || 360;
    const height = this.container.clientHeight || 200;

    this.canvas = document.createElement('canvas');
    this.canvas.width = width * window.devicePixelRatio;
    this.canvas.height = height * window.devicePixelRatio;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    this.ctx = this.canvas.getContext('2d');
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    this.container.appendChild(this.canvas);

    if (!Array.isArray(punchData) || punchData.length === 0) {
      this.container.innerHTML = '<div class="empty-state"><p>No commit punchcard data available.</p></div>';
      return;
    }

    const padding = { top: 20, right: 16, bottom: 28, left: 36 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const cellWidth = chartWidth / 24;
    const cellHeight = chartHeight / 7;

    let maxCommits = 1;
    punchData.forEach(([day, hour, commits]) => {
      if (commits > maxCommits) maxCommits = commits;
    });

    // Draw Day Labels (Y-Axis)
    this.ctx.fillStyle = '#8b949e';
    this.ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'middle';

    this.days.forEach((day, i) => {
      const y = padding.top + (i * cellHeight) + (cellHeight / 2);
      this.ctx.fillText(day, padding.left - 8, y);
    });

    // Draw Hour Labels (X-Axis) - every 4 hours
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    for (let h = 0; h < 24; h += 4) {
      const x = padding.left + (h * cellWidth) + (cellWidth / 2);
      const label = h === 0 ? '12a' : h === 12 ? '12p' : h < 12 ? `${h}a` : `${h - 12}p`;
      this.ctx.fillText(label, x, height - padding.bottom + 8);
    }

    // Draw Activity Circles
    punchData.forEach(([day, hour, commits]) => {
      if (commits === 0) return;

      const x = padding.left + (hour * cellWidth) + (cellWidth / 2);
      const y = padding.top + (day * cellHeight) + (cellHeight / 2);

      const ratio = commits / maxCommits;
      const maxRadius = Math.min(cellWidth, cellHeight) / 2 - 1.5;
      const radius = Math.max(2, ratio * maxRadius);

      // GitHub green gradient scale
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius, 0, Math.PI * 2);

      if (ratio > 0.75) {
        this.ctx.fillStyle = '#39d353';
      } else if (ratio > 0.4) {
        this.ctx.fillStyle = '#26a641';
      } else if (ratio > 0.15) {
        this.ctx.fillStyle = '#006d32';
      } else {
        this.ctx.fillStyle = '#0e4429';
      }

      this.ctx.fill();
    });
  }
}
