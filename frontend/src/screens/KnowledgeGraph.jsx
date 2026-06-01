import { useState, useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import { GitBranch, Search, ZoomIn, ZoomOut, Maximize2, ArrowRight, AlertTriangle, Loader2, Zap, RefreshCw } from 'lucide-react';
import { fetchFromAPI } from '../utils/api';

const typeColor = {
  contract:   '#2563EB',
  regulation: '#EF4444',
  entity:     '#10B981',
  compliance: '#8B5CF6',
  litigation: '#F59E0B',
  clause:     '#6B7280',
};
const typeBg = {
  contract:   'bg-primary/10 border-primary/30 text-primary',
  regulation: 'bg-destructive/10 border-destructive/30 text-destructive',
  entity:     'bg-accent/10 border-accent/30 text-accent',
  compliance: 'bg-purple-500/10 border-purple-500/30 text-purple-500',
  litigation: 'bg-warning/10 border-warning/30 text-warning',
  clause:     'bg-muted border-border text-muted-foreground',
};
const riskColor = { high: '#EF4444', medium: '#F59E0B', low: '#10B981' };
const riskBg    = { high: 'bg-destructive/10 text-destructive', medium: 'bg-warning/10 text-warning', low: 'bg-accent/10 text-accent' };

export function KnowledgeGraph() {
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [selectedNode, setSelected] = useState(null);
  const [searchQuery, setSearch]    = useState('');
  const [filterType, setFilter]     = useState('all');
  const [aiLoading, setAiLoading]   = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  const svgRef   = useRef(null);
  const simRef   = useRef(null);

  useEffect(() => {
    fetchFromAPI('/knowledge-graph')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Build D3 force-directed graph when data arrives
  useEffect(() => {
    if (!data || !svgRef.current) return;
    buildGraph();
  }, [data]);

  const buildGraph = useCallback(() => {
    if (!data || !svgRef.current) return;

    const el  = svgRef.current;
    const W   = el.clientWidth  || 680;
    const H   = el.clientHeight || 420;

    // Clear previous
    d3.select(el).selectAll('*').remove();

    const nodes = data.nodes.map(n => ({ ...n, id: n.id }));
    const links = data.edges.map(e => ({ source: e.from, target: e.to, label: e.label }));

    const svg = d3.select(el)
      .attr('width', W)
      .attr('height', H);

    // Zoom container
    const g = svg.append('g');
    svg.call(
      d3.zoom()
        .scaleExtent([0.4, 3])
        .on('zoom', (event) => g.attr('transform', event.transform))
    );

    // Arrow marker
    svg.append('defs').append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 28).attr('refY', 0)
      .attr('markerWidth', 6).attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', '#4B5563');

    // Simulation
    const sim = d3.forceSimulation(nodes)
      .force('link',    d3.forceLink(links).id(d => d.id).distance(140))
      .force('charge',  d3.forceManyBody().strength(-400))
      .force('center',  d3.forceCenter(W / 2, H / 2))
      .force('collide', d3.forceCollide(55));

    simRef.current = sim;

    // Links
    const link = g.append('g').selectAll('line')
      .data(links).join('line')
      .attr('stroke', '#374151')
      .attr('stroke-width', 1.5)
      .attr('marker-end', 'url(#arrow)');

    // Link labels
    const linkLabel = g.append('g').selectAll('text')
      .data(links).join('text')
      .attr('text-anchor', 'middle')
      .attr('font-size', 9)
      .attr('fill', '#6B7280')
      .text(d => d.label);

    // Node groups
    const node = g.append('g').selectAll('g')
      .data(nodes).join('g')
      .style('cursor', 'pointer')
      .call(
        d3.drag()
          .on('start', (event, d) => {
            if (!event.active) sim.alphaTarget(0.3).restart();
            d.fx = d.x; d.fy = d.y;
          })
          .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
          .on('end', (event, d) => {
            if (!event.active) sim.alphaTarget(0);
            d.fx = null; d.fy = null;
          })
      )
      .on('click', (event, d) => {
        event.stopPropagation();
        setSelected(d);
        setAiAnalysis(null);
      });

    // Node rects
    node.append('rect')
      .attr('width', 124).attr('height', 48)
      .attr('x', -62).attr('y', -24)
      .attr('rx', 8)
      .attr('fill', d => typeColor[d.type] + '18')
      .attr('stroke', d => typeColor[d.type])
      .attr('stroke-width', 1.5);

    // Risk dot
    node.append('circle')
      .attr('cx', -46).attr('cy', 0).attr('r', 5)
      .attr('fill', d => riskColor[d.risk]);

    // Label
    node.append('text')
      .attr('x', -34).attr('y', -6)
      .attr('font-size', 10).attr('font-weight', '600')
      .attr('fill', d => typeColor[d.type])
      .text(d => d.label.substring(0, 15));

    node.append('text')
      .attr('x', -34).attr('y', 8)
      .attr('font-size', 8.5)
      .attr('fill', '#9CA3AF')
      .text(d => d.sublabel || '');

    // Emoji
    node.append('text')
      .attr('x', 38).attr('y', 6)
      .attr('font-size', 13).attr('text-anchor', 'middle')
      .text(d => d.icon || '');

    sim.on('tick', () => {
      link
        .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
      linkLabel
        .attr('x', d => (d.source.x + d.target.x) / 2)
        .attr('y', d => (d.source.y + d.target.y) / 2 - 5);
      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });
  }, [data]);

  const queryRelationship = async () => {
    if (!selectedNode) return;
    setAiLoading(true); setAiAnalysis(null);
    try {
      const res = await fetch('/api/knowledge-graph/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_name: selectedNode.label,
          context: `${selectedNode.type} in legal knowledge graph with ${selectedNode.risk} risk`,
        }),
      });
      const d = await res.json();
      setAiAnalysis(d.analysis);
    } catch {
      setAiAnalysis('AI query unavailable. Check backend connection.');
    } finally {
      setAiLoading(false);
    }
  };

  const resetGraph = () => {
    if (simRef.current) { simRef.current.alpha(1).restart(); }
  };

  if (loading) return <div className="p-6 flex items-center justify-center h-full text-muted-foreground">Loading knowledge graph data...</div>;
  if (!data)   return <div className="p-6 flex items-center justify-center h-full text-destructive">Failed to load knowledge graph data</div>;

  const s = data.summary;
  const filteredRels = data.relationships?.filter(r => {
    const matchSearch = !searchQuery || r.from.toLowerCase().includes(searchQuery.toLowerCase()) || r.to.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType   = filterType === 'all' || r.type === filterType;
    return matchSearch && matchType;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-1">Legal Knowledge Graph</h2>
          <p className="text-sm text-muted-foreground">Interactive draggable legal relationship and dependency mapping</p>
        </div>
        <div className="flex gap-2">
          <button onClick={resetGraph} className="p-2 bg-card border border-border rounded-lg hover:bg-muted/50" title="Re-layout graph">
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={queryRelationship}
            disabled={aiLoading || !selectedNode}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm font-medium disabled:opacity-60"
          >
            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {aiLoading ? 'Querying...' : selectedNode ? `AI Query: ${selectedNode.label.substring(0, 12)}…` : 'Select a node'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Nodes',       value: s.total_nodes,                       sub: 'Legal entities',    icon: GitBranch,    color: 'text-primary',     bg: 'bg-primary/10' },
          { label: 'Relationships',     value: s.total_relationships.toLocaleString(),sub: 'Mapped deps',      icon: ArrowRight,   color: 'text-accent',      bg: 'bg-accent/10' },
          { label: 'High Risk Links',   value: s.high_risk_links,                   sub: 'Require attention', icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10' },
          { label: 'Docs Indexed',      value: s.documents_indexed,                 sub: 'AI-processed',      icon: Maximize2,    color: 'text-primary',     bg: 'bg-primary/10' },
        ].map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">{label}</p>
              <div className={`p-2 rounded-lg ${bg}`}><Icon className={`w-4 h-4 ${color}`} /></div>
            </div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className={`text-xs mt-1 ${color}`}>{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-lg overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-foreground">Graph View</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Drag nodes · Scroll to zoom · Click to select</p>
            </div>
            <div className="flex gap-2 text-xs flex-wrap">
              {Object.entries(typeBg).map(([type, cls]) => (
                <span key={type} className={`px-2 py-0.5 rounded border ${cls} capitalize`}>{type}</span>
              ))}
            </div>
          </div>
          <div className="relative bg-muted/10" style={{ height: '440px' }}>
            <svg ref={svgRef} className="w-full h-full" />
            {/* Risk legend */}
            <div className="absolute bottom-3 left-3 flex gap-3">
              {['high', 'medium', 'low'].map(r => (
                <div key={r} className="flex items-center gap-1 text-xs text-muted-foreground">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: riskColor[r] }} />{r}
                </div>
              ))}
            </div>
          </div>

          {selectedNode && (
            <div className="p-4 border-t border-border bg-primary/5">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedNode.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{selectedNode.label} — {selectedNode.sublabel}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded border capitalize ${typeBg[selectedNode.type]}`}>{selectedNode.type}</span>
                    <span className={`text-xs px-2 py-0.5 rounded capitalize ${riskBg[selectedNode.risk]}`}>{selectedNode.risk} risk</span>
                  </div>
                </div>
              </div>
              {aiAnalysis && <p className="text-xs text-muted-foreground mt-3 leading-relaxed">{aiAnalysis}</p>}
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-lg flex flex-col">
          <div className="p-4 border-b border-border">
            <h3 className="text-base font-semibold text-foreground mb-3">Relationships</h3>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input value={searchQuery} onChange={e => setSearch(e.target.value)} placeholder="Search relationships..."
                className="w-full pl-8 pr-3 py-1.5 bg-input-background border border-input rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <div className="flex gap-1 flex-wrap">
              {['all', 'contractual', 'regulatory', 'litigation', 'corporate', 'compliance'].map(t => (
                <button key={t} onClick={() => setFilter(t)}
                  className={`text-xs px-2 py-0.5 rounded capitalize transition-colors ${filterType === t ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>{t}</button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {filteredRels?.map(r => (
              <div key={r.id} className="p-3 hover:bg-muted/20 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${riskBg[r.risk]}`}>{r.risk}</span>
                  <span className="text-xs text-muted-foreground">{r.id}</span>
                </div>
                <p className="text-xs font-medium text-foreground truncate">{r.from}</p>
                <div className="flex items-center gap-1 my-0.5"><ArrowRight className="w-3 h-3 text-primary" /><span className="text-xs text-primary">{r.relation}</span></div>
                <p className="text-xs text-muted-foreground truncate">{r.to}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
