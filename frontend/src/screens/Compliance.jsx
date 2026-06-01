import { useState, useEffect } from 'react';
import { Shield, CheckCircle, AlertCircle, Clock, FileCheck, Zap, Loader2 } from 'lucide-react';
import { StatusChip } from '../components/StatusChip';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { fetchFromAPI } from '../utils/api';

export function Compliance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFramework, setSelectedFramework] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  useEffect(() => {
    fetchFromAPI('/compliance')
      .then(d => { setData(d); setSelectedFramework(d.compliance_scores?.[0]?.category); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const runAiAnalysis = async () => {
    if (!selectedFramework) return;
    setAiLoading(true); setAiAnalysis(null);
    const score = data.compliance_scores?.find(s => s.category === selectedFramework);
    try {
      const res = await fetch('/api/compliance/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          framework: selectedFramework,
          context: `Current score: ${score?.score ?? 'N/A'}%. Enterprise SaaS operating across US, EU, APAC.`,
        }),
      });
      const d = await res.json();
      setAiAnalysis(d.analysis);
    } catch (e) {
      setAiAnalysis('AI analysis unavailable. Check backend connection.');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return <div className="p-6 flex items-center justify-center h-full text-muted-foreground">Loading compliance data...</div>;
  if (!data) return <div className="p-6 flex items-center justify-center h-full text-destructive">Failed to load compliance data</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-1">Compliance Automation</h2>
          <p className="text-sm text-muted-foreground">Real-time compliance monitoring and regulatory intelligence</p>
        </div>
        <button
          onClick={runAiAnalysis}
          disabled={aiLoading || !selectedFramework}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm font-medium disabled:opacity-60"
        >
          {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          {aiLoading ? 'Analyzing...' : `Analyze ${selectedFramework || 'Framework'}`}
        </button>
      </div>

      {aiAnalysis && (
        <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
          <p className="text-sm font-semibold text-foreground mb-2">Gemini AI — {selectedFramework} Compliance Analysis</p>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{aiAnalysis}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2"><p className="text-sm text-muted-foreground">Overall Score</p><Shield className="w-4 h-4 text-accent" /></div>
          <p className="text-2xl font-semibold text-foreground">{data.overall_score}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2"><p className="text-sm text-muted-foreground">Active Frameworks</p><FileCheck className="w-4 h-4 text-primary" /></div>
          <p className="text-2xl font-semibold text-foreground">{data.active_frameworks}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2"><p className="text-sm text-muted-foreground">Tasks Due</p><Clock className="w-4 h-4 text-warning" /></div>
          <p className="text-2xl font-semibold text-foreground">{data.tasks_due}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2"><p className="text-sm text-muted-foreground">Non-Compliant</p><AlertCircle className="w-4 h-4 text-destructive" /></div>
          <p className="text-2xl font-semibold text-foreground">{data.non_compliant}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-foreground">Compliance Framework Health</h3>
            <p className="text-xs text-muted-foreground">Click pill to select for AI analysis</p>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={data.compliance_scores}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="category" tick={{ fill: 'var(--foreground)', fontSize: 10 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: 'var(--muted-foreground)' }} />
              <Radar name="Score" dataKey="score" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem' }} />
            </RadarChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {data.compliance_scores?.map(s => (
              <button key={s.category}
                onClick={() => { setSelectedFramework(s.category); setAiAnalysis(null); }}
                className={`text-xs px-2.5 py-1 rounded-full transition-all font-medium ${selectedFramework === s.category ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                {s.category} <span className={s.score >= 90 ? 'text-accent' : s.score >= 80 ? 'text-warning' : 'text-destructive'}>{s.score}%</span>
              </button>
            ))}
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Compliance Trend (12 Months)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.monthly_trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" tick={{ fontSize: 10 }} />
              <YAxis stroke="var(--muted-foreground)" domain={[75, 100]} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem' }} />
              <Bar dataKey="compliance" fill="#10B981" name="Compliance %" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Compliance Task Board</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Task</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Due Date</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Priority</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
            </tr></thead>
            <tbody>{data.tasks.map((t) => (
              <tr key={t.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                <td className="py-3 px-4 text-foreground">{t.title}</td>
                <td className="py-3 px-4 text-muted-foreground">{t.due}</td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${t.priority === 'high' ? 'bg-destructive/10 text-destructive' : t.priority === 'medium' ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground'}`}>
                    {t.priority.charAt(0).toUpperCase() + t.priority.slice(1)}
                  </span>
                </td>
                <td className="py-3 px-4"><StatusChip status={t.status} /></td>
                <td className="py-3 px-4"><button className="text-primary hover:underline text-sm">View Details</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Upcoming Filings</h3>
          <div className="space-y-3">{data.upcoming_filings.map((f, i) => (
            <div key={i} className="p-4 border border-border rounded-lg hover:bg-muted/20 transition-colors">
              <div className="flex items-start justify-between">
                <div><p className="text-sm font-medium text-foreground">{f.filing}</p><p className="text-xs text-muted-foreground mt-1">{f.framework} • {f.jurisdiction}</p></div>
                <div className="text-right"><p className="text-xs text-muted-foreground">Due</p><p className="text-sm font-medium text-foreground">{f.deadline}</p></div>
              </div>
            </div>
          ))}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Regulatory Updates</h3>
          <div className="space-y-3">
            {data.regulatory_updates.map((update, idx) => {
              const Icon = update.severity === 'primary' ? CheckCircle : AlertCircle;
              const cls = update.severity === 'destructive' ? 'border-destructive/20 bg-destructive/5 text-destructive'
                : update.severity === 'warning' ? 'border-warning/20 bg-warning/5 text-warning'
                : 'border-primary/20 bg-primary/5 text-primary';
              return (
                <div key={idx} className={`p-3 rounded-lg border ${cls}`}>
                  <div className="flex items-start gap-2">
                    <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{update.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{update.description}</p>
                      {update.action_text && <p className={`text-xs mt-2 cursor-pointer hover:underline`}>{update.action_text}</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
