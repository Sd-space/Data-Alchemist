import { Sparkles, Settings, HelpCircle } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold text-foreground">Data Alchemist</h1>
                <p className="text-sm text-muted-foreground">AI-Powered Resource Allocation</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors">
              <HelpCircle className="h-5 w-5" />
              <span className="hidden sm:inline">Help</span>
            </button>
            <button className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors">
              <Settings className="h-5 w-5" />
              <span className="hidden sm:inline">Settings</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
} 