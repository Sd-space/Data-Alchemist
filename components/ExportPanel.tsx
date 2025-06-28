import { DataState } from '@/lib/types';
import { Download, FileText, Settings, CheckCircle, AlertTriangle } from 'lucide-react';

interface ExportPanelProps {
  dataState: DataState;
  onExport: () => void;
  isLoading?: boolean;
}

export function ExportPanel({ dataState, onExport, isLoading }: ExportPanelProps) {
  const { clients, workers, tasks, validationSummary, businessRules, prioritizationWeights } = dataState;
  
  const totalRecords = clients.length + workers.length + tasks.length;
  const hasErrors = validationSummary.totalErrors > 0;
  const hasWarnings = validationSummary.totalWarnings > 0;
  const isReadyToExport = totalRecords > 0 && !hasErrors;

  const getExportStatus = () => {
    if (totalRecords === 0) {
      return {
        status: 'no-data',
        icon: <AlertTriangle className="h-6 w-6 text-yellow-600" />,
        title: 'No Data to Export',
        description: 'Upload some data first before exporting.',
        color: 'text-yellow-600'
      };
    }
    
    if (hasErrors) {
      return {
        status: 'has-errors',
        icon: <AlertTriangle className="h-6 w-6 text-red-600" />,
        title: 'Validation Errors Found',
        description: 'Fix validation errors before exporting.',
        color: 'text-red-600'
      };
    }
    
    if (hasWarnings) {
      return {
        status: 'has-warnings',
        icon: <AlertTriangle className="h-6 w-6 text-yellow-600" />,
        title: 'Ready to Export (with warnings)',
        description: 'Data can be exported, but consider reviewing warnings.',
        color: 'text-yellow-600'
      };
    }
    
    return {
      status: 'ready',
      icon: <CheckCircle className="h-6 w-6 text-green-600" />,
      title: 'Ready to Export',
      description: 'All data is validated and ready for export.',
      color: 'text-green-600'
    };
  };

  const exportStatus = getExportStatus();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Export Data</h2>
        <p className="text-muted-foreground">
          Download your cleaned and validated data for the next stage
        </p>
      </div>

      {/* Export Status */}
      <div className="card p-6">
        <div className="flex items-start space-x-4">
          {exportStatus.icon}
          <div className="flex-1">
            <h3 className={`text-lg font-semibold ${exportStatus.color}`}>
              {exportStatus.title}
            </h3>
            <p className="text-muted-foreground mb-4">
              {exportStatus.description}
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{clients.length}</div>
                <div className="text-sm text-muted-foreground">Clients</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{workers.length}</div>
                <div className="text-sm text-muted-foreground">Workers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{tasks.length}</div>
                <div className="text-sm text-muted-foreground">Tasks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{businessRules.length}</div>
                <div className="text-sm text-muted-foreground">Rules</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export Button */}
      <div className="flex justify-center">
        <button
          onClick={onExport}
          disabled={isLoading || !isReadyToExport}
          className={`flex items-center space-x-2 px-8 py-3 rounded-lg font-medium transition-colors ${
            isReadyToExport
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
        >
          <Download className="h-5 w-5" />
          <span>{isLoading ? 'Exporting...' : 'Export All Data'}</span>
        </button>
      </div>
    </div>
  );
} 