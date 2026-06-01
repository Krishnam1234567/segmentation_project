import { useState, useEffect } from 'react';
import { FileText, Upload, Search, Filter, Download, Eye, AlertCircle } from 'lucide-react';
import { StatusChip } from '../components/StatusChip';
import { RiskBadge } from '../components/RiskBadge';
import { fetchFromAPI } from '../utils/api';

export function Contracts() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFromAPI('/contracts')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 flex items-center justify-center h-full text-muted-foreground">Loading contracts...</div>;
  if (!data) return <div className="p-6 flex items-center justify-center h-full text-destructive">Failed to load contracts data</div>;

  // Data fetched from API

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-1">Contract Intelligence</h2>
          <p className="text-sm text-muted-foreground">AI-powered contract management and analysis</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
          <Upload className="w-4 h-4" />Upload Contract
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2"><p className="text-sm text-muted-foreground">Total Contracts</p><FileText className="w-4 h-4 text-primary" /></div>
          <p className="text-2xl font-semibold text-foreground">{data.total_contracts}</p><p className="text-xs text-accent mt-1">{data.total_contracts_change}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2"><p className="text-sm text-muted-foreground">Total Value</p><FileText className="w-4 h-4 text-accent" /></div>
          <p className="text-2xl font-semibold text-foreground">{data.total_value}</p><p className="text-xs text-muted-foreground mt-1">Active contracts</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2"><p className="text-sm text-muted-foreground">Expiring Soon</p><AlertCircle className="w-4 h-4 text-warning" /></div>
          <p className="text-2xl font-semibold text-foreground">{data.expiring_soon}</p><p className="text-xs text-warning mt-1">Next 90 days</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2"><p className="text-sm text-muted-foreground">AI Reviewed</p><FileText className="w-4 h-4 text-primary" /></div>
          <p className="text-2xl font-semibold text-foreground">{data.ai_reviewed_percentage}</p><p className="text-xs text-accent mt-1">All contracts</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Contract Repository</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Search contracts..." className="pl-9 pr-4 py-2 bg-input-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted/30 transition-colors"><Filter className="w-4 h-4" />Filter</button>
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
              {data.contracts.map((c) => (
                <tr key={c.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 text-muted-foreground font-mono text-xs">{c.id}</td>
                  <td className="py-3 px-4 text-foreground font-medium">{c.name}</td>
                  <td className="py-3 px-4 text-muted-foreground">{c.counterparty}</td>
                  <td className="py-3 px-4 text-muted-foreground">{c.type}</td>
                  <td className="py-3 px-4 text-foreground font-medium">{c.value}</td>
                  <td className="py-3 px-4 text-muted-foreground">{c.endDate}</td>
                  <td className="py-3 px-4"><StatusChip status={c.status} /></td>
                  <td className="py-3 px-4"><RiskBadge level={c.risk} /></td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button className="p-1 hover:bg-muted rounded transition-colors"><Eye className="w-4 h-4 text-muted-foreground" /></button>
                      <button className="p-1 hover:bg-muted rounded transition-colors"><Download className="w-4 h-4 text-muted-foreground" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">AI Clause Analysis</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
              <div><p className="text-sm font-medium text-foreground">Total Clauses Analyzed</p><p className="text-xs text-muted-foreground">Across all contracts</p></div>
              <p className="text-2xl font-semibold text-foreground">{data.clause_analysis.totalClauses}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">High Risk Clauses</span><span className="text-sm font-medium text-destructive">{data.clause_analysis.highRisk}</span></div>
              <div className="w-full bg-muted rounded-full h-2"><div className="bg-destructive h-2 rounded-full" style={{ width: '2%' }}></div></div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Medium Risk Clauses</span><span className="text-sm font-medium text-warning">{data.clause_analysis.mediumRisk}</span></div>
              <div className="w-full bg-muted rounded-full h-2"><div className="bg-warning h-2 rounded-full" style={{ width: '12.5%' }}></div></div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Low Risk Clauses</span><span className="text-sm font-medium text-accent">{data.clause_analysis.lowRisk}</span></div>
              <div className="w-full bg-muted rounded-full h-2"><div className="bg-accent h-2 rounded-full" style={{ width: '85.5%' }}></div></div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Recent AI Insights</h3>
          <div className="space-y-3">
            {data.ai_insights.map((insight, idx) => (
              <div key={idx} className={`p-3 border border-${insight.severity}/20 bg-${insight.severity}/5 rounded-lg`}>
                <div className="flex items-start gap-2"><AlertCircle className={`w-4 h-4 text-${insight.severity} mt-0.5`} />
                  <div><p className="text-sm font-medium text-foreground">{insight.title}</p><p className="text-xs text-muted-foreground mt-1">{insight.description}</p><p className="text-xs text-muted-foreground mt-1">Contract: {insight.contract_id}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
