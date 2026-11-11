// 24x7 Commit Punchcard Heatmap Renderer using Canvas
class PunchcardChart {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.canvas = null;
    this.ctx = null;
    this.days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    this.punchData = [];
    this.points = [];
    this.tooltip = null;
    this.initTooltip();
  }

  initTooltip() {
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'punchcard-tooltip';
    this.tooltip.style.position = 'absolute';
    this.tooltip.style.display = 'none';
    this.tooltip.style.pointerEvents = 'none';
    this.tooltip.style.background = '#161b22';
    this.tooltip.style.border = '1px solid #30363d';
    this.tooltip.style.borderRadius = '6px';
    this.tooltip.style.padding = '5px 10px';
    this.tooltip.style.fontSize = '12px';
    this.tooltip.style.fontFamily = 'var(--font-mono, monospace)';
    this.tooltip.style.color = '#f0f6fc';
    this.tooltip.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
    this.tooltip.style.zIndex = '50';
    this.tooltip.style.transform = 'translate(-50%, -120%)';
    this.container.style.position = 'relative';
    this.container.appendChild(this.tooltip);

    this.container.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.container.addEventListener('mouseleave', () => this.hideTooltip());
  }

  onMouseMove(e) {
    if (!this.points.length) return;
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let closest = null;
    let minDistance = Infinity;

    for (const pt of this.points) {
      const dist = Math.hypot(pt.x - mouseX, pt.y - mouseY);
      if (dist <= Math.max(pt.radius + 6, 8) && dist < minDistance) {
        minDistance = dist;
        closest = pt;
      }
    }

    if (closest) {
      const hourStr = closest.hour === 0 ? '12 AM' : closest.hour === 12 ? '12 PM' : closest.hour < 12 ? `${closest.hour} AM` : `${closest.hour - 12} PM`;
      const commitLabel = closest.commits === 1 ? '1 commit' : `${closest.commits.toLocaleString()} commits`;
      this.tooltip.innerHTML = `<strong>${closest.dayName} at ${hourStr}</strong><br><span style="color:#39d353; font-weight:600;">+${commitLabel}</span>`;
      this.tooltip.style.left = `${closest.x}px`;
      this.tooltip.style.top = `${closest.y}px`;
      this.tooltip.style.display = 'block';
    } else {
      this.hideTooltip();
    }
  }

  hideTooltip() {
    if (this.tooltip) {
      this.tooltip.style.display = 'none';
    }
  }

  render(punchData) {
    if (!this.container) return;
    this.punchData = punchData;
    this.points = [];
    this.container.innerHTML = '';
    this.initTooltip();

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
    // Draw Activity Circles and cache positions for hover tooltips
    punchData.forEach(([day, hour, commits]) => {
      if (commits === 0) return;

      const x = padding.left + (hour * cellWidth) + (cellWidth / 2);
      const y = padding.top + (day * cellHeight) + (cellHeight / 2);

      const ratio = commits / maxCommits;
      const maxRadius = Math.min(cellWidth, cellHeight) / 2 - 1.5;
      const radius = Math.max(2, ratio * maxRadius);

      this.points.push({
        x,
        y,
        radius,
        commits,
        day,
        dayName: this.days[day],
        hour
      });

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

