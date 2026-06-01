import { useState, useEffect } from 'react';
import { FileText, Upload, Search, Filter, Download, Eye, AlertCircle, Zap, Loader2, X, Plus, Trash2 } from 'lucide-react';
import { StatusChip } from '../components/StatusChip';
import { RiskBadge } from '../components/RiskBadge';
import { fetchFromAPI } from '../utils/api';

export function Contracts() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedContract, setSelectedContract] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [newContract, setNewContract] = useState({ name: '', counterparty: '', type: 'Sales Contract', value: '', endDate: '', risk: 'medium' });

  const loadData = () => {
    fetchFromAPI('/contracts')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const runAiAnalysis = async (c) => {
    setAiLoading(true); setAiAnalysis(null);
    try {
      const res = await fetch('/api/contracts/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contract_id: c.id, contract_name: c.name, contract_type: c.type, key_concern: c.risk === 'high' ? `High risk contract expiring ${c.endDate}` : null }),
      });
      const d = await res.json();
      setAiAnalysis(d.analysis);
    } catch (e) { setAiAnalysis('AI analysis unavailable.'); }
    finally { setAiLoading(false); }
  };

  const handleAddContract = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      await fetch('/api/contracts/add', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newContract, status: 'active' }),
      });
      setShowAddModal(false);
      setNewContract({ name: '', counterparty: '', type: 'Sales Contract', value: '', endDate: '', risk: 'medium' });
      loadData();
    } catch (e) { console.error(e); }
    finally { setAddLoading(false); }
  };

  const handleDeleteContract = async (e, contractId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this contract and its knowledge graph data?")) return;
    try {
      await fetch(`/api/contracts/${contractId}`, { method: 'DELETE' });
      if (selectedContract?.id === contractId) setSelectedContract(null);
      loadData();
    } catch (e) { console.error("Error deleting contract:", e); }
  };

  if (loading) return <div className="p-6 flex items-center justify-center h-full text-muted-foreground">Loading contracts...</div>;
  if (!data) return <div className="p-6 flex items-center justify-center h-full text-destructive">Failed to load contracts data</div>;

  const filtered = data.contracts?.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.counterparty.toLowerCase().includes(search.toLowerCase()) ||
    c.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-1">Contract Intelligence</h2>
          <p className="text-sm text-muted-foreground">AI-powered contract management and analysis</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" />Add Contract
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4"><div className="flex items-center justify-between mb-2"><p className="text-sm text-muted-foreground">Total Contracts</p><FileText className="w-4 h-4 text-primary" /></div><p className="text-2xl font-semibold text-foreground">{data.total_contracts}</p><p className="text-xs text-accent mt-1">{data.total_contracts_change}</p></div>
        <div className="bg-card border border-border rounded-lg p-4"><div className="flex items-center justify-between mb-2"><p className="text-sm text-muted-foreground">Total Value</p><FileText className="w-4 h-4 text-accent" /></div><p className="text-2xl font-semibold text-foreground">{data.total_value}</p></div>
        <div className="bg-card border border-border rounded-lg p-4"><div className="flex items-center justify-between mb-2"><p className="text-sm text-muted-foreground">Expiring Soon</p><AlertCircle className="w-4 h-4 text-warning" /></div><p className="text-2xl font-semibold text-foreground">{data.expiring_soon}</p><p className="text-xs text-warning mt-1">Next 12 months</p></div>
        <div className="bg-card border border-border rounded-lg p-4"><div className="flex items-center justify-between mb-2"><p className="text-sm text-muted-foreground">AI Reviewed</p><Zap className="w-4 h-4 text-primary" /></div><p className="text-2xl font-semibold text-foreground">{data.ai_reviewed_percentage}</p></div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Contract Repository</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search contracts..."
                className="pl-9 pr-4 py-2 bg-input-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">ID</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Contract Name</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Counterparty</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Type</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Value</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">End Date</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Risk</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
            </tr></thead>
            <tbody>
              {filtered?.map((c) => (
                <tr key={c.id} className={`border-b border-border hover:bg-muted/30 transition-colors cursor-pointer ${selectedContract?.id === c.id ? 'bg-primary/5' : ''}`}
                  onClick={() => { setSelectedContract(c); setAiAnalysis(c.analysis || null); }}>
                  <td className="py-3 px-4 text-muted-foreground font-mono text-xs">{c.id}</td>
                  <td className="py-3 px-4 text-foreground font-medium">{c.name}</td>
                  <td className="py-3 px-4 text-muted-foreground">{c.counterparty}</td>
                  <td className="py-3 px-4 text-muted-foreground">{c.type}</td>
                  <td className="py-3 px-4 text-foreground font-medium">{c.value}</td>
                  <td className="py-3 px-4 text-muted-foreground">{c.endDate}</td>
                  <td className="py-3 px-4"><StatusChip status={c.status} /></td>
                  <td className="py-3 px-4"><RiskBadge level={c.risk} /></td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <button onClick={e => { e.stopPropagation(); setSelectedContract(c); runAiAnalysis(c); }}
                        className="p-1.5 hover:bg-primary/10 rounded transition-colors" title="AI Analyze">
                        <Zap className="w-4 h-4 text-primary" />
                      </button>
                      <button onClick={e => handleDeleteContract(e, c.id)}
                        className="p-1.5 hover:bg-destructive/10 rounded transition-colors" title="Delete Contract">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedContract && (
        <div className="bg-card border border-primary/30 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">{selectedContract.id} · {selectedContract.type}</p>
              <h3 className="text-base font-semibold text-foreground">{selectedContract.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">Counterparty: {selectedContract.counterparty} · Ends: {selectedContract.endDate}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => runAiAnalysis(selectedContract)} disabled={aiLoading}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm font-medium disabled:opacity-60">
                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                {aiLoading ? 'Analyzing...' : 'AI Contract Analysis'}
              </button>
              <button onClick={() => { setSelectedContract(null); setAiAnalysis(null); }} className="p-2 hover:bg-muted/50 rounded-lg"><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
          </div>
          {aiAnalysis && (
            <div className="p-4 bg-accent/5 border border-accent/20 rounded-lg">
              <p className="text-sm font-semibold text-foreground mb-2">Gemini AI Contract Analysis</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{aiAnalysis}</p>
            </div>
          )}
          {!aiAnalysis && !aiLoading && <p className="text-sm text-muted-foreground">Click "AI Contract Analysis" to get Gemini-powered insights.</p>}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">AI Clause Analysis</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg"><div><p className="text-sm font-medium text-foreground">Total Clauses Analyzed</p></div><p className="text-2xl font-semibold text-foreground">{data.clause_analysis.totalClauses.toLocaleString()}</p></div>
            <div className="space-y-2"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">High Risk</span><span className="text-sm font-medium text-destructive">{data.clause_analysis.highRisk}</span></div><div className="w-full bg-muted rounded-full h-2"><div className="bg-destructive h-2 rounded-full" style={{ width: `${(data.clause_analysis.highRisk / data.clause_analysis.totalClauses) * 100}%` }}></div></div></div>
            <div className="space-y-2"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Medium Risk</span><span className="text-sm font-medium text-warning">{data.clause_analysis.mediumRisk}</span></div><div className="w-full bg-muted rounded-full h-2"><div className="bg-warning h-2 rounded-full" style={{ width: `${(data.clause_analysis.mediumRisk / data.clause_analysis.totalClauses) * 100}%` }}></div></div></div>
            <div className="space-y-2"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Low Risk</span><span className="text-sm font-medium text-accent">{data.clause_analysis.lowRisk}</span></div><div className="w-full bg-muted rounded-full h-2"><div className="bg-accent h-2 rounded-full" style={{ width: `${(data.clause_analysis.lowRisk / data.clause_analysis.totalClauses) * 100}%` }}></div></div></div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Recent AI Insights</h3>
          <div className="space-y-3">
            {data.ai_insights.map((insight, idx) => (
              <div key={idx} className={`p-3 rounded-lg border ${insight.severity === 'destructive' ? 'border-destructive/20 bg-destructive/5' : insight.severity === 'warning' ? 'border-warning/20 bg-warning/5' : 'border-primary/20 bg-primary/5'}`}>
                <div className="flex items-start gap-2">
                  <AlertCircle className={`w-4 h-4 mt-0.5 ${insight.severity === 'destructive' ? 'text-destructive' : insight.severity === 'warning' ? 'text-warning' : 'text-primary'}`} />
                  <div><p className="text-sm font-medium text-foreground">{insight.title}</p><p className="text-xs text-muted-foreground mt-1">{insight.description}</p><p className="text-xs text-muted-foreground mt-1">Contract: {insight.contract_id}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Contract Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">Add New Contract</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-muted rounded"><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <form onSubmit={handleAddContract} className="space-y-4">
              <div><label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">Contract Name</label><input value={newContract.name} onChange={e => setNewContract(p => ({...p, name: e.target.value}))} required className="w-full px-3 py-2 bg-input-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground" placeholder="e.g. Master SaaS Agreement" /></div>
              <div><label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">Counterparty</label><input value={newContract.counterparty} onChange={e => setNewContract(p => ({...p, counterparty: e.target.value}))} required className="w-full px-3 py-2 bg-input-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground" placeholder="e.g. Acme Corp" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">Type</label><select value={newContract.type} onChange={e => setNewContract(p => ({...p, type: e.target.value}))} className="w-full px-3 py-2 bg-input-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground">
                  <option>Sales Contract</option><option>NDA</option><option>Service Agreement</option><option>Data Processing</option><option>Real Estate Lease</option><option>Cloud Services</option><option>IP Transfer</option><option>Marketing</option><option>Employment</option><option>Other</option>
                </select></div>
                <div><label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">Risk Level</label><select value={newContract.risk} onChange={e => setNewContract(p => ({...p, risk: e.target.value}))} className="w-full px-3 py-2 bg-input-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground">
                  <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                </select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">Value</label><input value={newContract.value} onChange={e => setNewContract(p => ({...p, value: e.target.value}))} required className="w-full px-3 py-2 bg-input-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground" placeholder="$100,000" /></div>
                <div><label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">End Date</label><input type="date" value={newContract.endDate} onChange={e => setNewContract(p => ({...p, endDate: e.target.value}))} required className="w-full px-3 py-2 bg-input-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground" /></div>
              </div>
              <button type="submit" disabled={addLoading} className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-60 text-sm">
                {addLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Creating...</> : <><Plus className="w-4 h-4" />Create Contract</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
