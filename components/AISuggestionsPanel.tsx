import { useState, useEffect } from 'react';
import { AIService } from '@/lib/ai-service';
import { AISuggestion } from '@/lib/types';
import { Brain, Lightbulb, AlertTriangle, CheckCircle, Settings, RefreshCw } from 'lucide-react';

interface AISuggestionsPanelProps {
  aiService: AIService | null;
}

export function AISuggestionsPanel({ aiService }: AISuggestionsPanelProps) {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [ruleRecommendations, setRuleRecommendations] = useState<AISuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'corrections' | 'rules'>('corrections');

  const loadSuggestions = async () => {
    if (!aiService) return;

    setIsLoading(true);
    try {
      const [corrections, rules] = await Promise.all([
        aiService.generateCorrectionSuggestions(),
        aiService.generateRuleRecommendations()
      ]);
      setSuggestions(corrections);
      setRuleRecommendations(rules);
    } catch (error) {
      console.error('Failed to load AI suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (aiService) {
      loadSuggestions();
    }
  }, [aiService]);

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'correction':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'rule':
        return <Settings className="h-5 w-5 text-blue-600" />;
      case 'optimization':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      default:
        return <Lightbulb className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getSuggestionColor = (type: string) => {
    switch (type) {
      case 'correction':
        return 'border-orange-200 bg-orange-50';
      case 'rule':
        return 'border-blue-200 bg-blue-50';
      case 'optimization':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-yellow-200 bg-yellow-50';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold mb-2">AI Insights & Suggestions</h2>
          <p className="text-muted-foreground">
            Get intelligent recommendations for your data and rules
          </p>
        </div>
        <button
          onClick={loadSuggestions}
          disabled={isLoading}
          className="btn-secondary flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('corrections')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'corrections'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Data Corrections ({suggestions.length})
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'rules'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Rule Recommendations ({ruleRecommendations.length})
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="card p-8 text-center">
          <RefreshCw className="h-16 w-16 text-muted-foreground mx-auto mb-4 animate-spin" />
          <h3 className="text-lg font-semibold mb-2">Analyzing Your Data</h3>
          <p className="text-muted-foreground">
            AI is analyzing patterns and generating recommendations...
          </p>
        </div>
      )}

      {/* Data Corrections */}
      {activeTab === 'corrections' && !isLoading && (
        <div className="space-y-4">
          {suggestions.length === 0 ? (
            <div className="card p-8 text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Corrections Needed</h3>
              <p className="text-muted-foreground">
                Your data looks good! No major issues detected.
              </p>
            </div>
          ) : (
            suggestions.map((suggestion, index) => (
              <div key={index} className={`card border-l-4 ${getSuggestionColor(suggestion.type)}`}>
                <div className="p-4">
                  <div className="flex items-start space-x-3">
                    {getSuggestionIcon(suggestion.type)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{suggestion.title}</h3>
                        <span className={`text-sm font-medium ${getConfidenceColor(suggestion.confidence)}`}>
                          {Math.round(suggestion.confidence * 100)}% confidence
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {suggestion.description}
                      </p>
                      {suggestion.action && (
                        <button
                          onClick={suggestion.action}
                          className="btn-primary text-sm"
                        >
                          Apply Suggestion
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Rule Recommendations */}
      {activeTab === 'rules' && !isLoading && (
        <div className="space-y-4">
          {ruleRecommendations.length === 0 ? (
            <div className="card p-8 text-center">
              <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Rule Recommendations</h3>
              <p className="text-muted-foreground">
                No patterns detected that would benefit from additional business rules.
              </p>
            </div>
          ) : (
            ruleRecommendations.map((recommendation, index) => (
              <div key={index} className={`card border-l-4 ${getSuggestionColor(recommendation.type)}`}>
                <div className="p-4">
                  <div className="flex items-start space-x-3">
                    {getSuggestionIcon(recommendation.type)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{recommendation.title}</h3>
                        <span className={`text-sm font-medium ${getConfidenceColor(recommendation.confidence)}`}>
                          {Math.round(recommendation.confidence * 100)}% confidence
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {recommendation.description}
                      </p>
                      {recommendation.data && (
                        <div className="bg-muted p-3 rounded-md mb-3">
                          <pre className="text-xs overflow-x-auto">
                            {JSON.stringify(recommendation.data, null, 2)}
                          </pre>
                        </div>
                      )}
                      {recommendation.action && (
                        <button
                          onClick={recommendation.action}
                          className="btn-primary text-sm"
                        >
                          Create Rule
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* AI Capabilities Info */}
      <div className="card p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Brain className="h-6 w-6 text-primary" />
          <h3 className="text-lg font-semibold">AI Capabilities</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium mb-2">Data Analysis</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Pattern detection in data</li>
              <li>• Anomaly identification</li>
              <li>• Data quality assessment</li>
              <li>• Optimization suggestions</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Rule Generation</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Co-occurrence analysis</li>
              <li>• Load distribution insights</li>
              <li>• Phase optimization</li>
              <li>• Natural language processing</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 