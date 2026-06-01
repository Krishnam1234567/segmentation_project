export function StatCard({ title, value, change, changeType = 'neutral', icon: Icon, iconColor }) {
  const changeColors = {
    positive: 'text-accent',
    negative: 'text-destructive',
    neutral: 'text-muted-foreground'
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-2xl font-semibold text-foreground mb-2">{value}</p>
          {change && (
            <p className={`text-sm ${changeColors[changeType]}`}>
              {change}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg ${iconColor || 'bg-primary/10'}`}>
            <Icon className={`w-5 h-5 ${iconColor ? '' : 'text-primary'}`} />
          </div>
        )}
      </div>
    </div>
  );
}
