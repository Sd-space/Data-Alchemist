import { useState, useRef } from 'react';
import { Upload, FileText, X } from 'lucide-react';

interface UploadAreaProps {
  title: string;
  description: string;
  onUpload: (file: File) => void;
  isLoading?: boolean;
}

export function UploadArea({ title, description, onUpload, isLoading }: UploadAreaProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      if (isValidFile(file)) {
        setSelectedFile(file);
        onUpload(file);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const file = files[0];
      if (isValidFile(file)) {
        setSelectedFile(file);
        onUpload(file);
      }
    }
  };

  const isValidFile = (file: File): boolean => {
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    return validExtensions.includes(fileExtension);
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="card p-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        
        {selectedFile ? (
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">{selectedFile.name}</span>
            </div>
            <button
              onClick={clearFile}
              className="text-muted-foreground hover:text-foreground"
              disabled={isLoading}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div
            className={`border-2 border-dashed rounded-lg p-8 transition-colors ${
              isDragOver
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center space-y-4">
              <Upload className={`h-12 w-12 ${isDragOver ? 'text-primary' : 'text-muted-foreground'}`} />
              <div className="text-center">
                <p className="text-sm font-medium">
                  {isDragOver ? 'Drop your file here' : 'Drag & drop your file here'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">or</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-primary mt-2"
                  disabled={isLoading}
                >
                  {isLoading ? 'Uploading...' : 'Browse Files'}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Supports CSV, XLSX, XLS files
              </p>
            </div>
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
} 
