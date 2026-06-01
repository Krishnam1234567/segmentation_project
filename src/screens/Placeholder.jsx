export function Placeholder({ title, description, icon: Icon }) {
  return (
    <div className="p-6 h-full flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="inline-flex p-6 bg-primary/10 rounded-full mb-4">
          <Icon className="w-12 h-12 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
        <button className="mt-6 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
          Coming Soon
        </button>
      </div>
    </div>
  );
}
