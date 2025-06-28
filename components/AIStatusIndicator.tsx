import { useState, useEffect } from 'react';
import { Brain, Settings, AlertCircle, CheckCircle } from 'lucide-react';

interface AIStatusIndicatorProps {
  aiService: any;
}

export function AIStatusIndicator({ aiService }: AIStatusIndicatorProps) {
  const [aiStatus, setAiStatus] = useState<'enabled' | 'disabled' | 'error'>('disabled');
  const [apiKeyStatus, setApiKeyStatus] = useState<'configured' | 'missing' | 'invalid'>('missing');

  useEffect(() => {
    checkAIStatus();
  }, [aiService]);

  const checkAIStatus = async () => {
    try {
      // Check if OpenAI API key is configured
      const hasApiKey = process.env.OPENAI_API_KEY && 
                       process.env.OPENAI_API_KEY !== 'your_openai_api_key_here';
      
      if (hasApiKey) {
        setApiKeyStatus('configured');
        setAiStatus('enabled');
      } else {
        setApiKeyStatus('missing');
        setAiStatus('disabled');
      }
    } catch (error) {
      setAiStatus('error');
      setApiKeyStatus('invalid');
    }
  };

  const getStatusIcon = () => {
    switch (aiStatus) {
      case 'enabled':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'disabled':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Brain className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (aiStatus) {
      case 'enabled':
        return 'AI Enabled';
      case 'disabled':
        return 'AI Disabled';
      case 'error':
        return 'AI Error';
      default:
        return 'AI Unknown';
    }
  };

  const getStatusDescription = () => {
    switch (apiKeyStatus) {
      case 'configured':
        return 'OpenAI API configured. Full AI features available.';
      case 'missing':
        return 'OpenAI API key not configured. Using fallback features.';
      case 'invalid':
        return 'OpenAI API key invalid. Check configuration.';
      default:
        return 'AI status unknown.';
    }
  };

  return (
    <div className="flex items-center space-x-2 p-2 bg-muted/50 rounded-lg">
      {getStatusIcon()}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">{getStatusText()}</span>
          <span className="text-xs text-muted-foreground">
            {apiKeyStatus === 'configured' ? 'GPT-4' : 'Fallback'}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {getStatusDescription()}
        </p>
      </div>
      {apiKeyStatus === 'missing' && (
        <button
          onClick={() => window.open('https://platform.openai.com/api-keys', '_blank')}
          className="text-xs text-primary hover:text-primary/80 underline"
        >
          Get API Key
        </button>
      )}
    </div>
  );
} 