import { Database, CheckCircle, Settings, Target, Brain, Download } from 'lucide-react';

interface SidebarProps {
  activeTab: 'data' | 'validation' | 'rules' | 'priorities' | 'ai' | 'export';
  onTabChange: (tab: 'data' | 'validation' | 'rules' | 'priorities' | 'ai' | 'export') => void;
}

const tabs = [
  { id: 'data', label: 'Data Management', icon: Database },
  { id: 'validation', label: 'Validation', icon: CheckCircle },
  { id: 'rules', label: 'Business Rules', icon: Settings },
  { id: 'priorities', label: 'Prioritization', icon: Target },
  { id: 'ai', label: 'AI Features', icon: Brain },
  { id: 'export', label: 'Export', icon: Download },
] as const;

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside className="w-64 bg-card border-r border-border">
      <nav className="p-4 space-y-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{tab.label}</span>
            </button>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground">
          <p className="font-medium mb-2">Quick Tips:</p>
          <ul className="space-y-1">
            <li>• Upload CSV/XLSX files to get started</li>
            <li>• Use AI search for natural language queries</li>
            <li>• Set business rules to optimize allocation</li>
            <li>• Export clean data when ready</li>
          </ul>
        </div>
      </div>
    </aside>
  );
} 