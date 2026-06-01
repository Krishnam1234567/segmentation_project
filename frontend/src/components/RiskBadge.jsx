export function RiskBadge({ level, label }) {
  const styles = {
    low: 'bg-accent/10 text-accent border-accent/20',
    medium: 'bg-warning/10 text-warning border-warning/20',
    high: 'bg-destructive/10 text-destructive border-destructive/20',
    critical: 'bg-destructive text-destructive-foreground border-destructive'
  };

  const labels = {
    low: 'Low Risk',
    medium: 'Medium Risk',
    high: 'High Risk',
    critical: 'Critical'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${styles[level]}`}>
      {label || labels[level]}
    </span>
  );
}
