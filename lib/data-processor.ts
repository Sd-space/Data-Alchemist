
// import * as XLSX from 'xlsx';
// import Papa from 'papaparse';
// import { Client, Worker, Task, ExportData } from './types';

// export type ValidationError = {
//   entity: 'Client' | 'Worker' | 'Task';
//   rowIndex: number;
//   field: string;
//   message: string;
// };

// export class DataProcessor {
//   // ---- Header alias remapping ----
//   static clientAliasMap = {
//     'client id': 'ClientID',
//     'client name': 'ClientName',
//     'priority level': 'PriorityLevel',
//     'requested task ids': 'RequestedTaskIDs',
//     'group tag': 'GroupTag',
//     'attributes json': 'AttributesJSON'
//   };

//   static workerAliasMap = {
//     'worker id': 'WorkerID',
//     'worker name': 'WorkerName',
//     'skills': 'Skills',
//     'available slots': 'AvailableSlots',
//     'max load per phase': 'MaxLoadPerPhase',
//     'worker group': 'WorkerGroup',
//     'qualification level': 'QualificationLevel'
//   };

//   static taskAliasMap = {
//     'task id': 'TaskID',
//     'task name': 'TaskName',
//     'category': 'Category',
//     'duration': 'Duration',
//     'required skills': 'RequiredSkills',
//     'preferred phases': 'PreferredPhases',
//     'max concurrent': 'MaxConcurrent'
//   };

//   static remapHeaders(row: any, aliasMap: Record<string, string>): any {
//     const remapped: any = {};
//     for (const key in row) {
//       const normalized = key.toLowerCase().trim();
//       remapped[aliasMap[normalized] || key] = row[key];
//     }
//     return remapped;
//   }

//   // ---- CSV & Excel parsing ----
//   static parseCSV(file: File): Promise<{ data: any[], headers: string[] }> {
//     return new Promise((resolve, reject) => {
//       Papa.parse(file, {
//         header: true,
//         skipEmptyLines: true,
//         complete: (results) => {
//           if (results.errors.length > 0) {
//             reject(new Error(`CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`));
//             return;
//           }
//           resolve({ data: results.data as any[], headers: results.meta.fields || [] });
//         },
//         error: (error) => {
//           reject(new Error(`CSV parsing failed: ${error.message}`));
//         }
//       });
//     });
//   }

//   static parseXLSX(file: File): Promise<{ data: any[], headers: string[] }> {
//     return new Promise((resolve, reject) => {
//       const reader = new FileReader();
//       reader.onload = (e) => {
//         try {
//           const data = new Uint8Array(e.target?.result as ArrayBuffer);
//           const workbook = XLSX.read(data, { type: 'array' });
//           const worksheet = workbook.Sheets[workbook.SheetNames[0]];
//           const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
//           if (jsonData.length === 0) return reject(new Error('Excel file is empty'));

//           const headers = jsonData[0] as string[];
//           const dataRows = jsonData.slice(1).map(row => {
//             const obj: any = {};
//             headers.forEach((header, index) => {
//               obj[header] = row[index] || '';
//             });
//             return obj;
//           });
//           resolve({ data: dataRows, headers });
//         } catch (err) {
//           reject(new Error(`Excel parsing failed: ${err}`));
//         }
//       };
//       reader.onerror = () => reject(new Error('Failed to read Excel file'));
//       reader.readAsArrayBuffer(file);
//     });
//   }

//   static async parseFile(file: File): Promise<{ data: any[], headers: string[] }> {
//     const ext = file.name.split('.').pop()?.toLowerCase();
//     switch (ext) {
//       case 'csv': return this.parseCSV(file);
//       case 'xlsx':
//       case 'xls': return this.parseXLSX(file);
//       default: throw new Error('Unsupported file format. Please upload CSV or Excel files.');
//     }
//   }

//   // ---- Entity conversion with header remapping ----
//   static convertToClients(raw: any[]): Client[] {
//     return raw.map((row, i) => {
//       const r = this.remapHeaders(row, this.clientAliasMap);
//       return {
//         ClientID: String(r.ClientID || `C${i + 1}`),
//         ClientName: String(r.ClientName || ''),
//         PriorityLevel: parseInt(r.PriorityLevel) || 1,
//         RequestedTaskIDs: String(r.RequestedTaskIDs || ''),
//         GroupTag: String(r.GroupTag || ''),
//         AttributesJSON: String(r.AttributesJSON || '{}')
//       };
//     });
//   }

//   static convertToWorkers(raw: any[]): Worker[] {
//     return raw.map((row, i) => {
//       const r = this.remapHeaders(row, this.workerAliasMap);
//       return {
//         WorkerID: String(r.WorkerID || `W${i + 1}`),
//         WorkerName: String(r.WorkerName || ''),
//         Skills: String(r.Skills || ''),
//         AvailableSlots: String(r.AvailableSlots || '[]'),
//         MaxLoadPerPhase: parseInt(r.MaxLoadPerPhase) || 1,
//         WorkerGroup: String(r.WorkerGroup || ''),
//         QualificationLevel: parseInt(r.QualificationLevel) || 1
//       };
//     });
//   }

//   static convertToTasks(raw: any[]): Task[] {
//     return raw.map((row, i) => {
//       const r = this.remapHeaders(row, this.taskAliasMap);
//       return {
//         TaskID: String(r.TaskID || `T${i + 1}`),
//         TaskName: String(r.TaskName || ''),
//         Category: String(r.Category || ''),
//         Duration: parseInt(r.Duration) || 1,
//         RequiredSkills: String(r.RequiredSkills || ''),
//         PreferredPhases: this.normalizePreferredPhases(String(r.PreferredPhases || '[]')),
//         MaxConcurrent: parseInt(r.MaxConcurrent) || 1
//       };
//     });
//   }

//   // ---- Entity Validators ----
//   static validateClients(clients: Client[]): ValidationError[] {
//     const errors: ValidationError[] = [];
//     clients.forEach((c, i) => {
//       if (!this.isValidPriorityLevel(c.PriorityLevel)) {
//         errors.push({ entity: 'Client', rowIndex: i, field: 'PriorityLevel', message: 'Must be between 1–5' });
//       }
//       if (!this.isValidJSON(c.AttributesJSON)) {
//         errors.push({ entity: 'Client', rowIndex: i, field: 'AttributesJSON', message: 'Invalid JSON format' });
//       }
//     });
//     return errors;
//   }

//   static validateWorkers(workers: Worker[]): ValidationError[] {
//     const errors: ValidationError[] = [];
//     workers.forEach((w, i) => {
//       if (!this.isValidMaxLoadPerPhase(w.MaxLoadPerPhase)) {
//         errors.push({ entity: 'Worker', rowIndex: i, field: 'MaxLoadPerPhase', message: 'Must be ≥ 1' });
//       }
//       if (!this.isValidArray(w.AvailableSlots)) {
//         errors.push({ entity: 'Worker', rowIndex: i, field: 'AvailableSlots', message: 'Not a valid array' });
//       }
//     });
//     return errors;
//   }

//   static validateTasks(tasks: Task[]): ValidationError[] {
//     const errors: ValidationError[] = [];
//     tasks.forEach((t, i) => {
//       if (!this.isValidDuration(t.Duration)) {
//         errors.push({ entity: 'Task', rowIndex: i, field: 'Duration', message: 'Duration must be ≥ 1' });
//       }
//       if (!this.isValidMaxConcurrent(t.MaxConcurrent)) {
//         errors.push({ entity: 'Task', rowIndex: i, field: 'MaxConcurrent', message: 'Must be ≥ 1' });
//       }
//       if (!this.isValidArray(t.PreferredPhases)) {
//         errors.push({ entity: 'Task', rowIndex: i, field: 'PreferredPhases', message: 'Invalid array format' });
//       }
//     });
//     return errors;
//   }

//   // ---- Normalizers & Validators ----
//   static normalizePreferredPhases(val: string): string {
//     try {
//       const parsed = JSON.parse(val);
//       if (Array.isArray(parsed)) return JSON.stringify(parsed);
//     } catch {
//       const rangeMatch = val.match(/^(\d+)-(\d+)$/);
//       if (rangeMatch) {
//         const [start, end] = [parseInt(rangeMatch[1]), parseInt(rangeMatch[2])];
//         return JSON.stringify(Array.from({ length: end - start + 1 }, (_, i) => start + i));
//       }
//       const items = val.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
//       return JSON.stringify(items);
//     }
//     return '[]';
//   }

//   static isValidPriorityLevel(value: number) {
//     return value >= 1 && value <= 5;
//   }

//   static isValidDuration(value: number) {
//     return value >= 1;
//   }

//   static isValidMaxConcurrent(value: number) {
//     return value >= 1;
//   }

//   static isValidMaxLoadPerPhase(value: number) {
//     return value >= 1;
//   }

//   static isValidJSON(value: string) {
//     try {
//       JSON.parse(value);
//       return true;
//     } catch {
//       return false;
//     }
//   }

//   static isValidArray(value: string) {
//     try {
//       return Array.isArray(JSON.parse(value));
//     } catch {
//       return false;
//     }
//   }

//   // (Export, data stats, and utilities remain unchanged...)
// }
import * as XLSX from 'xlsx';
import { Client, Worker, Task, ExportData } from './types';

export class DataProcessor {
  static async parseFile(file: File): Promise<{ data: any[]; headers: string[] }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
          const headers = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })[0] as string[];
          resolve({ data: jsonData, headers });
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  }

  static convertToClients(data: any[]): Client[] {
    // @ts-ignore
    return data.map((row: any) => ({
      id: row.id || '',
      name: row.name || '',
      email: row.email || '',
      location: row.location || '',
      _index: 0 // Will be re-indexed later
    }));
  }

  static convertToWorkers(data: any[]): Worker[] {
    // @ts-ignore
    return data.map((row: any) => ({
      id: row.id || '',
      name: row.name || '',
      skill: row.skill || '',
      region: row.region || '',
      availability: row.availability || '',
      _index: 0
    }));
  }
  
  static convertToTasks(data: any[]): Task[] {
    // @ts-ignore
    return data.map((row: any) => ({
      id: row.id || '',
      title: row.title || '',
      requiredSkill: row.requiredSkill || '',
      location: row.location || '',
      priority: row.priority || '',
      _index: 0
    }));
  }

  static exportAllData(data: ExportData): void {
    const workbook = XLSX.utils.book_new();

    const sheetFromJSON = (title: string, data: any[]) => {
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, ws, title);
    };

    sheetFromJSON('Clients', data.clients);
    sheetFromJSON('Workers', data.workers);
    sheetFromJSON('Tasks', data.tasks);
    sheetFromJSON('Rules', data.rules || []);
    sheetFromJSON('Weights', [data.weights || {}]);
    sheetFromJSON('ValidationSummary', [data.validationSummary || {}]);

    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'exported_data.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  }
}
