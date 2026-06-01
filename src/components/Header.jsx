import { Search, Bell, User, Moon, Sun } from 'lucide-react';
import { useState } from 'react';

export function Header({ onThemeToggle, isDark }) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
      <div className="flex-1 max-w-2xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search contracts, entities, regulations... (⌘K)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-input-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 ml-6">
        <button
          onClick={onThemeToggle}
          className="p-2 hover:bg-accent/10 rounded-lg transition-colors"
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-foreground" />
          ) : (
            <Moon className="w-4 h-4 text-foreground" />
          )}
        </button>

        <button className="relative p-2 hover:bg-accent/10 rounded-lg transition-colors">
          <Bell className="w-4 h-4 text-foreground" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
        </button>

        <button className="flex items-center gap-2 pl-3 pr-4 py-2 hover:bg-accent/10 rounded-lg transition-colors">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <User className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="text-left">
            <div className="text-sm font-medium text-foreground">Admin User</div>
            <div className="text-xs text-muted-foreground">Enterprise</div>
          </div>
        </button>
      </div>
    </div>
  );
}
