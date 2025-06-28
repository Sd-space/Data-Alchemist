import { useState } from 'react';
import { AIService } from '@/lib/ai-service';
import { SearchResult } from '@/lib/types';
import { Search, Filter, Database, User, Briefcase } from 'lucide-react';

interface AISearchPanelProps {
  aiService: AIService | null;
}

export function AISearchPanel({ aiService }: AISearchPanelProps) {
  const [query, setQuery] = useState('');
  const [entityType, setEntityType] = useState<'all' | 'client' | 'worker' | 'task'>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!aiService || !query.trim()) return;

    setIsSearching(true);
    try {
      const searchResults = await aiService.searchData({
        query: query.trim(),
        entityType: entityType === 'all' ? undefined : entityType
      });
      setResults(searchResults);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getEntityIcon = (entity: string) => {
    switch (entity) {
      case 'client':
        return <User className="h-4 w-4" />;
      case 'worker':
        return <Briefcase className="h-4 w-4" />;
      case 'task':
        return <Database className="h-4 w-4" />;
      default:
        return <Database className="h-4 w-4" />;
    }
  };

  const getEntityColor = (entity: string) => {
    switch (entity) {
      case 'client':
        return 'text-blue-600 bg-blue-50';
      case 'worker':
        return 'text-green-600 bg-green-50';
      case 'task':
        return 'text-purple-600 bg-purple-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const exampleQueries = [
    "clients with priority level 5",
    "workers with programming skills",
    "tasks with duration more than 3 phases",
    "high priority clients requesting multiple tasks",
    "workers available in phase 2",
    "tasks requiring specific skills"
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">AI-Powered Search</h2>
        <p className="text-muted-foreground">
          Search your data using natural language queries
        </p>
      </div>

      {/* Search Input */}
      <div className="card p-6">
        <div className="space-y-4">
          <div className="flex space-x-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Search for clients, workers, or tasks using natural language..."
                  className="input pl-10"
                />
              </div>
            </div>
            <select
              value={entityType}
              onChange={(e) => setEntityType(e.target.value as any)}
              className="input"
            >
              <option value="all">All Entities</option>
              <option value="client">Clients Only</option>
              <option value="worker">Workers Only</option>
              <option value="task">Tasks Only</option>
            </select>
            <button
              onClick={handleSearch}
              disabled={isSearching || !query.trim()}
              className="btn-primary flex items-center space-x-2"
            >
              <Search className="h-4 w-4" />
              <span>{isSearching ? 'Searching...' : 'Search'}</span>
            </button>
          </div>

          {/* Example Queries */}
          <div>
            <p className="text-sm font-medium mb-2">Example queries:</p>
            <div className="flex flex-wrap gap-2">
              {exampleQueries.map((example, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setQuery(example);
                    handleSearch();
                  }}
                  className="text-xs px-2 py-1 bg-muted rounded hover:bg-muted/80 transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Search Results */}
      {results.length > 0 && (
        <div className="card">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold">
              Search Results ({results.length})
            </h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {results.map((result, index) => (
              <div key={index} className="p-4 border-b border-border last:border-b-0 hover:bg-muted/50">
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded ${getEntityColor(result.entity)}`}>
                    {getEntityIcon(result.entity)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium">{result.entityId}</span>
                      <span className="text-xs px-2 py-1 bg-muted rounded capitalize">
                        {result.entity}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Score: {Math.round(result.score)}
                      </span>
                    </div>
                    
                    <div className="text-sm text-muted-foreground mb-2">
                      {Object.entries(result.data).map(([key, value]) => (
                        <span key={key} className="mr-4">
                          <span className="font-medium">{key}:</span> {String(value)}
                        </span>
                      ))}
                    </div>

                    {result.matchedFields.length > 0 && (
                      <div className="text-xs text-blue-600">
                        Matched fields: {result.matchedFields.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {query && results.length === 0 && !isSearching && (
        <div className="card p-8 text-center">
          <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search query or filters
          </p>
        </div>
      )}
    </div>
  );
} 