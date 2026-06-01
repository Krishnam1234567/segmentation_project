import { useState, useEffect } from 'react';
import { Network, Building2, MapPin, AlertCircle } from 'lucide-react';
import { RiskBadge } from '../components/RiskBadge';
import { fetchFromAPI } from '../utils/api';

export function LegalDigitalTwin() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFromAPI('/digital-twin')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 flex items-center justify-center h-full text-muted-foreground">Loading digital twin...</div>;
  if (!data) return <div className="p-6 flex items-center justify-center h-full text-destructive">Failed to load digital twin data</div>;

  // Entities and directors fetched from API

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-1">Legal Digital Twin</h2>
        <p className="text-sm text-muted-foreground">Interactive organizational structure and legal entity mapping</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Entity Relationship Graph</h3>
          <div className="relative bg-muted/20 rounded-lg p-8" style={{ minHeight: '500px' }}>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-32">
                  <div className="bg-primary text-primary-foreground px-6 py-4 rounded-lg shadow-lg border-2 border-primary">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-6 h-6" />
                      <div>
                        <p className="font-semibold">Acme Corporation</p>
                        <p className="text-xs opacity-80">Parent Entity</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-24 mt-16">
                  <div className="bg-card border-2 border-primary/50 px-4 py-3 rounded-lg shadow-md">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-primary" />
                      <div><p className="text-sm font-medium">Acme EU Holdings</p><p className="text-xs text-muted-foreground">Netherlands</p></div>
                    </div>
                  </div>
                  <div className="bg-card border-2 border-primary/50 px-4 py-3 rounded-lg shadow-md">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-primary" />
                      <div><p className="text-sm font-medium">Acme Innovation Labs</p><p className="text-xs text-muted-foreground">California</p></div>
                    </div>
                  </div>
                  <div className="bg-card border-2 border-warning px-4 py-3 rounded-lg shadow-md">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-warning" />
                      <div><p className="text-sm font-medium">Acme APAC</p><p className="text-xs text-muted-foreground">Singapore</p></div>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-0 left-32 translate-y-32">
                  <div className="bg-card border-2 border-primary/50 px-4 py-3 rounded-lg shadow-md">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-primary" />
                      <div><p className="text-sm font-medium">Acme UK Limited</p><p className="text-xs text-muted-foreground">United Kingdom</p></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute bottom-4 left-4 bg-card border border-border rounded-lg p-3 text-xs">
              <p className="font-medium mb-2">Legend</p>
              <div className="space-y-1">
                <div className="flex items-center gap-2"><div className="w-3 h-3 border-2 border-primary rounded"></div><span>Low Risk</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 border-2 border-warning rounded"></div><span>Medium/High Risk</span></div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div><p className="text-sm text-muted-foreground">Total Entities</p><p className="text-2xl font-semibold text-foreground">{data.total_entities}</p></div>
              <div><p className="text-sm text-muted-foreground">Jurisdictions</p><p className="text-2xl font-semibold text-foreground">{data.total_jurisdictions}</p></div>
              <div><p className="text-sm text-muted-foreground">Active Directors</p><p className="text-2xl font-semibold text-foreground">{data.active_directors}</p></div>
              <div><p className="text-sm text-muted-foreground">Legal Exposure</p><p className="text-2xl font-semibold text-warning">{data.legal_exposure}</p></div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Risk Alerts</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-2 p-2 bg-warning/5 border border-warning/20 rounded">
                <AlertCircle className="w-4 h-4 text-warning mt-0.5" />
                <div><p className="text-xs font-medium text-foreground">APAC Entity High Risk</p><p className="text-xs text-muted-foreground">Regulatory compliance issues detected</p></div>
              </div>
              <div className="flex items-start gap-2 p-2 bg-primary/5 border border-primary/20 rounded">
                <AlertCircle className="w-4 h-4 text-primary mt-0.5" />
                <div><p className="text-xs font-medium text-foreground">Director Conflict Found</p><p className="text-xs text-muted-foreground">Alice Johnson on competing boards</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Legal Entities</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Entity Name</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Type</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Jurisdiction</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Risk</th>
              </tr></thead>
              <tbody>
                {data.entities.map((e) => (
                  <tr key={e.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 text-foreground">{e.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{e.type}</td>
                    <td className="py-3 px-4 text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{e.jurisdiction}</td>
                    <td className="py-3 px-4"><RiskBadge level={e.risk} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Directors & Officers</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Role</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Entities</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Conflicts</th>
              </tr></thead>
              <tbody>
                {data.directors.map((d, i) => (
                  <tr key={i} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 text-foreground font-medium">{d.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{d.role}</td>
                    <td className="py-3 px-4 text-muted-foreground">{d.entities}</td>
                    <td className="py-3 px-4">{d.conflicts > 0 ? <span className="text-warning">{d.conflicts}</span> : <span className="text-accent">0</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
