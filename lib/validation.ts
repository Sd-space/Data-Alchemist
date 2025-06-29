
import { Client, Worker, Task, ValidationError, ValidationSummary } from './types';

export class ValidationEngine {
  constructor(
    private clients: Client[],
    private workers: Worker[],
    private tasks: Task[]
  ) {}

  validateAll(): ValidationSummary {
    const errors: ValidationError[] = [
      ...this.validateClients(),
      ...this.validateWorkers(),
      ...this.validateTasks(),
      ...this.validateCrossReferences()
    ];

    const warnings: ValidationError[] = [
      ...this.clientWarnings(),
      ...this.workerWarnings(),
      ...this.taskWarnings(),
      ...this.crossRefWarnings()
    ];

    const info: ValidationError[] = [
      ...this.clientInfo(),
      ...this.workerInfo(),
      ...this.taskInfo()
    ];

    return { totalErrors: errors.length, totalWarnings: warnings.length, totalInfo: info.length, errors, warnings, info };
  }

  private findDuplicates(ids: string[]) {
    return ids.filter((id, index) => ids.indexOf(id) !== index);
  }

  private isValidJson(value: string) {
    try { JSON.parse(value); return true; } catch { return false; }
  }

  private parseJsonArray(value: string): number[] | null {
    try {
      const arr = JSON.parse(value);
      return Array.isArray(arr) ? arr.filter(v => typeof v === 'number' && v >= 1) : null;
    } catch { return null; }
  }

  private validateClients(): ValidationError[] {
    const errors: ValidationError[] = [];
    const ids = this.clients.map(c => c.ClientID);
    this.findDuplicates(ids).forEach(id => errors.push({
      type: 'error', message: `Duplicate ClientID: ${id}`, entity: 'client', entityId: id, field: 'ClientID', suggestion: 'Use unique ClientID'
    }));

    this.clients.forEach((c, i) => {
      if (c.PriorityLevel < 1 || c.PriorityLevel > 5) {
        errors.push({ type: 'error', message: `PriorityLevel must be 1-5`, entity: 'client', entityId: c.ClientID, field: 'PriorityLevel', row: i + 1, suggestion: 'Set PriorityLevel between 1 and 5' });
      }
      if (!this.isValidJson(c.AttributesJSON)) {
        errors.push({ type: 'error', message: 'Invalid AttributesJSON', entity: 'client', entityId: c.ClientID, field: 'AttributesJSON', row: i + 1, suggestion: 'Fix JSON format' });
      }
    });

    return errors;
  }

  private validateWorkers(): ValidationError[] {
    const errors: ValidationError[] = [];
    const ids = this.workers.map(w => w.WorkerID);
    this.findDuplicates(ids).forEach(id => errors.push({
      type: 'error', message: `Duplicate WorkerID: ${id}`, entity: 'worker', entityId: id, field: 'WorkerID', suggestion: 'Use unique WorkerID'
    }));

    this.workers.forEach((w, i) => {
      const slots = this.parseJsonArray(w.AvailableSlots);
      if (!slots) {
        errors.push({ type: 'error', message: 'Invalid AvailableSlots', entity: 'worker', entityId: w.WorkerID, field: 'AvailableSlots', row: i + 1, suggestion: 'Use valid JSON array e.g., [1,2,3]' });
      }
      if (w.MaxLoadPerPhase < 1) {
        errors.push({ type: 'error', message: 'MaxLoadPerPhase must be >= 1', entity: 'worker', entityId: w.WorkerID, field: 'MaxLoadPerPhase', row: i + 1, suggestion: 'Set MaxLoadPerPhase >= 1' });
      }
    });

    return errors;
  }

  private validateTasks(): ValidationError[] {
    const errors: ValidationError[] = [];
    const ids = this.tasks.map(t => t.TaskID);
    this.findDuplicates(ids).forEach(id => errors.push({
      type: 'error', message: `Duplicate TaskID: ${id}`, entity: 'task', entityId: id, field: 'TaskID', suggestion: 'Use unique TaskID'
    }));

    this.tasks.forEach((t, i) => {
      if (t.Duration < 1) errors.push({ type: 'error', message: 'Duration must be >= 1', entity: 'task', entityId: t.TaskID, field: 'Duration', row: i + 1, suggestion: 'Increase Duration' });
      if (t.MaxConcurrent < 1) errors.push({ type: 'error', message: 'MaxConcurrent must be >= 1', entity: 'task', entityId: t.TaskID, field: 'MaxConcurrent', row: i + 1, suggestion: 'Increase MaxConcurrent' });
    });

    return errors;
  }

  private validateCrossReferences(): ValidationError[] {
    const errors: ValidationError[] = [];
    const taskIds = this.tasks.map(t => t.TaskID);
    const allSkills = this.workers.flatMap(w => w.Skills.split(',').map(s => s.trim()));

    this.clients.forEach((c, i) => {
      c.RequestedTaskIDs.split(',').map(id => id.trim()).forEach(tid => {
        if (tid && !taskIds.includes(tid)) {
          errors.push({ type: 'error', message: `Requested TaskID ${tid} not found`, entity: 'client', entityId: c.ClientID, field: 'RequestedTaskIDs', row: i + 1, suggestion: `Check task ID: ${tid}` });
        }
      });
    });

    this.tasks.forEach((t, i) => {
      t.RequiredSkills.split(',').map(s => s.trim()).forEach(skill => {
        if (skill && !allSkills.includes(skill)) {
          errors.push({ type: 'error', message: `Skill ${skill} missing in workers`, entity: 'task', entityId: t.TaskID, field: 'RequiredSkills', row: i + 1, suggestion: `Add worker with skill: ${skill}` });
        }
      });
    });

    return errors;
  }

  private clientWarnings(): ValidationError[] {
    return this.clients.map((c, i) => !c.ClientName.trim() ? {
      type: 'warning', message: 'ClientName is empty', entity: 'client', entityId: c.ClientID, field: 'ClientName', row: i + 1, suggestion: 'Provide a client name'
    } : null).filter(Boolean) as ValidationError[];
  }

  private workerWarnings(): ValidationError[] {
    return this.workers.map((w, i) => {
      const slots = this.parseJsonArray(w.AvailableSlots);
      if (slots && slots.length < w.MaxLoadPerPhase) {
        return {
          type: 'warning', message: `Worker has fewer slots (${slots.length}) than MaxLoadPerPhase (${w.MaxLoadPerPhase})`, entity: 'worker', entityId: w.WorkerID, field: 'MaxLoadPerPhase', row: i + 1, suggestion: 'Adjust slot count or MaxLoadPerPhase'
        };
      }
      return null;
    }).filter(Boolean) as ValidationError[];
  }

  private taskWarnings(): ValidationError[] {
    return this.tasks.map((t, i) => {
      if (t.PreferredPhases) {
        try {
          JSON.parse(t.PreferredPhases);
        } catch {
          if (!/^\d+-\d+$/.test(t.PreferredPhases)) {
            return { type: 'warning', message: 'PreferredPhases format may be invalid', entity: 'task', entityId: t.TaskID, field: 'PreferredPhases', row: i + 1, suggestion: 'Use [1,2,3] or range "1-3"' };
          }
        }
      }
      return null;
    }).filter(Boolean) as ValidationError[];
  }

  private clientInfo(): ValidationError[] {
    return this.clients.map((c, i) => {
      const count = c.RequestedTaskIDs.split(',').filter(Boolean).length;
      if (c.PriorityLevel >= 4 && count > 5) {
        return { type: 'info', message: `High-priority client with ${count} tasks`, entity: 'client', entityId: c.ClientID, field: 'RequestedTaskIDs', row: i + 1, suggestion: 'Consider prioritizing tasks' };
      }
      return null;
    }).filter(Boolean) as ValidationError[];
  }

  private workerInfo(): ValidationError[] {
    return this.workers.map((w, i) => {
      const count = w.Skills.split(',').filter(Boolean).length;
      return count > 5 ? {
        type: 'info', message: `Worker has ${count} skills`, entity: 'worker', entityId: w.WorkerID, field: 'Skills', row: i + 1, suggestion: 'Consider specialization' } : null;
    }).filter(Boolean) as ValidationError[];
  }

  private taskInfo(): ValidationError[] {
    return this.tasks.map((t, i) => t.Duration > 5 ? {
      type: 'info', message: `Long-duration task (${t.Duration})`, entity: 'task', entityId: t.TaskID, field: 'Duration', row: i + 1, suggestion: 'Break down long task if needed'
    } : null).filter(Boolean) as ValidationError[];
  }

  private crossRefWarnings(): ValidationError[] {
    return this.tasks.map((t, i) => {
      const skills = t.RequiredSkills.split(',').map(s => s.trim());
      const qualified = this.workers.filter(w => skills.some(skill => w.Skills.includes(skill)));
      return t.MaxConcurrent > qualified.length ? {
        type: 'warning', message: `MaxConcurrent ${t.MaxConcurrent} > qualified workers (${qualified.length})`, entity: 'task', entityId: t.TaskID, field: 'MaxConcurrent', row: i + 1, suggestion: 'Reduce concurrency or hire more qualified workers'
      } : null;
    }).filter(Boolean) as ValidationError[];
  }
}
