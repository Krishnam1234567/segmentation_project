import { useState, useEffect } from 'react';
import { Globe, CheckCircle, Clock, Zap, DollarSign, Calendar, AlertTriangle, Loader2 } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { fetchFromAPI } from '../utils/api';

const statusConfig = {
  active:       { label: 'Active',       color: 'bg-accent/15 text-accent border-accent/30' },
  planning:     { label: 'Planning',     color: 'bg-primary/15 text-primary border-primary/30' },
  research:     { label: 'Research',     color: 'bg-warning/15 text-warning border-warning/30' },
};
const riskConfig = {
  high:   'text-destructive bg-destructive/10',
  medium: 'text-warning bg-warning/10',
  low:    'text-accent bg-accent/10',
};

export function GlobalExpansion() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState(null);

  useEffect(() => {
    fetchFromAPI('/expansion')
      .then(d => { setData(d); setSelected(d.jurisdictions?.[0]); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const runAiAnalysis = async () => {
    if (!selected) return;
    setAiLoading(true); setAiInsight(null);
    try {
      const res = await fetch('/api/expansion/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jurisdiction: selected.name, business_description: 'Enterprise SaaS legal technology platform' }),
      });
      const d = await res.json();
      setAiInsight(d.analysis);
    } catch (e) {
      setAiInsight('AI analysis unavailable. Check backend connection.');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return <div className="p-6 flex items-center justify-center h-full text-muted-foreground">Loading expansion data...</div>;
  if (!data) return <div className="p-6 flex items-center justify-center h-full text-destructive">Failed to load expansion data</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-1">Global Expansion Simulator</h2>
          <p className="text-sm text-muted-foreground">Analyze legal requirements, risks, and timelines for international expansion</p>
        </div>
        <button onClick={runAiAnalysis} disabled={aiLoading || !selected}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm font-medium disabled:opacity-60">
          {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          {aiLoading ? 'Analyzing...' : `Analyze ${selected?.name || 'Jurisdiction'}`}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {data.jurisdictions?.map((j) => (
          <button key={j.code} onClick={() => { setSelected(j); setAiInsight(null); }}
            className={`text-left bg-card border rounded-lg p-4 transition-all hover:shadow-md ${selected?.code === j.code ? 'border-primary ring-1 ring-primary' : 'border-border'}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{j.flag}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusConfig[j.status]?.color}`}>{statusConfig[j.status]?.label}</span>
            </div>
            <h4 className="text-sm font-semibold text-foreground mb-2">{j.name}</h4>
            <div className="w-full bg-muted rounded-full h-1.5 mb-1">
              <div className={`h-1.5 rounded-full ${j.readiness >= 80 ? 'bg-accent' : j.readiness >= 60 ? 'bg-primary' : 'bg-warning'}`} style={{ width: `${j.readiness}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">{j.readiness}% ready</p>
          </button>
        ))}
      </div>

      {selected && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start gap-4 mb-4">
                <span className="text-4xl">{selected.flag}</span>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground">{selected.name}</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selected.regulations?.map(r => <span key={r} className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">{r}</span>)}
                  </div>
                </div>
                <div className={`text-center px-4 py-2 rounded-lg ${selected.readiness >= 80 ? 'bg-accent/10' : selected.readiness >= 60 ? 'bg-primary/10' : 'bg-warning/10'}`}>
                  <p className="text-xs text-muted-foreground">Readiness</p>
                  <p className={`text-2xl font-bold ${selected.readiness >= 80 ? 'text-accent' : selected.readiness >= 60 ? 'text-primary' : 'text-warning'}`}>{selected.readiness}%</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <Calendar className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Timeline</p>
                  <p className="text-sm font-semibold text-foreground">{selected.timeline}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <DollarSign className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Est. Cost</p>
                  <p className="text-sm font-semibold text-foreground">{selected.cost}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <AlertTriangle className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Risk Factors</p>
                  <p className="text-sm font-semibold text-foreground">{selected.risks?.length}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {selected.risks?.map(r => <span key={r.label} className={`text-xs px-2 py-1 rounded font-medium ${riskConfig[r.level]}`}>{r.label} ({r.level})</span>)}
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h4 className="text-base font-semibold text-foreground mb-4">Legal Checklist</h4>
              <div className="space-y-2">
                {selected.tasks?.map((task, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-lg ${task.done ? 'bg-accent/5' : 'bg-muted/20'}`}>
                    {task.done ? <CheckCircle className="w-4 h-4 text-accent flex-shrink-0" /> : <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                    <span className={`text-sm ${task.done ? 'text-foreground' : 'text-muted-foreground'}`}>{task.text}</span>
                    {task.done && <span className="ml-auto text-xs text-accent font-medium">Complete</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-card border border-border rounded-lg p-6">
              <h4 className="text-base font-semibold text-foreground mb-3">Legal Readiness Profile</h4>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={selected.score}>
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar dataKey="A" stroke="#2563EB" fill="#2563EB" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h4 className="text-base font-semibold text-foreground mb-3">Cost Comparison ($K)</h4>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={data.cost_comparison} layout="vertical" barSize={12}>
                  <XAxis type="number" stroke="var(--muted-foreground)" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} width={55} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem', fontSize: '12px' }} />
                  <Bar dataKey="cost" fill="#2563EB" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">AI Expansion Insight</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {aiInsight || selected.ai_insight}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
