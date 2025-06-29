
'use client';

import { useState, useEffect } from 'react';
import { Client, Worker, Task, ValidationSummary, BusinessRule, PrioritizationWeights, DataState } from '@/lib/types';
import { ValidationEngine } from '@/lib/validation';
import { AIService } from '@/lib/ai-service';
import { DataProcessor } from '@/lib/data-processor';
import { UploadArea } from '@/components/UploadArea';
import { DataGridComponent } from '@/components/DataGrid';
import { ValidationPanel } from '@/components/ValidationPanel';
import { BusinessRulesPanel } from '@/components/BusinessRulesPanel';
import { PrioritizationPanel } from '@/components/PrioritizationPanel';
import { AISearchPanel } from '@/components/AISearchPanel';
import { AISuggestionsPanel } from '@/components/AISuggestionsPanel';
import { AIStatusIndicator } from '@/components/AIStatusIndicator';
import { ExportPanel } from '@/components/ExportPanel';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { toast } from 'react-hot-toast';



export default function Home() {
  const [dataState, setDataState] = useState<DataState>({
    clients: [],
    workers: [],
    tasks: [],
    validationSummary: {
      totalErrors: 0,
      totalWarnings: 0,
      totalInfo: 0,
      errors: [],
      warnings: [],
      info: []
    },
    businessRules: [],
    prioritizationWeights: {
      priorityLevel: 0.3,
      fulfillment: 0.25,
      fairness: 0.2,
      workload: 0.15,
      efficiency: 0.1,
      cost: 0.0
    },
    isLoading: false,
    hasData: false
  });

  const [activeTab, setActiveTab] = useState<'data' | 'validation' | 'rules' | 'priorities' | 'ai' | 'export'>('data');
  const [aiService, setAiService] = useState<AIService | null>(null);
  const [uploadStatus, setUploadStatus] = useState({ client: false, worker: false, task: false });

  const allFilesUploaded = uploadStatus.client && uploadStatus.worker && uploadStatus.task;

  useEffect(() => {
    if (allFilesUploaded) {
      setAiService(new AIService(dataState.clients, dataState.workers, dataState.tasks));
      runValidation();
    }
  }, [uploadStatus]);

  const handleFileUpload = async (file: File, entityType: 'client' | 'worker' | 'task') => {
    setDataState(prev => ({ ...prev, isLoading: true }));

    try {
      let { data, headers } = await DataProcessor.parseFile(file);

      let convertedData: any[] = [];
      switch (entityType) {
        case 'client':
          convertedData = DataProcessor.convertToClients(data).map((d, idx) => ({ ...d, _index: idx }));
          break;
        case 'worker':
          convertedData = DataProcessor.convertToWorkers(data).map((d, idx) => ({ ...d, _index: idx }));
          break;
        case 'task':
          convertedData = DataProcessor.convertToTasks(data).map((d, idx) => ({ ...d, _index: idx }));
          break;
      }

      setDataState(prev => ({
        ...prev,
        clients: entityType === 'client' ? convertedData as Client[] : prev.clients,
        workers: entityType === 'worker' ? convertedData as Worker[] : prev.workers,
        tasks: entityType === 'task' ? convertedData as Task[] : prev.tasks,
        hasData: allFilesUploaded
      }));

      setUploadStatus(prev => ({ ...prev, [entityType]: true }));

      toast.success(`Uploaded ${convertedData.length} ${entityType}s`);
    } catch (error) {
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDataState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const runValidation = () => {
    const validator = new ValidationEngine(dataState.clients, dataState.workers, dataState.tasks);
    const validationSummary = validator.validateAll();
    setDataState(prev => ({ ...prev, validationSummary }));

    if (validationSummary.totalErrors > 0) {
      toast.error(`Found ${validationSummary.totalErrors} validation errors`);
    } else if (validationSummary.totalWarnings > 0) {
      toast(`Found ${validationSummary.totalWarnings} validation warnings`, {
        icon: '⚠️',
        style: { background: '#fbbf24', color: '#92400e' }
      });
    } else {
      toast.success('All data validated successfully!');
    }
  };

  const updateData = (entityType: 'client' | 'worker' | 'task', updatedData: any[]) => {
    const reIndexedData = updatedData.map((item, idx) => ({ ...item, _index: idx }));
    setDataState(prev => {
      const newState = { ...prev };
      if (entityType === 'client') newState.clients = reIndexedData;
      if (entityType === 'worker') newState.workers = reIndexedData;
      if (entityType === 'task') newState.tasks = reIndexedData;
      return newState;
    });
    setTimeout(runValidation, 100);
  };

  const updateBusinessRules = (rules: BusinessRule[]) => {
    setDataState(prev => ({ ...prev, businessRules: rules }));
  };

  const updatePrioritizationWeights = (weights: PrioritizationWeights) => {
    setDataState(prev => ({ ...prev, prioritizationWeights: weights }));
  };

  const handleExport = () => {
    try {
      DataProcessor.exportAllData({
        clients: dataState.clients,
        workers: dataState.workers,
        tasks: dataState.tasks,
        rules: dataState.businessRules,
        weights: dataState.prioritizationWeights,
        validationSummary: dataState.validationSummary
      });
      toast.success('Data exported successfully!');
    } catch (error) {
      toast.error('Export failed');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex h-screen">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-6">
            {!allFilesUploaded ? (
              <div className="space-y-6">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-foreground mb-4">🧪 Data Alchemist</h1>
                  <p className="text-xl text-muted-foreground mb-8">Upload all three files to begin processing</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <UploadArea title="Clients" description="Upload client data (CSV/XLSX)" onUpload={(file) => handleFileUpload(file, 'client')} isLoading={dataState.isLoading} />
                  <UploadArea title="Workers" description="Upload worker data (CSV/XLSX)" onUpload={(file) => handleFileUpload(file, 'worker')} isLoading={dataState.isLoading} />
                  <UploadArea title="Tasks" description="Upload task data (CSV/XLSX)" onUpload={(file) => handleFileUpload(file, 'task')} isLoading={dataState.isLoading} />
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {activeTab === 'data' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-bold">Data Management</h2>
                      <button onClick={runValidation} className="btn-primary" disabled={dataState.isLoading}>
                        {dataState.isLoading ? 'Validating...' : 'Run Validation'}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <DataGridComponent title="Clients" data={dataState.clients} onDataChange={(data) => updateData('client', data)} validationErrors={dataState.validationSummary.errors.filter(e => e.entity === 'client')} />
                      <DataGridComponent title="Workers" data={dataState.workers} onDataChange={(data) => updateData('worker', data)} validationErrors={dataState.validationSummary.errors.filter(e => e.entity === 'worker')} />
                      <DataGridComponent title="Tasks" data={dataState.tasks} onDataChange={(data) => updateData('task', data)} validationErrors={dataState.validationSummary.errors.filter(e => e.entity === 'task')} />
                    </div>
                  </div>
                )}
                {activeTab === 'validation' && (
                  <ValidationPanel validationSummary={dataState.validationSummary} onRunValidation={runValidation} isLoading={dataState.isLoading} />
                )}
                {activeTab === 'rules' && (
                  <BusinessRulesPanel rules={dataState.businessRules} onRulesChange={updateBusinessRules} clients={dataState.clients} workers={dataState.workers} tasks={dataState.tasks} aiService={aiService} />
                )}
                {activeTab === 'priorities' && (
                  <PrioritizationPanel weights={dataState.prioritizationWeights} onWeightsChange={updatePrioritizationWeights} />
                )}
                {activeTab === 'ai' && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h2 className="text-2xl font-bold">AI Features</h2>
                      <AIStatusIndicator aiService={aiService} />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <AISearchPanel aiService={aiService} />
                      <AISuggestionsPanel aiService={aiService} />
                    </div>
                  </div>
                )}
                {activeTab === 'export' && (
                  <ExportPanel dataState={dataState} onExport={handleExport} isLoading={dataState.isLoading} />
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
