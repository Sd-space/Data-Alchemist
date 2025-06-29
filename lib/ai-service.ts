import { Client, Worker, Task, AISearchQuery, SearchResult, AISuggestion, AIRuleGeneration, AIParsingResult } from './types';
import OpenAI from 'openai';

export class AIService {
  private clients: Client[] = [];
  private workers: Worker[] = [];
  private tasks: Task[] = [];
  private openai: OpenAI | null = null;

  constructor(clients: Client[], workers: Worker[], tasks: Task[]) {
    this.clients = clients;
    this.workers = workers;
    this.tasks = tasks;
    
    // Initialize OpenAI if API key is available
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  // Natural Language Search with OpenAI
  async searchData(query: AISearchQuery): Promise<SearchResult[]> {
    if (!this.openai) {
      return this.fallbackSearch(query);
    }

    try {
      const prompt = this.buildSearchPrompt(query);
      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a data search assistant. Analyze the query and return relevant data in JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.3'),
        max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2000'),
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        try {
          const aiResults = JSON.parse(content);
          return this.processAISearchResults(aiResults, query);
        } catch (parseError) {
          console.warn('Failed to parse AI search results, falling back to basic search');
          return this.fallbackSearch(query);
        }
      }
    } catch (error) {
      console.error('OpenAI search failed:', error);
    }

    return this.fallbackSearch(query);
  }

  private buildSearchPrompt(query: AISearchQuery): string {
    const dataSummary = {
      clients: this.clients.length,
      workers: this.workers.length,
      tasks: this.tasks.length,
      sampleData: {
        clients: this.clients.slice(0, 3),
        workers: this.workers.slice(0, 3),
        tasks: this.tasks.slice(0, 3)
      }
    };

    return `
Query: "${query.query}"
Entity Type: ${query.entityType || 'all'}

Available Data:
- ${dataSummary.clients} clients
- ${dataSummary.workers} workers  
- ${dataSummary.tasks} tasks

Sample Data:
${JSON.stringify(dataSummary.sampleData, null, 2)}

Please analyze this query and return relevant results in the following JSON format:
{
  "results": [
    {
      "entity": "client|worker|task",
      "entityId": "id",
      "reason": "why this matches",
      "score": 0.95
    }
  ]
}

Focus on semantic meaning and context, not just exact text matches.
`;
  }

  private processAISearchResults(aiResults: any, query: AISearchQuery): SearchResult[] {
    const results: SearchResult[] = [];
    
    if (aiResults.results && Array.isArray(aiResults.results)) {
      aiResults.results.forEach((result: any) => {
        let entityData: Client | Worker | Task | null = null;
        
        switch (result.entity) {
          case 'client':
            entityData = this.clients.find(c => c.ClientID === result.entityId);
            break;
          case 'worker':
            entityData = this.workers.find(w => w.WorkerID === result.entityId);
            break;
          case 'task':
            entityData = this.tasks.find(t => t.TaskID === result.entityId);
            break;
        }

        if (entityData) {
          results.push({
            entity: result.entity,
            entityId: result.entityId,
            matchedFields: this.extractMatchedFields(entityData, result.reason),
            score: result.score || 0.5,
            data: entityData
          });
        }
      });
    }

    return results.sort((a, b) => b.score - a.score);
  }

  private extractMatchedFields(entity: any, reason: string): string[] {
    const fields: string[] = [];
    const reasonLower = reason.toLowerCase();
    
    Object.keys(entity).forEach(key => {
      const value = String(entity[key]).toLowerCase();
      if (reasonLower.includes(value) || value.includes(reasonLower)) {
        fields.push(key);
      }
    });

    return fields;
  }

  // Fallback search when AI is not available
  private fallbackSearch(query: AISearchQuery): SearchResult[] {
    const results: SearchResult[] = [];
    const searchTerms = query.query.toLowerCase().split(' ');

    // Search in clients
    if (!query.entityType || query.entityType === 'client' || query.entityType === 'all') {
      this.clients.forEach(client => {
        const score = this.calculateSearchScore(client, searchTerms);
        if (score > 0) {
          results.push({
            entity: 'client',
            entityId: client.ClientID,
            matchedFields: this.getMatchedFields(client, searchTerms),
            score,
            data: client
          });
        }
      });
    }

    // Search in workers
    if (!query.entityType || query.entityType === 'worker' || query.entityType === 'all') {
      this.workers.forEach(worker => {
        const score = this.calculateSearchScore(worker, searchTerms);
        if (score > 0) {
          results.push({
            entity: 'worker',
            entityId: worker.WorkerID,
            matchedFields: this.getMatchedFields(worker, searchTerms),
            score,
            data: worker
          });
        }
      });
    }

    // Search in tasks
    if (!query.entityType || query.entityType === 'task' || query.entityType === 'all') {
      this.tasks.forEach(task => {
        const score = this.calculateSearchScore(task, searchTerms);
        if (score > 0) {
          results.push({
            entity: 'task',
            entityId: task.TaskID,
            matchedFields: this.getMatchedFields(task, searchTerms),
            score,
            data: task
          });
        }
      });
    }

    return results.sort((a, b) => b.score - a.score).slice(0, 20);
  }

  private calculateSearchScore(entity: any, searchTerms: string[]): number {
    let score = 0;
    const entityText = JSON.stringify(entity).toLowerCase();

    searchTerms.forEach(term => {
      if (entityText.includes(term)) {
        score += 10;
      }
      
      if (term.length > 2) {
        const partialMatches = entityText.match(new RegExp(term, 'g'));
        if (partialMatches) {
          score += partialMatches.length * 5;
        }
      }

      Object.keys(entity).forEach(key => {
        const fieldValue = String(entity[key]).toLowerCase();
        if (fieldValue.includes(term)) {
          score += 15;
        }
      });
    });

    return score;
  }

  private getMatchedFields(entity: any, searchTerms: string[]): string[] {
    const matchedFields: string[] = [];
    
    Object.keys(entity).forEach(key => {
      const fieldValue = String(entity[key]).toLowerCase();
      if (searchTerms.some(term => fieldValue.includes(term))) {
        matchedFields.push(key);
      }
    });

    return matchedFields;
  }

  // AI-Powered Data Correction Suggestions
  async generateCorrectionSuggestions(): Promise<AISuggestion[]> {
    if (!this.openai) {
      return this.fallbackCorrectionSuggestions();
    }

    try {
      const prompt = this.buildCorrectionPrompt();
      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a data quality expert. Analyze the data and provide actionable suggestions for improvement.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.3'),
        max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2000'),
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        try {
          const aiSuggestions = JSON.parse(content);
          return this.processAICorrectionSuggestions(aiSuggestions);
        } catch (parseError) {
          console.warn('Failed to parse AI correction suggestions, falling back to basic analysis');
          return this.fallbackCorrectionSuggestions();
        }
      }
    } catch (error) {
      console.error('OpenAI correction suggestions failed:', error);
    }

    return this.fallbackCorrectionSuggestions();
  }

  private buildCorrectionPrompt(): string {
    const dataSummary = {
      clients: this.clients.length,
      workers: this.workers.length,
      tasks: this.tasks.length,
      sampleData: {
        clients: this.clients.slice(0, 5),
        workers: this.workers.slice(0, 5),
        tasks: this.tasks.slice(0, 5)
      }
    };

    return `
Analyze this resource allocation data and provide suggestions for improvement:

Data Summary:
- ${dataSummary.clients} clients
- ${dataSummary.workers} workers
- ${dataSummary.tasks} tasks

Sample Data:
${JSON.stringify(dataSummary.sampleData, null, 2)}

Please provide suggestions in the following JSON format:
{
  "suggestions": [
    {
      "type": "correction|optimization|validation",
      "title": "Suggestion Title",
      "description": "Detailed description of the issue and solution",
      "confidence": 0.85,
      "priority": "high|medium|low",
      "affectedEntities": ["client", "worker", "task"],
      "actionableSteps": ["step1", "step2"]
    }
  ]
}

Focus on:
1. Data quality issues
2. Missing relationships
3. Optimization opportunities
4. Potential conflicts
5. Resource allocation improvements
`;
  }

  private processAICorrectionSuggestions(aiSuggestions: any): AISuggestion[] {
    const suggestions: AISuggestion[] = [];
    
    if (aiSuggestions.suggestions && Array.isArray(aiSuggestions.suggestions)) {
      aiSuggestions.suggestions.forEach((suggestion: any) => {
        suggestions.push({
          type: suggestion.type || 'correction',
          title: suggestion.title,
          description: suggestion.description,
          confidence: suggestion.confidence || 0.5,
          data: {
            priority: suggestion.priority,
            affectedEntities: suggestion.affectedEntities,
            actionableSteps: suggestion.actionableSteps
          }
        });
      });
    }

    return suggestions;
  }

  private fallbackCorrectionSuggestions(): AISuggestion[] {
    const suggestions: AISuggestion[] = [];

    // Analyze patterns and suggest corrections
    suggestions.push(...this.analyzeClientPatterns());
    suggestions.push(...this.analyzeWorkerPatterns());
    suggestions.push(...this.analyzeTaskPatterns());

    return suggestions;
  }

  private analyzeClientPatterns(): AISuggestion[] {
    const suggestions: AISuggestion[] = [];

    // Check for clients with similar names
    const clientNames = this.clients.map(c => c.ClientName.toLowerCase());
    const duplicates = clientNames.filter((name, index) => clientNames.indexOf(name) !== index);
    
    if (duplicates.length > 0) {
      suggestions.push({
        type: 'correction',
        title: 'Potential Duplicate Client Names',
        description: `Found ${duplicates.length} clients with similar names. Consider merging or renaming.`,
        confidence: 0.8,
        data: { duplicates }
      });
    }

    // Check for clients with no requested tasks
    const clientsWithNoTasks = this.clients.filter(c => !c.RequestedTaskIDs.trim());
    if (clientsWithNoTasks.length > 0) {
      suggestions.push({
        type: 'correction',
        title: 'Clients Without Requested Tasks',
        description: `${clientsWithNoTasks.length} clients have no requested tasks.`,
        confidence: 0.9,
        data: { clients: clientsWithNoTasks }
      });
    }

    return suggestions;
  }

  private analyzeWorkerPatterns(): AISuggestion[] {
    const suggestions: AISuggestion[] = [];

    // Check for workers with overlapping skills
    const skillGroups = new Map<string, string[]>();
    this.workers.forEach(worker => {
      const skills = worker.Skills.split(',').map(s => s.trim());
      skills.forEach(skill => {
        if (!skillGroups.has(skill)) {
          skillGroups.set(skill, []);
        }
        skillGroups.get(skill)!.push(worker.WorkerID);
      });
    });

    // Find skills with only one worker
    const singleWorkerSkills = Array.from(skillGroups.entries())
      .filter(([_, workers]) => workers.length === 1)
      .map(([skill, workers]) => ({ skill, worker: workers[0] }));

    if (singleWorkerSkills.length > 0) {
      suggestions.push({
        type: 'correction',
        title: 'Critical Skill Coverage',
        description: `${singleWorkerSkills.length} skills are only available from one worker each.`,
        confidence: 0.85,
        data: { singleWorkerSkills }
      });
    }

    return suggestions;
  }

  private analyzeTaskPatterns(): AISuggestion[] {
    const suggestions: AISuggestion[] = [];

    // Check for tasks with very high duration
    const longTasks = this.tasks.filter(t => t.Duration > 8);
    if (longTasks.length > 0) {
      suggestions.push({
        type: 'correction',
        title: 'Long Duration Tasks',
        description: `${longTasks.length} tasks have very long durations (>8 phases). Consider breaking them down.`,
        confidence: 0.7,
        data: { tasks: longTasks }
      });
    }

    // Check for tasks with high concurrency requirements
    const highConcurrencyTasks = this.tasks.filter(t => t.MaxConcurrent > 5);
    if (highConcurrencyTasks.length > 0) {
      suggestions.push({
        type: 'correction',
        title: 'High Concurrency Tasks',
        description: `${highConcurrencyTasks.length} tasks require high concurrency (>5 workers).`,
        confidence: 0.75,
        data: { tasks: highConcurrencyTasks }
      });
    }

    return suggestions;
  }

  // AI Rule Recommendations
  async generateRuleRecommendations(): Promise<AISuggestion[]> {
    const suggestions: AISuggestion[] = [];

    // Analyze co-run patterns
    suggestions.push(...this.analyzeCoRunPatterns());
    
    // Analyze load distribution
    suggestions.push(...this.analyzeLoadPatterns());
    
    // Analyze phase preferences
    suggestions.push(...this.analyzePhasePatterns());

    return suggestions;
  }

  private analyzeCoRunPatterns(): AISuggestion[] {
    const suggestions: AISuggestion[] = [];

    // Find tasks that are often requested together
    const taskRequestCounts = new Map<string, number>();
    const taskCoOccurrences = new Map<string, Map<string, number>>();

    this.clients.forEach(client => {
      const requestedTasks = client.RequestedTaskIDs.split(',').map(id => id.trim());
      
      requestedTasks.forEach(taskId => {
        if (taskId) {
          taskRequestCounts.set(taskId, (taskRequestCounts.get(taskId) || 0) + 1);
          
          if (!taskCoOccurrences.has(taskId)) {
            taskCoOccurrences.set(taskId, new Map());
          }
          
          requestedTasks.forEach(otherTaskId => {
            if (otherTaskId && otherTaskId !== taskId) {
              const current = taskCoOccurrences.get(taskId)!.get(otherTaskId) || 0;
              taskCoOccurrences.get(taskId)!.set(otherTaskId, current + 1);
            }
          });
        }
      });
    });

    // Find high co-occurrence pairs
    const highCoOccurrencePairs: Array<{task1: string, task2: string, count: number}> = [];
    taskCoOccurrences.forEach((coOccurrences, taskId) => {
      coOccurrences.forEach((count, otherTaskId) => {
        if (count >= 3) { // At least 3 clients request both tasks
          highCoOccurrencePairs.push({ task1: taskId, task2: otherTaskId, count });
        }
      });
    });

    if (highCoOccurrencePairs.length > 0) {
      suggestions.push({
        type: 'rule',
        title: 'Co-Run Rule Recommendations',
        description: `Found ${highCoOccurrencePairs.length} task pairs that are frequently requested together.`,
        confidence: 0.8,
        data: { coRunPairs: highCoOccurrencePairs }
      });
    }

    return suggestions;
  }

  private analyzeLoadPatterns(): AISuggestion[] {
    const suggestions: AISuggestion[] = [];

    // Analyze worker group load distribution
    const groupLoads = new Map<string, { totalSlots: number, maxLoad: number }>();
    
    this.workers.forEach(worker => {
      if (!groupLoads.has(worker.WorkerGroup)) {
        groupLoads.set(worker.WorkerGroup, { totalSlots: 0, maxLoad: 0 });
      }
      
      try {
        const slots = JSON.parse(worker.AvailableSlots);
        const current = groupLoads.get(worker.WorkerGroup)!;
        current.totalSlots += slots.length;
        current.maxLoad += worker.MaxLoadPerPhase;
      } catch {
        // Skip invalid data
      }
    });

    // Find overloaded groups
    const overloadedGroups = Array.from(groupLoads.entries())
      .filter(([_, data]) => data.maxLoad > data.totalSlots * 0.8);

    if (overloadedGroups.length > 0) {
      suggestions.push({
        type: 'rule',
        title: 'Load Limit Recommendations',
        description: `${overloadedGroups.length} worker groups may be overloaded. Consider load limits.`,
        confidence: 0.75,
        data: { overloadedGroups }
      });
    }

    return suggestions;
  }

  private analyzePhasePatterns(): AISuggestion[] {
    const suggestions: AISuggestion[] = [];

    // Analyze phase preferences across tasks
    const phasePreferences = new Map<number, number>();
    
    this.tasks.forEach(task => {
      try {
        let phases: number[] = [];
        
        // Try to parse as JSON array
        try {
          phases = JSON.parse(task.PreferredPhases);
        } catch {
          // Try to parse as range
          const rangeMatch = task.PreferredPhases.match(/^(\d+)-(\d+)$/);
          if (rangeMatch) {
            const start = parseInt(rangeMatch[1]);
            const end = parseInt(rangeMatch[2]);
            phases = Array.from({ length: end - start + 1 }, (_, i) => start + i);
          }
        }
        
        phases.forEach(phase => {
          phasePreferences.set(phase, (phasePreferences.get(phase) || 0) + 1);
        });
      } catch {
        // Skip invalid data
      }
    });

    // Find phases with high demand
    const highDemandPhases = Array.from(phasePreferences.entries())
      .filter(([_, count]) => count > this.tasks.length * 0.3);

    if (highDemandPhases.length > 0) {
      suggestions.push({
        type: 'rule',
        title: 'Phase Window Recommendations',
        description: `${highDemandPhases.length} phases have high task demand. Consider phase restrictions.`,
        confidence: 0.7,
        data: { highDemandPhases }
      });
    }

    return suggestions;
  }

  // Natural Language Rule Parsing with OpenAI
  async parseNaturalLanguageRule(naturalText: string): Promise<AIRuleGeneration | null> {
    if (!this.openai) {
      return this.fallbackRuleParsing(naturalText);
    }

    try {
      const prompt = this.buildRuleParsingPrompt(naturalText);
      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a business rule expert. Convert natural language descriptions into structured business rules.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.3'),
        max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2000'),
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        try {
          const aiRule = JSON.parse(content);
          return this.processAIRuleGeneration(aiRule);
        } catch (parseError) {
          console.warn('Failed to parse AI rule generation, falling back to basic parsing');
          return this.fallbackRuleParsing(naturalText);
        }
      }
    } catch (error) {
      console.error('OpenAI rule parsing failed:', error);
    }

    return this.fallbackRuleParsing(naturalText);
  }

  private buildRuleParsingPrompt(naturalText: string): string {
    const availableData = {
      tasks: this.tasks.map(t => ({ id: t.TaskID, name: t.TaskName, category: t.Category })),
      workers: this.workers.map(w => ({ id: w.WorkerID, name: w.WorkerName, skills: w.Skills, group: w.WorkerGroup })),
      clients: this.clients.map(c => ({ id: c.ClientID, name: c.ClientName, priority: c.PriorityLevel }))
    };

    return `
Natural Language Rule: "${naturalText}"

Available Data:
${JSON.stringify(availableData, null, 2)}

Please convert this natural language rule into a structured business rule in the following JSON format:
{
  "ruleType": "coRun|slotRestriction|loadLimit|phaseWindow|patternMatch|precedenceOverride",
  "parameters": {
    "taskIds": ["task1", "task2"],
    "workerGroups": ["group1", "group2"],
    "phases": [1, 2, 3],
    "maxLoad": 5,
    "priority": 1
  },
  "confidence": 0.85,
  "explanation": "Explanation of how this rule was interpreted"
}

Rule Types:
- coRun: Tasks that must run together
- slotRestriction: Workers restricted to specific time slots
- loadLimit: Maximum workload per worker/phase
- phaseWindow: Tasks must run in specific phases
- patternMatch: Pattern-based task assignment
- precedenceOverride: Override default precedence rules
`;
  }

  private processAIRuleGeneration(aiRule: any): AIRuleGeneration {
    return {
      ruleType: aiRule.ruleType || 'patternMatch',
      parameters: aiRule.parameters || {},
      confidence: aiRule.confidence || 0.5,
      explanation: aiRule.explanation || 'AI-generated rule from natural language'
    };
  }

  private fallbackRuleParsing(naturalText: string): AIRuleGeneration | null {
    // Basic rule parsing without AI
    const text = naturalText.toLowerCase();
    
    if (text.includes('run together') || text.includes('co-run')) {
      return {
        ruleType: 'coRun',
        parameters: {
          taskIds: this.extractTaskIds(text),
          workerGroups: this.extractWorkerGroups(text)
        },
        confidence: 0.6,
        explanation: 'Detected co-run requirement from natural language'
      };
    }
    
    if (text.includes('load') || text.includes('workload')) {
      const maxLoad = this.extractNumber(text);
      return {
        ruleType: 'loadLimit',
        parameters: {
          maxLoad: maxLoad || 5,
          workerGroups: this.extractWorkerGroups(text)
        },
        confidence: 0.5,
        explanation: 'Detected load limit from natural language'
      };
    }
    
    if (text.includes('phase') || text.includes('time')) {
      const phases = this.extractPhases(text);
      return {
        ruleType: 'phaseWindow',
        parameters: {
          phases: phases.length > 0 ? phases : [1, 2, 3],
          taskIds: this.extractTaskIds(text)
        },
        confidence: 0.4,
        explanation: 'Detected phase restriction from natural language'
      };
    }
    
    return null;
  }

  private extractTaskIds(text: string): string[] {
    const taskIds: string[] = [];
    const taskIdPattern = /T\d+/g;
    const matches = text.match(taskIdPattern);
    if (matches) {
      taskIds.push(...matches);
    }
    return taskIds;
  }

  private extractWorkerGroups(text: string): string[] {
    const groups: string[] = [];
    const groupPattern = /(sales|engineering|marketing|support|admin)/g;
    const matches = text.match(groupPattern);
    if (matches) {
      groups.push(...matches);
    }
    return groups;
  }

  private extractNumber(text: string): number | null {
    const numberPattern = /\d+/g;
    const matches = text.match(numberPattern);
    return matches ? parseInt(matches[0]) : null;
  }

  private extractPhases(text: string): number[] {
    const phases: number[] = [];
    const phasePattern = /phase\s*(\d+)/g;
    let match;
    while ((match = phasePattern.exec(text)) !== null) {
      phases.push(parseInt(match[1]));
    }
    return phases;
  }

  // AI-Powered File Parsing
  async parseFileWithAI(fileData: any[], headers: string[]): Promise<AIParsingResult> {
    if (!this.openai) {
      return this.fallbackFileParsing(fileData, headers);
    }

    try {
      const prompt = this.buildFileParsingPrompt(fileData, headers);
      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a data parsing expert. Analyze file structure and suggest optimal field mappings.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.3'),
        max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2000'),
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        try {
          const aiResult = JSON.parse(content);
          return this.processAIFileParsing(aiResult, fileData, headers);
        } catch (parseError) {
          console.warn('Failed to parse AI file parsing result, falling back to basic parsing');
          return this.fallbackFileParsing(fileData, headers);
        }
      }
    } catch (error) {
      console.error('OpenAI file parsing failed:', error);
    }

    return this.fallbackFileParsing(fileData, headers);
  }

  private buildFileParsingPrompt(fileData: any[], headers: string[]): string {
    const sampleRows = fileData.slice(0, 3);
    
    return `
File Headers: ${headers.join(', ')}
Sample Data:
${JSON.stringify(sampleRows, null, 2)}

Please analyze this file structure and suggest optimal field mappings for resource allocation data.

Expected entity types:
1. Client: ClientID, ClientName, PriorityLevel, RequestedTaskIDs, GroupTag, AttributesJSON
2. Worker: WorkerID, WorkerName, Skills, AvailableSlots, MaxLoadPerPhase, WorkerGroup, QualificationLevel
3. Task: TaskID, TaskName, Category, Duration, RequiredSkills, PreferredPhases, MaxConcurrent

Please provide mapping suggestions in the following JSON format:
{
  "entityType": "client|worker|task",
  "fieldMappings": {
    "ClientID": "header_name",
    "ClientName": "header_name",
    ...
  },
  "confidence": 0.85,
  "suggestions": ["suggestion1", "suggestion2"],
  "dataTransformations": {
    "field_name": "transformation_type"
  }
}

Focus on:
1. Identifying the entity type (client/worker/task)
2. Mapping headers to expected fields
3. Suggesting data transformations
4. Identifying potential data quality issues
`;
  }

  private processAIFileParsing(aiResult: any, fileData: any[], headers: string[]): AIParsingResult {
    const mappedData = this.mapHeadersToFields(fileData, headers, aiResult.suggestions || []);
    
    return {
      success: aiResult.confidence > 0.5,
      mappedData: mappedData,
      confidence: aiResult.confidence || 0.5,
      suggestions: aiResult.suggestions || []
    };
  }

  private fallbackFileParsing(fileData: any[], headers: string[]): AIParsingResult {
    // Basic file parsing without AI
    const suggestions: string[] = [];
    
    // Try to determine entity type from headers
    const headerText = headers.join(' ').toLowerCase();
    let entityType = 'unknown';
    
    if (headerText.includes('client') || headerText.includes('customer')) {
      entityType = 'client';
    } else if (headerText.includes('worker') || headerText.includes('employee') || headerText.includes('staff')) {
      entityType = 'worker';
    } else if (headerText.includes('task') || headerText.includes('job') || headerText.includes('work')) {
      entityType = 'task';
    }
    
    if (entityType !== 'unknown') {
      suggestions.push(`Detected entity type: ${entityType}`);
    }
    
    const mappedData = this.mapToEntityFormat(fileData, headers, this.getExpectedFields(entityType));
    const validation = this.validateMappedData(mappedData, suggestions);
    
    return {
      success: validation.confidence > 0.3,
      mappedData: mappedData,
      confidence: validation.confidence,
      suggestions: suggestions
    };
  }

  private getExpectedFields(entityType: string): string[] {
    switch (entityType) {
      case 'client':
        return ['ClientID', 'ClientName', 'PriorityLevel', 'RequestedTaskIDs', 'GroupTag', 'AttributesJSON'];
      case 'worker':
        return ['WorkerID', 'WorkerName', 'Skills', 'AvailableSlots', 'MaxLoadPerPhase', 'WorkerGroup', 'QualificationLevel'];
      case 'task':
        return ['TaskID', 'TaskName', 'Category', 'Duration', 'RequiredSkills', 'PreferredPhases', 'MaxConcurrent'];
      default:
        return [];
    }
  }

  private mapHeadersToFields(fileData: any[], headers: string[], suggestions: string[]): any[] {
    const expectedFields = {
      client: ['ClientID', 'ClientName', 'PriorityLevel', 'RequestedTaskIDs', 'GroupTag', 'AttributesJSON'],
      worker: ['WorkerID', 'WorkerName', 'Skills', 'AvailableSlots', 'MaxLoadPerPhase', 'WorkerGroup', 'QualificationLevel'],
      task: ['TaskID', 'TaskName', 'Category', 'Duration', 'RequiredSkills', 'PreferredPhases', 'MaxConcurrent']
    };

    // Determine entity type based on headers
    let entityType: 'client' | 'worker' | 'task' | null = null;
    let bestMatch = 0;

    Object.entries(expectedFields).forEach(([type, fields]) => {
      const matchCount = headers.filter(header => 
        fields.some(field => 
          header.toLowerCase().includes(field.toLowerCase()) ||
          field.toLowerCase().includes(header.toLowerCase())
        )
      ).length;
      
      if (matchCount > bestMatch) {
        bestMatch = matchCount;
        entityType = type as 'client' | 'worker' | 'task';
      }
    });

    if (entityType && bestMatch >= 3) {
      suggestions.push(`Detected ${entityType} data format`);
      return this.mapToEntityFormat(fileData, headers, expectedFields[entityType]);
    } else {
      suggestions.push('Could not determine data format. Please check column headers.');
      return fileData;
    }
  }

  private mapToEntityFormat(fileData: any[], headers: string[], expectedFields: string[]): any[] {
    const headerMap = new Map<string, string>();
    
    headers.forEach((header, index) => {
      const bestMatch = expectedFields.find(field => 
        header.toLowerCase().includes(field.toLowerCase()) ||
        field.toLowerCase().includes(header.toLowerCase())
      );
      if (bestMatch) {
        headerMap.set(header, bestMatch);
      }
    });

    return fileData.map(row => {
      const mappedRow: any = {};
      Object.keys(row).forEach(key => {
        const mappedKey = headerMap.get(key);
        if (mappedKey) {
          mappedRow[mappedKey] = row[key];
        } else {
          mappedRow[key] = row[key];
        }
      });
      return mappedRow;
    });
  }

  private validateMappedData(mappedData: any[], suggestions: string[]): { confidence: number } {
    let confidence = 0.5;
    let validRows = 0;

    mappedData.forEach((row, index) => {
      const hasRequiredFields = Object.keys(row).length >= 3;
      const hasValidData = Object.values(row).some(value => value !== null && value !== undefined && value !== '');
      
      if (hasRequiredFields && hasValidData) {
        validRows++;
      }
    });

    const validityRatio = validRows / mappedData.length;
    confidence += validityRatio * 0.3;

    if (validityRatio < 0.5) {
      suggestions.push('Many rows appear to have missing or invalid data');
    } else if (validityRatio > 0.8) {
      suggestions.push('Data appears to be well-formatted');
      confidence += 0.2;
    }

    return { confidence };
  }
} 
