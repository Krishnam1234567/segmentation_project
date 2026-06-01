import { useState, useEffect } from 'react';
import { Plug, CheckCircle, AlertCircle, RefreshCw, Settings, ChevronRight, Activity, Plus, ExternalLink } from 'lucide-react';
import { fetchFromAPI } from '../utils/api';

const statusConfig = {
  connected:    { color: 'bg-accent/10 border-accent/30 text-accent',        dot: 'bg-accent',             label: 'Connected' },
  warning:      { color: 'bg-warning/10 border-warning/30 text-warning',      dot: 'bg-warning',            label: 'Warning' },
  disconnected: { color: 'bg-muted border-border text-muted-foreground',      dot: 'bg-muted-foreground',   label: 'Not Connected' },
  pending:      { color: 'bg-primary/10 border-primary/30 text-primary',      dot: 'bg-primary',            label: 'Connecting' },
};
const activityStatusConfig = {
  success: { dot: 'bg-accent',    text: 'text-foreground' },
  warning: { dot: 'bg-warning',   text: 'text-warning' },
  info:    { dot: 'bg-primary',   text: 'text-foreground' },
};

export function Integrations() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedIntegration, setSelectedIntegration] = useState(null);

  useEffect(() => {
    fetchFromAPI('/integrations')
      .then(d => { setData(d); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 flex items-center justify-center h-full text-muted-foreground">Loading integrations data...</div>;
  if (!data) return <div className="p-6 flex items-center justify-center h-full text-destructive">Failed to load integrations data</div>;

  const s = data.summary;
  const filtered = filter === 'all' ? data.integrations : data.integrations?.filter(i => i.status === filter);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-1">Enterprise Integrations</h2>
          <p className="text-sm text-muted-foreground">Connect LexOS with your enterprise tools and data sources</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm font-medium">
          <Plus className="w-4 h-4" />Add Integration
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Connected Apps',    value: `${s.connected}/${s.total}`, sub: 'Active integrations',   icon: Plug,         color: 'text-accent',   bg: 'bg-accent/10' },
          { label: 'Records Synced',   value: s.records_synced_24h,         sub: 'Last 24 hours',         icon: RefreshCw,    color: 'text-primary',  bg: 'bg-primary/10' },
          { label: 'Avg Uptime',       value: `${s.avg_uptime_pct}%`,       sub: 'Last 30 days',          icon: Activity,     color: 'text-accent',   bg: 'bg-accent/10' },
          { label: 'Pending Setup',    value: s.pending_setup,              sub: 'Require configuration', icon: AlertCircle,  color: 'text-warning',  bg: 'bg-warning/10' },
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

      <div className="flex gap-1 bg-muted/50 p-1 rounded-lg w-fit">
        {[
          { id: 'all', label: 'All' },
          { id: 'connected', label: 'Connected' },
          { id: 'warning', label: 'Warning' },
          { id: 'disconnected', label: 'Not Connected' },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filter === f.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>{f.label}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered?.map((integ) => {
            const sc = statusConfig[integ.status];
            return (
              <div key={integ.id} onClick={() => setSelectedIntegration(integ)}
                className={`bg-card border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${selectedIntegration?.id === integ.id ? 'border-primary ring-1 ring-primary' : 'border-border'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{integ.logo}</span>
                    <div><h4 className="text-sm font-semibold text-foreground">{integ.name}</h4><p className="text-xs text-muted-foreground">{integ.category}</p></div>
                  </div>
                  <span className={`flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${sc.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} ${integ.status === 'pending' ? 'animate-pulse' : ''}`} />{sc.label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{integ.description}</p>
                {integ.status === 'connected' && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Last sync: {integ.lastSync}</span>
                    {integ.health > 0 && (
                      <div className="flex items-center gap-1">
                        <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-accent rounded-full" style={{ width: `${integ.health}%` }} />
                        </div>
                        <span className="text-accent">{integ.health}%</span>
                      </div>
                    )}
                  </div>
                )}
                {integ.status === 'disconnected' && (
                  <button className="w-full mt-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-xs font-medium">Connect</button>
                )}
                {integ.status === 'warning' && (
                  <button className="w-full mt-1 px-3 py-1.5 bg-warning/10 text-warning border border-warning/30 rounded-lg hover:bg-warning/20 text-xs font-medium">Reconnect</button>
                )}
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          {selectedIntegration ? (
            <div className="bg-card border border-border rounded-lg p-5">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{selectedIntegration.logo}</span>
                <div><h4 className="text-base font-semibold text-foreground">{selectedIntegration.name}</h4><p className="text-xs text-muted-foreground">{selectedIntegration.category}</p></div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{selectedIntegration.description}</p>
              {selectedIntegration.status === 'connected' && (
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Records Synced</span><span className="font-medium text-foreground">{selectedIntegration.recordsSync}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Last Sync</span><span className="font-medium text-foreground">{selectedIntegration.lastSync}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Health Score</span><span className="font-medium text-accent">{selectedIntegration.health}%</span></div>
                </div>
              )}
              <div className="mb-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Features</p>
                <div className="space-y-1">
                  {selectedIntegration.features?.map(f => (
                    <div key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-3.5 h-3.5 text-accent flex-shrink-0" /><span className="text-foreground">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 text-xs font-medium">
                  <Settings className="w-3.5 h-3.5" />Configure
                </button>
                <button className="p-2 border border-border rounded-lg hover:bg-muted/30">
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg p-5 flex flex-col items-center justify-center h-52 text-center">
              <Plug className="w-8 h-8 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">Select an integration to view details</p>
            </div>
          )}

          <div className="bg-card border border-border rounded-lg p-5">
            <h4 className="text-sm font-semibold text-foreground mb-3">Sync Activity</h4>
            <div className="space-y-3">
              {data.recent_activity?.map((a, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${activityStatusConfig[a.status]?.dot}`} />
                  <div>
                    <p className={`text-xs ${activityStatusConfig[a.status]?.text}`}>{a.event}</p>
                    <p className="text-xs text-muted-foreground">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
