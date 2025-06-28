import { useState, useCallback } from 'react';
import { DataGrid } from 'react-data-grid';
import { ValidationError } from '@/lib/types';
import { Edit2, Save, X } from 'lucide-react';

interface DataGridProps {
  title: string;
  data: any[];
  onDataChange: (data: any[]) => void;
  validationErrors?: ValidationError[];
}

export function DataGridComponent({ title, data, onDataChange, validationErrors = [] }: DataGridProps) {
  const [editingCell, setEditingCell] = useState<{ rowIdx: number; idx: number } | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  // Create columns based on data structure
  const columns = data.length > 0 ? Object.keys(data[0]).map(key => ({
    key,
    name: key,
    width: 150,
    resizable: true,
    sortable: true,
    renderCell: ({ row, column, onRowChange }: any) => {
      const isEditing = editingCell?.rowIdx === row.__rowIdx && editingCell?.idx === column.idx;
      const hasError = validationErrors.some(error => 
        error.entityId === row[Object.keys(row).find(k => k.includes('ID') || k.includes('id')) || ''] &&
        error.field === column.key
      );

      if (isEditing) {
        return (
          <div className="flex items-center space-x-1 p-1">
            <input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="flex-1 px-2 py-1 text-sm border rounded"
              autoFocus
            />
            <button
              onClick={() => {
                const newData = [...data];
                newData[row.__rowIdx] = { ...newData[row.__rowIdx], [column.key]: editValue };
                onDataChange(newData);
                setEditingCell(null);
              }}
              className="p-1 text-green-600 hover:text-green-700"
            >
              <Save className="h-3 w-3" />
            </button>
            <button
              onClick={() => setEditingCell(null)}
              className="p-1 text-red-600 hover:text-red-700"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      }

      return (
        <div 
          className={`p-2 cursor-pointer hover:bg-muted/50 ${hasError ? 'bg-destructive/10 border-l-2 border-destructive' : ''}`}
          onClick={() => {
            setEditingCell({ rowIdx: row.__rowIdx, idx: column.idx });
            setEditValue(String(row[column.key] || ''));
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm truncate">{String(row[column.key] || '')}</span>
            <Edit2 className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
          </div>
        </div>
      );
    }
  })) : [];

  const handleRowsChange = useCallback((newRows: any[]) => {
    onDataChange(newRows);
  }, [onDataChange]);

  return (
    <div className="card">
      <div className="p-4 border-b border-border">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">
          {data.length} records
          {validationErrors.length > 0 && (
            <span className="text-destructive ml-2">
              • {validationErrors.length} errors
            </span>
          )}
        </p>
      </div>
      
      <div className="h-96">
        {data.length > 0 ? (
          <DataGrid
            columns={columns}
            rows={data.map((row, index) => ({ ...row, __rowIdx: index }))}
            onRowsChange={handleRowsChange}
            className="rdg"
            headerRowHeight={40}
            rowHeight={40}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>No data available</p>
          </div>
        )}
      </div>
      
      {validationErrors.length > 0 && (
        <div className="p-4 border-t border-border bg-destructive/5">
          <h4 className="text-sm font-medium text-destructive mb-2">Validation Errors:</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {validationErrors.slice(0, 5).map((error, index) => (
              <div key={index} className="text-xs text-destructive">
                • {error.message}
              </div>
            ))}
            {validationErrors.length > 5 && (
              <div className="text-xs text-muted-foreground">
                ... and {validationErrors.length - 5} more errors
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 