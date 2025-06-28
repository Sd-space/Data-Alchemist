export interface Client {
  ClientID: string;
  ClientName: string;
  PriorityLevel: number;
  RequestedTaskIDs: string;
  GroupTag: string;
  AttributesJSON: string;
}

export interface Worker {
  WorkerID: string;
  WorkerName: string;
  Skills: string;
  AvailableSlots: string;
  MaxLoadPerPhase: number;
  WorkerGroup: string;
  QualificationLevel: number;
}

export interface Task {
  TaskID: string;
  TaskName: string;
  Category: string;
  Duration: number;
  RequiredSkills: string;
  PreferredPhases: string;
  MaxConcurrent: number;
}

export interface ValidationError {
  type: 'error' | 'warning' | 'info';
  message: string;
  entity: 'client' | 'worker' | 'task';
  entityId: string;
  field?: string;
  row?: number;
  column?: string;
  suggestion?: string;
}

export interface ValidationSummary {
  totalErrors: number;
  totalWarnings: number;
  totalInfo: number;
  errors: ValidationError[];
  warnings: ValidationError[];
  info: ValidationError[];
}

export interface BusinessRule {
  id: string;
  type: 'coRun' | 'slotRestriction' | 'loadLimit' | 'phaseWindow' | 'patternMatch' | 'precedenceOverride';
  name: string;
  description: string;
  config: any;
  priority: number;
  enabled: boolean;
}

export interface PrioritizationWeights {
  priorityLevel: number;
  fulfillment: number;
  fairness: number;
  workload: number;
  efficiency: number;
  cost: number;
}

export interface DataState {
  clients: Client[];
  workers: Worker[];
  tasks: Task[];
  validationSummary: ValidationSummary;
  businessRules: BusinessRule[];
  prioritizationWeights: PrioritizationWeights;
  isLoading: boolean;
  hasData: boolean;
}

export interface AISuggestion {
  type: 'validation' | 'rule' | 'correction' | 'optimization';
  title: string;
  description: string;
  confidence: number;
  action?: () => void;
  data?: any;
}

export interface SearchResult {
  entity: 'client' | 'worker' | 'task';
  entityId: string;
  matchedFields: string[];
  score: number;
  data: Client | Worker | Task;
}

export interface ExportData {
  clients: Client[];
  workers: Worker[];
  tasks: Task[];
  rules: BusinessRule[];
  weights: PrioritizationWeights;
  validationSummary: ValidationSummary;
}

// AI Service Types
export interface AIServiceConfig {
  apiKey?: string;
  model?: string;
  temperature?: number;
}

export interface AIParsingResult {
  success: boolean;
  mappedData: any[];
  confidence: number;
  suggestions: string[];
}

export interface AISearchQuery {
  query: string;
  entityType?: 'client' | 'worker' | 'task' | 'all';
  filters?: Record<string, any>;
}

export interface AIRuleGeneration {
  ruleType: string;
  parameters: Record<string, any>;
  confidence: number;
  explanation: string;
} 