export function StatusChip({ status, label }) {
  const styles = {
    active: 'bg-primary/10 text-primary border-primary/20',
    pending: 'bg-warning/10 text-warning border-warning/20',
    completed: 'bg-accent/10 text-accent border-accent/20',
    expired: 'bg-muted text-muted-foreground border-border',
    compliant: 'bg-accent/10 text-accent border-accent/20',
    'non-compliant': 'bg-destructive/10 text-destructive border-destructive/20'
  };

  const labels = {
    active: 'Active',
    pending: 'Pending',
    completed: 'Completed',
    expired: 'Expired',
    compliant: 'Compliant',
    'non-compliant': 'Non-Compliant'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${styles[status]}`}>
      {label || labels[status]}
    </span>
  );
}
