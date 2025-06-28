import { ValidationSummary } from '@/lib/types';
import { CheckCircle, AlertTriangle, Info, AlertCircle, RefreshCw } from 'lucide-react';

interface ValidationPanelProps {
  validationSummary: ValidationSummary;
  onRunValidation: () => void;
  isLoading?: boolean;
}

export function ValidationPanel({ validationSummary, onRunValidation, isLoading }: ValidationPanelProps) {
  const { errors, warnings, info, totalErrors, totalWarnings, totalInfo } = validationSummary;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Data Validation</h2>
        <button
          onClick={onRunValidation}
          disabled={isLoading}
          className="btn-primary flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Validating...' : 'Run Validation'}</span>
        </button>
      </div>

      {/* Validation Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`card p-4 ${totalErrors > 0 ? 'border-destructive' : 'border-green-200'}`}>
          <div className="flex items-center space-x-3">
            <AlertCircle className={`h-8 w-8 ${totalErrors > 0 ? 'text-destructive' : 'text-green-600'}`} />
            <div>
              <p className="text-2xl font-bold">{totalErrors}</p>
              <p className="text-sm text-muted-foreground">Errors</p>
            </div>
          </div>
        </div>

        <div className={`card p-4 ${totalWarnings > 0 ? 'border-yellow-200' : 'border-green-200'}`}>
          <div className="flex items-center space-x-3">
            <AlertTriangle className={`h-8 w-8 ${totalWarnings > 0 ? 'text-yellow-600' : 'text-green-600'}`} />
            <div>
              <p className="text-2xl font-bold">{totalWarnings}</p>
              <p className="text-sm text-muted-foreground">Warnings</p>
            </div>
          </div>
        </div>

        <div className="card p-4 border-blue-200">
          <div className="flex items-center space-x-3">
            <Info className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold">{totalInfo}</p>
              <p className="text-sm text-muted-foreground">Info</p>
            </div>
          </div>
        </div>
      </div>

      {/* Validation Results */}
      <div className="space-y-4">
        {totalErrors > 0 && (
          <div className="card">
            <div className="p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-destructive flex items-center space-x-2">
                <AlertCircle className="h-5 w-5" />
                <span>Errors ({totalErrors})</span>
              </h3>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {errors.map((error, index) => (
                <div key={index} className="p-4 border-b border-border last:border-b-0">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-destructive">{error.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {error.entity} • {error.entityId}
                        {error.field && ` • Field: ${error.field}`}
                        {error.row && ` • Row: ${error.row}`}
                      </p>
                      {error.suggestion && (
                        <p className="text-xs text-blue-600 mt-1">
                          💡 {error.suggestion}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {totalWarnings > 0 && (
          <div className="card">
            <div className="p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-yellow-600 flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5" />
                <span>Warnings ({totalWarnings})</span>
              </h3>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {warnings.map((warning, index) => (
                <div key={index} className="p-4 border-b border-border last:border-b-0">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-yellow-600">{warning.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {warning.entity} • {warning.entityId}
                        {warning.field && ` • Field: ${warning.field}`}
                        {warning.row && ` • Row: ${warning.row}`}
                      </p>
                      {warning.suggestion && (
                        <p className="text-xs text-blue-600 mt-1">
                          💡 {warning.suggestion}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {totalInfo > 0 && (
          <div className="card">
            <div className="p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-blue-600 flex items-center space-x-2">
                <Info className="h-5 w-5" />
                <span>Information ({totalInfo})</span>
              </h3>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {info.map((infoItem, index) => (
                <div key={index} className="p-4 border-b border-border last:border-b-0">
                  <div className="flex items-start space-x-3">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-600">{infoItem.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {infoItem.entity} • {infoItem.entityId}
                        {infoItem.field && ` • Field: ${infoItem.field}`}
                        {infoItem.row && ` • Row: ${infoItem.row}`}
                      </p>
                      {infoItem.suggestion && (
                        <p className="text-xs text-blue-600 mt-1">
                          💡 {infoItem.suggestion}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {totalErrors === 0 && totalWarnings === 0 && totalInfo === 0 && (
          <div className="card p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-600 mb-2">All Data Validated Successfully!</h3>
            <p className="text-muted-foreground">
              Your data has passed all validation checks and is ready for processing.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 