import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { Client, Worker, Task, ExportData } from './types';

export class DataProcessor {
  
  // Parse CSV file
  static parseCSV(file: File): Promise<{ data: any[], headers: string[] }> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(new Error(`CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`));
            return;
          }
          
          const headers = results.meta.fields || [];
          const data = results.data as any[];
          
          resolve({ data, headers });
        },
        error: (error) => {
          reject(new Error(`CSV parsing failed: ${error.message}`));
        }
      });
    });
  }

  // Parse XLSX file
  static parseXLSX(file: File): Promise<{ data: any[], headers: string[] }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get the first sheet
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length === 0) {
            reject(new Error('Excel file is empty'));
            return;
          }
          
          const headers = jsonData[0] as string[];
          const dataRows = jsonData.slice(1).map(row => {
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = row[index] || '';
            });
            return obj;
          });
          
          resolve({ data: dataRows, headers });
        } catch (error) {
          reject(new Error(`Excel parsing failed: ${error}`));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read Excel file'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  }

  // Parse file based on type
  static async parseFile(file: File): Promise<{ data: any[], headers: string[] }> {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    switch (fileExtension) {
      case 'csv':
        return this.parseCSV(file);
      case 'xlsx':
      case 'xls':
        return this.parseXLSX(file);
      default:
        throw new Error('Unsupported file format. Please upload CSV or Excel files.');
    }
  }

  // Convert raw data to typed entities
  static convertToClients(rawData: any[]): Client[] {
    return rawData.map((row, index) => ({
      ClientID: String(row.ClientID || `C${index + 1}`),
      ClientName: String(row.ClientName || ''),
      PriorityLevel: parseInt(row.PriorityLevel) || 1,
      RequestedTaskIDs: String(row.RequestedTaskIDs || ''),
      GroupTag: String(row.GroupTag || ''),
      AttributesJSON: String(row.AttributesJSON || '{}')
    }));
  }

  static convertToWorkers(rawData: any[]): Worker[] {
    return rawData.map((row, index) => ({
      WorkerID: String(row.WorkerID || `W${index + 1}`),
      WorkerName: String(row.WorkerName || ''),
      Skills: String(row.Skills || ''),
      AvailableSlots: String(row.AvailableSlots || '[]'),
      MaxLoadPerPhase: parseInt(row.MaxLoadPerPhase) || 1,
      WorkerGroup: String(row.WorkerGroup || ''),
      QualificationLevel: parseInt(row.QualificationLevel) || 1
    }));
  }

  static convertToTasks(rawData: any[]): Task[] {
    return rawData.map((row, index) => ({
      TaskID: String(row.TaskID || `T${index + 1}`),
      TaskName: String(row.TaskName || ''),
      Category: String(row.Category || ''),
      Duration: parseInt(row.Duration) || 1,
      RequiredSkills: String(row.RequiredSkills || ''),
      PreferredPhases: String(row.PreferredPhases || ''),
      MaxConcurrent: parseInt(row.MaxConcurrent) || 1
    }));
  }

  // Export data to CSV
  static exportToCSV(data: any[], filename: string): void {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // Export data to JSON
  static exportToJSON(data: any, filename: string): void {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // Export all data
  static exportAllData(exportData: ExportData): void {
    // Export clients
    this.exportToCSV(exportData.clients, 'clients_cleaned.csv');
    
    // Export workers
    this.exportToCSV(exportData.workers, 'workers_cleaned.csv');
    
    // Export tasks
    this.exportToCSV(exportData.tasks, 'tasks_cleaned.csv');
    
    // Export rules and configuration
    const configData = {
      rules: exportData.rules,
      weights: exportData.weights,
      validationSummary: exportData.validationSummary,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };
    
    this.exportToJSON(configData, 'rules_config.json');
  }

  // Data cleaning utilities
  static cleanString(value: string): string {
    return value.trim().replace(/\s+/g, ' ');
  }

  static cleanNumber(value: any): number {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  }

  static cleanJSON(value: string): string {
    try {
      const parsed = JSON.parse(value);
      return JSON.stringify(parsed);
    } catch {
      return '{}';
    }
  }

  static cleanArray(value: string): string {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return JSON.stringify(parsed);
      }
    } catch {
      // Try to parse comma-separated values
      const items = value.split(',').map(item => item.trim()).filter(item => item);
      return JSON.stringify(items);
    }
    return '[]';
  }

  // Data validation helpers
  static isValidPriorityLevel(value: number): boolean {
    return value >= 1 && value <= 5;
  }

  static isValidDuration(value: number): boolean {
    return value >= 1;
  }

  static isValidMaxConcurrent(value: number): boolean {
    return value >= 1;
  }

  static isValidMaxLoadPerPhase(value: number): boolean {
    return value >= 1;
  }

  static isValidJSON(value: string): boolean {
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  }

  static isValidArray(value: string): boolean {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed);
    } catch {
      return false;
    }
  }

  // Data transformation utilities
  static normalizePreferredPhases(value: string): string {
    try {
      // Try to parse as JSON array
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return JSON.stringify(parsed);
      }
    } catch {
      // Try to parse as range (e.g., "1-3")
      const rangeMatch = value.match(/^(\d+)-(\d+)$/);
      if (rangeMatch) {
        const start = parseInt(rangeMatch[1]);
        const end = parseInt(rangeMatch[2]);
        const phases = Array.from({ length: end - start + 1 }, (_, i) => start + i);
        return JSON.stringify(phases);
      }
      
      // Try to parse as comma-separated values
      const items = value.split(',').map(item => parseInt(item.trim())).filter(item => !isNaN(item));
      if (items.length > 0) {
        return JSON.stringify(items);
      }
    }
    
    return '[]';
  }

  static normalizeAvailableSlots(value: string): string {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        const validSlots = parsed.filter(slot => typeof slot === 'number' && slot >= 1);
        return JSON.stringify(validSlots);
      }
    } catch {
      // Try to parse as comma-separated values
      const items = value.split(',').map(item => parseInt(item.trim())).filter(item => !isNaN(item) && item >= 1);
      if (items.length > 0) {
        return JSON.stringify(items);
      }
    }
    
    return '[]';
  }

  // Data analysis utilities
  static getDataStats(clients: Client[], workers: Worker[], tasks: Task[]) {
    return {
      totalClients: clients.length,
      totalWorkers: workers.length,
      totalTasks: tasks.length,
      averagePriority: clients.reduce((sum, c) => sum + c.PriorityLevel, 0) / clients.length || 0,
      averageDuration: tasks.reduce((sum, t) => sum + t.Duration, 0) / tasks.length || 0,
      averageMaxConcurrent: tasks.reduce((sum, t) => sum + t.MaxConcurrent, 0) / tasks.length || 0,
      uniqueSkills: new Set(workers.flatMap(w => w.Skills.split(',').map(s => s.trim()))).size,
      uniqueGroups: new Set([...clients.map(c => c.GroupTag), ...workers.map(w => w.WorkerGroup)]).size
    };
  }
} 