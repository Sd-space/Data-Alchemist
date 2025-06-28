import { useState } from 'react';
import { BusinessRule, Client, Worker, Task } from '@/lib/types';
import { AIService } from '@/lib/ai-service';
import { Plus, Trash2, Edit, Save, X, Brain, MessageSquare } from 'lucide-react';

interface BusinessRulesPanelProps {
  rules: BusinessRule[];
  onRulesChange: (rules: BusinessRule[]) => void;
  clients: Client[];
  workers: Worker[];
  tasks: Task[];
  aiService: AIService | null;
}

export function BusinessRulesPanel({ rules, onRulesChange, clients, workers, tasks, aiService }: BusinessRulesPanelProps) {
  const [editingRule, setEditingRule] = useState<BusinessRule | null>(null);
  const [showNaturalLanguage, setShowNaturalLanguage] = useState(false);
  const [naturalLanguageInput, setNaturalLanguageInput] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);

  const ruleTypes = [
    { value: 'coRun', label: 'Co-Run', description: 'Tasks that must run together' },
    { value: 'slotRestriction', label: 'Slot Restriction', description: 'Restrict slots for groups' },
    { value: 'loadLimit', label: 'Load Limit', description: 'Limit load per phase for groups' },
    { value: 'phaseWindow', label: 'Phase Window', description: 'Restrict tasks to specific phases' },
    { value: 'patternMatch', label: 'Pattern Match', description: 'Apply rules based on patterns' },
    { value: 'precedenceOverride', label: 'Precedence Override', description: 'Override default precedence' }
  ];

  const addRule = () => {
    const newRule: BusinessRule = {
      id: `rule_${Date.now()}`,
      type: 'coRun',
      name: 'New Rule',
      description: '',
      config: {},
      priority: rules.length + 1,
      enabled: true
    };
    onRulesChange([...rules, newRule]);
    setEditingRule(newRule);
  };

  const updateRule = (updatedRule: BusinessRule) => {
    const updatedRules = rules.map(rule => 
      rule.id === updatedRule.id ? updatedRule : rule
    );
    onRulesChange(updatedRules);
  };

  const deleteRule = (ruleId: string) => {
    onRulesChange(rules.filter(rule => rule.id !== ruleId));
  };

  const handleNaturalLanguageSubmit = async () => {
    if (!aiService || !naturalLanguageInput.trim()) return;

    setIsProcessingAI(true);
    try {
      const result = await aiService.parseNaturalLanguageRule(naturalLanguageInput);
      if (result) {
        const newRule: BusinessRule = {
          id: `rule_${Date.now()}`,
          type: result.ruleType as any,
          name: `AI Generated Rule`,
          description: result.explanation,
          config: result.parameters,
          priority: rules.length + 1,
          enabled: true
        };
        onRulesChange([...rules, newRule]);
        setNaturalLanguageInput('');
        setShowNaturalLanguage(false);
      }
    } catch (error) {
      console.error('AI rule generation failed:', error);
    } finally {
      setIsProcessingAI(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Business Rules</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowNaturalLanguage(true)}
            className="btn-secondary flex items-center space-x-2"
          >
            <Brain className="h-4 w-4" />
            <span>AI Assistant</span>
          </button>
          <button
            onClick={addRule}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Rule</span>
          </button>
        </div>
      </div>

      {/* Natural Language Input */}
      {showNaturalLanguage && (
        <div className="card p-4">
          <div className="flex items-center space-x-2 mb-3">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Natural Language Rule Input</h3>
          </div>
          <div className="space-y-3">
            <textarea
              value={naturalLanguageInput}
              onChange={(e) => setNaturalLanguageInput(e.target.value)}
              placeholder="Describe your rule in plain English... (e.g., 'Tasks T1 and T2 must run together')"
              className="w-full p-3 border rounded-md resize-none"
              rows={3}
            />
            <div className="flex space-x-2">
              <button
                onClick={handleNaturalLanguageSubmit}
                disabled={isProcessingAI || !naturalLanguageInput.trim()}
                className="btn-primary flex items-center space-x-2"
              >
                <Brain className="h-4 w-4" />
                <span>{isProcessingAI ? 'Processing...' : 'Generate Rule'}</span>
              </button>
              <button
                onClick={() => {
                  setShowNaturalLanguage(false);
                  setNaturalLanguageInput('');
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rules List */}
      <div className="space-y-4">
        {rules.length === 0 ? (
          <div className="card p-8 text-center">
            <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Business Rules</h3>
            <p className="text-muted-foreground mb-4">
              Create business rules to optimize your resource allocation.
            </p>
            <button onClick={addRule} className="btn-primary">
              Create Your First Rule
            </button>
          </div>
        ) : (
          rules.map((rule) => (
            <div key={rule.id} className="card">
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={(e) => updateRule({ ...rule, enabled: e.target.checked })}
                      className="rounded"
                    />
                    <div>
                      <h3 className="font-semibold">{rule.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {ruleTypes.find(t => t.value === rule.type)?.label} • Priority: {rule.priority}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingRule(editingRule?.id === rule.id ? null : rule)}
                      className="p-2 text-muted-foreground hover:text-foreground"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteRule(rule.id)}
                      className="p-2 text-destructive hover:text-destructive/80"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {editingRule?.id === rule.id && (
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Name</label>
                      <input
                        type="text"
                        value={rule.name}
                        onChange={(e) => updateRule({ ...rule, name: e.target.value })}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Type</label>
                      <select
                        value={rule.type}
                        onChange={(e) => updateRule({ ...rule, type: e.target.value as any })}
                        className="input"
                      >
                        {ruleTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={rule.description}
                      onChange={(e) => updateRule({ ...rule, description: e.target.value })}
                      className="input resize-none"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Priority</label>
                      <input
                        type="number"
                        value={rule.priority}
                        onChange={(e) => updateRule({ ...rule, priority: parseInt(e.target.value) })}
                        className="input"
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingRule(null)}
                      className="btn-secondary"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}

              {!editingRule && rule.description && (
                <div className="p-4 pt-0">
                  <p className="text-sm text-muted-foreground">{rule.description}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
} 