import { useState, useEffect } from 'react';
import { Scale, AlertTriangle, TrendingUp, TrendingDown, Clock, DollarSign, ChevronRight, Shield, Zap, Target, Loader2 } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { fetchFromAPI } from '../utils/api';

const getRiskColor = (risk) => {
  if (risk >= 70) return 'text-destructive';
  if (risk >= 40) return 'text-warning';
  return 'text-accent';
};

const getRiskBg = (risk) => {
  if (risk >= 70) return 'bg-destructive/10 border-destructive/30';
  if (risk >= 40) return 'bg-warning/10 border-warning/30';
  return 'bg-accent/10 border-accent/30';
};

export function Litigation() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  useEffect(() => {
    fetchFromAPI('/litigation')
      .then(d => { setData(d); setSelectedCase(d.active_cases?.[0]); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const runAiAnalysis = async (c) => {
    setAiLoading(true); setAiAnalysis(null);
    try {
      const res = await fetch('/api/litigation/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ case_id: c.id, description: `${c.title} - ${c.type} - Exposure: ${c.exposure}` }),
      });
      const d = await res.json();
      setAiAnalysis(d.analysis);
    } catch (e) {
      setAiAnalysis('AI analysis unavailable. Check backend connection.');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return <div className="p-6 flex items-center justify-center h-full text-muted-foreground">Loading litigation data...</div>;
  if (!data) return <div className="p-6 flex items-center justify-center h-full text-destructive">Failed to load litigation data</div>;

  const s = data.summary;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-1">Litigation Prediction</h2>
          <p className="text-sm text-muted-foreground">AI-powered litigation risk analysis and dispute outcome forecasting</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm font-medium">
          <Zap className="w-4 h-4" />Run AI Analysis
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Cases',         value: s.active_cases,         sub: `${s.high_risk_cases} high risk`,   icon: Scale,    color: 'text-primary',     bg: 'bg-primary/10' },
          { label: 'Avg Win Probability',  value: `${s.avg_win_probability}%`, sub: '+5% vs last quarter',        icon: Target,   color: 'text-accent',      bg: 'bg-accent/10' },
          { label: 'Total Exposure',       value: s.total_exposure,        sub: 'Across all cases',                icon: DollarSign,color: 'text-warning',    bg: 'bg-warning/10' },
          { label: 'Cases Resolved YTD',   value: s.cases_resolved_ytd,    sub: `${s.favorable_outcomes} favorable`, icon: Shield,  color: 'text-accent',    bg: 'bg-accent/10' },
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
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-base font-semibold text-foreground mb-4">Risk Factor Analysis</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={data.risk_factors}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
              <Radar name="Risk" dataKey="A" stroke="#2563EB" fill="#2563EB" fillOpacity={0.3} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-base font-semibold text-foreground mb-4">Case Outcomes (6M)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.case_outcomes} barSize={8}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} />
              <YAxis stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem', fontSize: '12px' }} />
              <Bar dataKey="won" fill="#10B981" name="Won" radius={[2,2,0,0]} />
              <Bar dataKey="settled" fill="#2563EB" name="Settled" radius={[2,2,0,0]} />
              <Bar dataKey="lost" fill="#EF4444" name="Lost" radius={[2,2,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-base font-semibold text-foreground mb-4">Legal Cost Trend ($K)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.cost_trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} />
              <YAxis stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem', fontSize: '12px' }} />
              <Legend />
              <Line type="monotone" dataKey="projected" stroke="#F59E0B" strokeDasharray="5 5" name="Projected" dot={false} />
              <Line type="monotone" dataKey="actual" stroke="#2563EB" name="Actual" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-foreground">Active Litigation Cases</h3>
          <span className="text-xs text-muted-foreground">{data.active_cases?.length} cases shown</span>
        </div>
        <div className="space-y-3">
          {data.active_cases?.map((c) => (
            <div key={c.id} onClick={() => { setSelectedCase(c); setAiAnalysis(null); }}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${selectedCase?.id === c.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/30'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`flex-shrink-0 px-2 py-0.5 rounded text-xs font-semibold border ${getRiskBg(c.risk)}`}>
                    <span className={getRiskColor(c.risk)}>{c.risk}%</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{c.title}</p>
                    <p className="text-xs text-muted-foreground">{c.type} · {c.status}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 flex-shrink-0 ml-4">
                  <div className="hidden md:block text-right"><p className="text-xs text-muted-foreground">Exposure</p><p className="text-sm font-semibold text-foreground">{c.exposure}</p></div>
                  <div className="hidden lg:block text-right"><p className="text-xs text-muted-foreground">Win Prob.</p><p className="text-sm font-semibold text-accent">{c.winProb}%</p></div>
                  <div className="text-right"><p className="text-xs text-muted-foreground">Next Hearing</p><p className="text-xs font-medium text-foreground">{c.nextHearing}</p></div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedCase && (
        <div className="bg-card border border-primary/40 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">{selectedCase.id}</p>
              <h3 className="text-lg font-semibold text-foreground">{selectedCase.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">Counsel: {selectedCase.counsel}</p>
            </div>
            <div className={`text-center px-4 py-2 rounded-lg border ${getRiskBg(selectedCase.risk)}`}>
              <p className="text-xs text-muted-foreground">Risk Score</p>
              <p className={`text-2xl font-bold ${getRiskColor(selectedCase.risk)}`}>{selectedCase.risk}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {[
              { label: 'Case Type', value: selectedCase.type },
              { label: 'Current Status', value: selectedCase.status },
              { label: 'Financial Exposure', value: selectedCase.exposure },
              { label: 'AI Win Probability', value: `${selectedCase.winProb}%` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">{label}</p>
                <p className="text-sm font-semibold text-foreground">{value}</p>
              </div>
            ))}
          </div>

          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg mb-3">
            <div className="flex items-start gap-2">
              <Zap className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">AI Strategic Recommendation</p>
                <p className="text-sm text-muted-foreground">{selectedCase.ai_recommendation}</p>
              </div>
            </div>
          </div>

          <button onClick={() => runAiAnalysis(selectedCase)}
            disabled={aiLoading}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm font-medium disabled:opacity-60">
            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {aiLoading ? 'Analyzing...' : 'Deep AI Analysis'}
          </button>

          {aiAnalysis && (
            <div className="mt-3 p-4 bg-accent/5 border border-accent/20 rounded-lg">
              <p className="text-sm font-semibold text-foreground mb-1">Gemini AI Deep Analysis</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{aiAnalysis}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
