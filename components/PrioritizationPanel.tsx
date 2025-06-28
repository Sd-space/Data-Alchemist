import { PrioritizationWeights } from '@/lib/types';
import { Target, TrendingUp, Users, Clock, Zap, DollarSign } from 'lucide-react';

interface PrioritizationPanelProps {
  weights: PrioritizationWeights;
  onWeightsChange: (weights: PrioritizationWeights) => void;
}

export function PrioritizationPanel({ weights, onWeightsChange }: PrioritizationPanelProps) {
  const criteria = [
    {
      key: 'priorityLevel' as keyof PrioritizationWeights,
      label: 'Priority Level',
      description: 'How much to prioritize high-priority clients',
      icon: Target,
      color: 'text-red-600'
    },
    {
      key: 'fulfillment' as keyof PrioritizationWeights,
      label: 'Request Fulfillment',
      description: 'How much to prioritize fulfilling all client requests',
      icon: TrendingUp,
      color: 'text-green-600'
    },
    {
      key: 'fairness' as keyof PrioritizationWeights,
      label: 'Fair Distribution',
      description: 'How much to ensure fair workload distribution',
      icon: Users,
      color: 'text-blue-600'
    },
    {
      key: 'workload' as keyof PrioritizationWeights,
      label: 'Workload Balance',
      description: 'How much to balance worker workloads',
      icon: Clock,
      color: 'text-purple-600'
    },
    {
      key: 'efficiency' as keyof PrioritizationWeights,
      label: 'Efficiency',
      description: 'How much to optimize for overall efficiency',
      icon: Zap,
      color: 'text-yellow-600'
    },
    {
      key: 'cost' as keyof PrioritizationWeights,
      label: 'Cost Optimization',
      description: 'How much to minimize costs',
      icon: DollarSign,
      color: 'text-gray-600'
    }
  ];

  const updateWeight = (key: keyof PrioritizationWeights, value: number) => {
    const newWeights = { ...weights, [key]: value };
    
    // Normalize weights to sum to 1
    const total = Object.values(newWeights).reduce((sum, weight) => sum + weight, 0);
    if (total > 0) {
      Object.keys(newWeights).forEach(k => {
        newWeights[k as keyof PrioritizationWeights] = newWeights[k as keyof PrioritizationWeights] / total;
      });
    }
    
    onWeightsChange(newWeights);
  };

  const resetWeights = () => {
    const equalWeights: PrioritizationWeights = {
      priorityLevel: 1/6,
      fulfillment: 1/6,
      fairness: 1/6,
      workload: 1/6,
      efficiency: 1/6,
      cost: 1/6
    };
    onWeightsChange(equalWeights);
  };

  const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Prioritization & Weights</h2>
        <button onClick={resetWeights} className="btn-secondary">
          Reset to Equal
        </button>
      </div>

      <div className="card p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Allocation Criteria</h3>
          <p className="text-sm text-muted-foreground">
            Adjust the importance of different factors in resource allocation. 
            Total weight: <span className="font-medium">{Math.round(totalWeight * 100)}%</span>
          </p>
        </div>

        <div className="space-y-6">
          {criteria.map((criterion) => {
            const Icon = criterion.icon;
            const currentWeight = weights[criterion.key];
            const percentage = Math.round(currentWeight * 100);

            return (
              <div key={criterion.key} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Icon className={`h-5 w-5 ${criterion.color}`} />
                    <div>
                      <h4 className="font-medium">{criterion.label}</h4>
                      <p className="text-sm text-muted-foreground">{criterion.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold">{percentage}%</div>
                    <div className="text-xs text-muted-foreground">
                      Weight: {currentWeight.toFixed(3)}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={currentWeight}
                    onChange={(e) => updateWeight(criterion.key, parseFloat(e.target.value))}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Low</span>
                    <span>High</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weight Distribution Visualization */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Weight Distribution</h3>
        <div className="space-y-3">
          {criteria.map((criterion) => {
            const currentWeight = weights[criterion.key];
            const percentage = Math.round(currentWeight * 100);
            const Icon = criterion.icon;

            return (
              <div key={criterion.key} className="flex items-center space-x-3">
                <Icon className={`h-4 w-4 ${criterion.color}`} />
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span>{criterion.label}</span>
                    <span>{percentage}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${criterion.color.replace('text-', 'bg-')}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Preset Profiles */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Preset Profiles</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => onWeightsChange({
              priorityLevel: 0.4,
              fulfillment: 0.3,
              fairness: 0.2,
              workload: 0.1,
              efficiency: 0.0,
              cost: 0.0
            })}
            className="card p-4 text-left hover:border-primary transition-colors"
          >
            <h4 className="font-semibold mb-2">Maximize Fulfillment</h4>
            <p className="text-sm text-muted-foreground">
              Prioritize completing all client requests with high priority focus
            </p>
          </button>

          <button
            onClick={() => onWeightsChange({
              priorityLevel: 0.2,
              fulfillment: 0.2,
              fairness: 0.4,
              workload: 0.2,
              efficiency: 0.0,
              cost: 0.0
            })}
            className="card p-4 text-left hover:border-primary transition-colors"
          >
            <h4 className="font-semibold mb-2">Fair Distribution</h4>
            <p className="text-sm text-muted-foreground">
              Ensure equal workload distribution across all workers
            </p>
          </button>

          <button
            onClick={() => onWeightsChange({
              priorityLevel: 0.1,
              fulfillment: 0.1,
              fairness: 0.1,
              workload: 0.1,
              efficiency: 0.6,
              cost: 0.0
            })}
            className="card p-4 text-left hover:border-primary transition-colors"
          >
            <h4 className="font-semibold mb-2">Optimize Efficiency</h4>
            <p className="text-sm text-muted-foreground">
              Focus on maximizing overall system efficiency and throughput
            </p>
          </button>
        </div>
      </div>
    </div>
  );
} 