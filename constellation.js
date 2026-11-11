// D3.js Contributor Constellation Force-Directed Graph
class ConstellationGraph {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.simulation = null;
  }

  render(contributors) {
    if (!this.container) return;
    this.container.innerHTML = '';

    if (!Array.isArray(contributors) || contributors.length === 0) {
      this.container.innerHTML = '<div class="empty-state"><p>No contributor data available.</p></div>';
      return;
    }

    const width = this.container.clientWidth || 360;
    const height = this.container.clientHeight || 200;

    const svg = d3.select(this.container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);

    const maxContrib = d3.max(contributors, d => d.contributions) || 1;
    const radiusScale = d3.scaleSqrt()
      .domain([1, maxContrib])
      .range([10, 24]);

    const nodes = contributors.slice(0, 20).map(d => ({
      ...d,
      r: radiusScale(d.contributions)
    }));

    // Generate gravitational links between top contributors and primary owner
    const links = [];
    for (let i = 1; i < nodes.length; i++) {
      links.push({
        source: 0,
        target: i
      });
    }

    const link = svg.append('g')
      .attr('stroke', '#30363d')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 1)
      .selectAll('line')
      .data(links)
      .join('line');

    const node = svg.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(d3.drag()
        .on('start', (event, d) => {
          if (!event.active) this.simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) this.simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      );

    // Node background circle
    node.append('circle')
      .attr('r', d => d.r)
      .attr('fill', '#161b22')
      .attr('stroke', '#388bfd')
      .attr('stroke-width', 1.5);

    // Contributor avatar image clipped to circle
    const defs = svg.append('defs');
    nodes.forEach((d, i) => {
      const clipId = `clip-avatar-${i}`;
      defs.append('clipPath')
        .attr('id', clipId)
        .append('circle')
        .attr('r', d.r - 1.5)
        .attr('cx', 0)
        .attr('cy', 0);

      const g = node.filter(n => n === d);
      g.append('image')
        .attr('xlink:href', d.avatar_url)
        .attr('x', -d.r + 1.5)
        .attr('y', -d.r + 1.5)
        .attr('width', (d.r - 1.5) * 2)
        .attr('height', (d.r - 1.5) * 2)
        .attr('clip-path', `url(#${clipId})`);
    });

    node.append('title')
      .text(d => `${d.login}: ${d.contributions} contributions`);

    this.simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).distance(50).strength(0.3))
      .force('charge', d3.forceManyBody().strength(-40))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => d.r + 3))
      .on('tick', () => {
        link
          .attr('x1', d => d.source.x)
          .attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x)
          .attr('y2', d => d.target.y);

        node
          .attr('transform', d => `translate(${d.x},${d.y})`);
      });
  }
}
