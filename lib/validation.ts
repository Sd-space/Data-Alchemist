import { Client, Worker, Task, ValidationError, ValidationSummary } from './types';

export class ValidationEngine {
  private clients: Client[] = [];
  private workers: Worker[] = [];
  private tasks: Task[] = [];

  constructor(clients: Client[], workers: Worker[], tasks: Task[]) {
    this.clients = clients;
    this.workers = workers;
    this.tasks = tasks;
  }

  validateAll(): ValidationSummary {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const info: ValidationError[] = [];

    // Validate clients
    errors.push(...this.validateClients());
    warnings.push(...this.validateClientWarnings());
    info.push(...this.validateClientInfo());

    // Validate workers
    errors.push(...this.validateWorkers());
    warnings.push(...this.validateWorkerWarnings());
    info.push(...this.validateWorkerInfo());

    // Validate tasks
    errors.push(...this.validateTasks());
    warnings.push(...this.validateTaskWarnings());
    info.push(...this.validateTaskInfo());

    // Cross-reference validations
    errors.push(...this.validateCrossReferences());
    warnings.push(...this.validateCrossReferenceWarnings());

    return {
      totalErrors: errors.length,
      totalWarnings: warnings.length,
      totalInfo: info.length,
      errors,
      warnings,
      info
    };
  }

  private validateClients(): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check for duplicate ClientIDs
    const clientIds = this.clients.map(c => c.ClientID);
    const duplicates = clientIds.filter((id, index) => clientIds.indexOf(id) !== index);
    duplicates.forEach(id => {
      errors.push({
        type: 'error',
        message: `Duplicate ClientID found: ${id}`,
        entity: 'client',
        entityId: id,
        field: 'ClientID',
        suggestion: 'Ensure each client has a unique ID'
      });
    });

    // Validate PriorityLevel (1-5)
    this.clients.forEach((client, index) => {
      if (client.PriorityLevel < 1 || client.PriorityLevel > 5) {
        errors.push({
          type: 'error',
          message: `PriorityLevel must be between 1 and 5, got ${client.PriorityLevel}`,
          entity: 'client',
          entityId: client.ClientID,
          field: 'PriorityLevel',
          row: index + 1,
          suggestion: 'Set PriorityLevel to a value between 1 and 5'
        });
      }
    });

    // Validate AttributesJSON
    this.clients.forEach((client, index) => {
      try {
        JSON.parse(client.AttributesJSON);
      } catch {
        errors.push({
          type: 'error',
          message: 'Invalid JSON in AttributesJSON field',
          entity: 'client',
          entityId: client.ClientID,
          field: 'AttributesJSON',
          row: index + 1,
          suggestion: 'Fix the JSON format in AttributesJSON'
        });
      }
    });

    return errors;
  }

  private validateWorkers(): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check for duplicate WorkerIDs
    const workerIds = this.workers.map(w => w.WorkerID);
    const duplicates = workerIds.filter((id, index) => workerIds.indexOf(id) !== index);
    duplicates.forEach(id => {
      errors.push({
        type: 'error',
        message: `Duplicate WorkerID found: ${id}`,
        entity: 'worker',
        entityId: id,
        field: 'WorkerID',
        suggestion: 'Ensure each worker has a unique ID'
      });
    });

    // Validate AvailableSlots format
    this.workers.forEach((worker, index) => {
      try {
        const slots = JSON.parse(worker.AvailableSlots);
        if (!Array.isArray(slots)) {
          throw new Error('Not an array');
        }
        slots.forEach(slot => {
          if (typeof slot !== 'number' || slot < 1) {
            throw new Error('Invalid slot number');
          }
        });
      } catch {
        errors.push({
          type: 'error',
          message: 'AvailableSlots must be a valid JSON array of positive integers',
          entity: 'worker',
          entityId: worker.WorkerID,
          field: 'AvailableSlots',
          row: index + 1,
          suggestion: 'Format AvailableSlots as JSON array, e.g., [1,3,5]'
        });
      }
    });

    // Validate MaxLoadPerPhase
    this.workers.forEach((worker, index) => {
      if (worker.MaxLoadPerPhase < 1) {
        errors.push({
          type: 'error',
          message: 'MaxLoadPerPhase must be at least 1',
          entity: 'worker',
          entityId: worker.WorkerID,
          field: 'MaxLoadPerPhase',
          row: index + 1,
          suggestion: 'Set MaxLoadPerPhase to 1 or higher'
        });
      }
    });

    return errors;
  }

  private validateTasks(): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check for duplicate TaskIDs
    const taskIds = this.tasks.map(t => t.TaskID);
    const duplicates = taskIds.filter((id, index) => taskIds.indexOf(id) !== index);
    duplicates.forEach(id => {
      errors.push({
        type: 'error',
        message: `Duplicate TaskID found: ${id}`,
        entity: 'task',
        entityId: id,
        field: 'TaskID',
        suggestion: 'Ensure each task has a unique ID'
      });
    });

    // Validate Duration
    this.tasks.forEach((task, index) => {
      if (task.Duration < 1) {
        errors.push({
          type: 'error',
          message: 'Duration must be at least 1',
          entity: 'task',
          entityId: task.TaskID,
          field: 'Duration',
          row: index + 1,
          suggestion: 'Set Duration to 1 or higher'
        });
      }
    });

    // Validate MaxConcurrent
    this.tasks.forEach((task, index) => {
      if (task.MaxConcurrent < 1) {
        errors.push({
          type: 'error',
          message: 'MaxConcurrent must be at least 1',
          entity: 'task',
          entityId: task.TaskID,
          field: 'MaxConcurrent',
          row: index + 1,
          suggestion: 'Set MaxConcurrent to 1 or higher'
        });
      }
    });

    return errors;
  }

  private validateCrossReferences(): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check if RequestedTaskIDs exist in tasks
    this.clients.forEach((client, index) => {
      const requestedTasks = client.RequestedTaskIDs.split(',').map(id => id.trim());
      const taskIds = this.tasks.map(t => t.TaskID);
      
      requestedTasks.forEach(taskId => {
        if (taskId && !taskIds.includes(taskId)) {
          errors.push({
            type: 'error',
            message: `Requested task ${taskId} does not exist`,
            entity: 'client',
            entityId: client.ClientID,
            field: 'RequestedTaskIDs',
            row: index + 1,
            suggestion: `Remove or replace task ID: ${taskId}`
          });
        }
      });
    });

    // Check if RequiredSkills are covered by workers
    this.tasks.forEach((task, index) => {
      const requiredSkills = task.RequiredSkills.split(',').map(skill => skill.trim());
      const availableSkills = this.workers.flatMap(w => w.Skills.split(',').map(skill => skill.trim()));
      
      requiredSkills.forEach(skill => {
        if (skill && !availableSkills.includes(skill)) {
          errors.push({
            type: 'error',
            message: `Required skill ${skill} is not available in any worker`,
            entity: 'task',
            entityId: task.TaskID,
            field: 'RequiredSkills',
            row: index + 1,
            suggestion: `Add worker with skill: ${skill} or remove skill requirement`
          });
        }
      });
    });

    return errors;
  }

  private validateClientWarnings(): ValidationError[] {
    const warnings: ValidationError[] = [];

    // Check for empty fields
    this.clients.forEach((client, index) => {
      if (!client.ClientName.trim()) {
        warnings.push({
          type: 'warning',
          message: 'ClientName is empty',
          entity: 'client',
          entityId: client.ClientID,
          field: 'ClientName',
          row: index + 1,
          suggestion: 'Provide a meaningful client name'
        });
      }
    });

    return warnings;
  }

  private validateWorkerWarnings(): ValidationError[] {
    const warnings: ValidationError[] = [];

    // Check for overloaded workers
    this.workers.forEach((worker, index) => {
      try {
        const slots = JSON.parse(worker.AvailableSlots);
        if (slots.length < worker.MaxLoadPerPhase) {
          warnings.push({
            type: 'warning',
            message: `Worker has ${slots.length} available slots but MaxLoadPerPhase is ${worker.MaxLoadPerPhase}`,
            entity: 'worker',
            entityId: worker.WorkerID,
            field: 'MaxLoadPerPhase',
            row: index + 1,
            suggestion: 'Reduce MaxLoadPerPhase or increase AvailableSlots'
          });
        }
      } catch {
        // Already handled in error validation
      }
    });

    return warnings;
  }

  private validateTaskWarnings(): ValidationError[] {
    const warnings: ValidationError[] = [];

    // Check PreferredPhases format
    this.tasks.forEach((task, index) => {
      if (task.PreferredPhases) {
        try {
          // Try to parse as JSON array
          JSON.parse(task.PreferredPhases);
        } catch {
          // Check if it's a range format like "1-3"
          if (!/^\d+-\d+$/.test(task.PreferredPhases)) {
            warnings.push({
              type: 'warning',
              message: 'PreferredPhases format may be invalid',
              entity: 'task',
              entityId: task.TaskID,
              field: 'PreferredPhases',
              row: index + 1,
              suggestion: 'Use JSON array format [1,2,3] or range format "1-3"'
            });
          }
        }
      }
    });

    return warnings;
  }

  private validateClientInfo(): ValidationError[] {
    const info: ValidationError[] = [];

    // Check for high priority clients with many tasks
    this.clients.forEach((client, index) => {
      const taskCount = client.RequestedTaskIDs.split(',').filter(id => id.trim()).length;
      if (client.PriorityLevel >= 4 && taskCount > 5) {
        info.push({
          type: 'info',
          message: `High priority client (${client.PriorityLevel}) has ${taskCount} requested tasks`,
          entity: 'client',
          entityId: client.ClientID,
          field: 'RequestedTaskIDs',
          row: index + 1,
          suggestion: 'Consider task prioritization for high-priority clients'
        });
      }
    });

    return info;
  }

  private validateWorkerInfo(): ValidationError[] {
    const info: ValidationError[] = [];

    // Check for workers with many skills
    this.workers.forEach((worker, index) => {
      const skillCount = worker.Skills.split(',').filter(skill => skill.trim()).length;
      if (skillCount > 5) {
        info.push({
          type: 'info',
          message: `Worker has ${skillCount} skills - consider specialization`,
          entity: 'worker',
          entityId: worker.WorkerID,
          field: 'Skills',
          row: index + 1,
          suggestion: 'Consider focusing on core skills for better efficiency'
        });
      }
    });

    return info;
  }

  private validateTaskInfo(): ValidationError[] {
    const info: ValidationError[] = [];

    // Check for long-duration tasks
    this.tasks.forEach((task, index) => {
      if (task.Duration > 5) {
        info.push({
          type: 'info',
          message: `Task has long duration (${task.Duration} phases)`,
          entity: 'task',
          entityId: task.TaskID,
          field: 'Duration',
          row: index + 1,
          suggestion: 'Consider breaking down long tasks for better resource allocation'
        });
      }
    });

    return info;
  }

  private validateCrossReferenceWarnings(): ValidationError[] {
    const warnings: ValidationError[] = [];

    // Check for tasks with high concurrency but few qualified workers
    this.tasks.forEach((task, index) => {
      const requiredSkills = task.RequiredSkills.split(',').map(skill => skill.trim());
      const qualifiedWorkers = this.workers.filter(worker => 
        requiredSkills.some(skill => worker.Skills.includes(skill))
      );
      
      if (task.MaxConcurrent > qualifiedWorkers.length) {
        warnings.push({
          type: 'warning',
          message: `Task requires ${task.MaxConcurrent} concurrent workers but only ${qualifiedWorkers.length} are qualified`,
          entity: 'task',
          entityId: task.TaskID,
          field: 'MaxConcurrent',
          row: index + 1,
          suggestion: 'Reduce MaxConcurrent or add more qualified workers'
        });
      }
    });

    return warnings;
  }
} 