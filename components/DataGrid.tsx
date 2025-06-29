 
import { useState } from 'react';
// @ts-ignore
import DataGrid from 'react-data-grid';
// @ts-ignore
import type { Column } from 'react-data-grid';
import { Edit2, Save, X } from 'lucide-react';
import { ValidationError } from '@/lib/types';

interface DataGridProps {
  title: string;
  data: any[];
  onDataChange: (data: any[]) => void;
  validationErrors?: ValidationError[];
}

export function DataGridComponent({ title, data, onDataChange, validationErrors = [] }: DataGridProps) {
  const [editing, setEditing] = useState<{ rowIndex: number; columnKey: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  const columns: Column<any>[] = data.length > 0
    ? Object.keys(data[0]).map((key) => ({
        key,
        name: key,
        editable: false,
        resizable: true,
        sortable: true,
        // @ts-ignore
        formatter: ({ row, column }) => {
          const isEditing = editing?.rowIndex !== undefined && editing.rowIndex === row._index && editing.columnKey === column.key;
          const hasError = validationErrors.some(
            (err) =>
              err.field === column.key &&
              err.entityId === row[row.ClientID ? 'ClientID' : row.WorkerID ? 'WorkerID' : 'TaskID']
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
                    const updated = [...data];
                    updated[row._index][column.key] = editValue;
                    onDataChange(updated);
                    setEditing(null);
                  }}
                  className="p-1 text-green-600 hover:text-green-700"
                >
                  <Save className="h-3 w-3" />
                </button>
                <button
                  onClick={() => setEditing(null)}
                  className="p-1 text-red-600 hover:text-red-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          }

          return (
            <div
              className={`p-2 cursor-pointer hover:bg-muted/50 ${
                hasError ? 'bg-red-100 border-l-2 border-red-500' : ''
              }`}
              onClick={() => {
                setEditing({ rowIndex: row._index, columnKey: column.key });
                setEditValue(String(row[column.key] ?? ''));
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm truncate">{String(row[column.key] ?? '')}</span>
                <Edit2 className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
              </div>
            </div>
          );
        }
      }))
    : [];

  const rows = data.map((row, i) => ({ ...row, _index: i }));

  return (
    <div className="card">
      <div className="p-4 border-b border-border">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">
          {data.length} records
          {validationErrors.length > 0 && (
            <span className="text-red-600 ml-2">• {validationErrors.length} errors</span>
          )}
        </p>
      </div>

      <div className="h-96">
        {rows.length > 0 ? (
          <DataGrid columns={columns} rows={rows} className="rdg" />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>No data available</p>
          </div>
        )}
      </div>

      {validationErrors.length > 0 && (
        <div className="p-4 border-t border-border bg-red-50">
          <h4 className="text-sm font-medium text-red-700 mb-2">Validation Errors:</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {validationErrors.slice(0, 5).map((error, index) => (
              <div key={index} className="text-xs text-red-700">• {error.message}</div>
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
