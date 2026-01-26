import React, { useState, useRef } from 'react';
import { FileText, Upload, Check, X, File, Globe, Database, FileType } from 'lucide-react';
import { BaseModal } from '../design-system/BaseModal';
import { AppButton, FormField } from '../design-system';

interface UploadKnowledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UploadedFile {
  name: string;
  size: number;
  type: string;
}

type KnowledgeBaseType = 'pdf' | 'text' | 'url' | 'database';

const KB_TYPES = [
  { id: 'pdf' as const, name: 'PDF Documents', icon: FileText, description: 'Upload PDF files' },
  { id: 'text' as const, name: 'Text Files', icon: FileType, description: 'TXT, DOCX, MD files' },
  { id: 'url' as const, name: 'Web URL', icon: Globe, description: 'Scrape website content' },
  { id: 'database' as const, name: 'Database', icon: Database, description: 'Connect data source' },
];

export const UploadKnowledgeModal: React.FC<UploadKnowledgeModalProps> = ({ isOpen, onClose }) => {
  const [kbType, setKbType] = useState<KnowledgeBaseType | null>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [url, setUrl] = useState('');
  const [dbConnection, setDbConnection] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      const newFiles = Array.from(selectedFiles).map((f) => ({
        name: f.name,
        size: f.size,
        type: f.type,
      }));
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    setUploading(true);
    // TODO: Upload to Supabase Storage based on type
    await new Promise((r) => setTimeout(r, 1500));
    setUploading(false);
    setFiles([]);
    setUrl('');
    setDbConnection('');
    setKbType(null);
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getAcceptedFiles = () => {
    switch (kbType) {
      case 'pdf': return '.pdf';
      case 'text': return '.txt,.docx,.md';
      default: return '.pdf,.docx,.txt,.md';
    }
  };

  const isFormValid = () => {
    if (!kbType) return false;
    if (kbType === 'url') return url.trim().length > 0;
    if (kbType === 'database') return dbConnection.trim().length > 0;
    return files.length > 0;
  };

  const handleReset = () => {
    setKbType(null);
    setFiles([]);
    setUrl('');
    setDbConnection('');
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Knowledge Base"
      subtitle="Train AI with your documents and data"
      icon={<FileText size={24} />}
      maxWidth="max-w-lg"
      footer={
        <>
          <AppButton variant="secondary" onClick={kbType ? handleReset : onClose}>
            {kbType ? 'Back' : 'Cancel'}
          </AppButton>
          <AppButton
            variant="primary"
            icon={<Check size={16} />}
            onClick={handleUpload}
            loading={uploading}
            disabled={!isFormValid()}
          >
            {kbType === 'url' ? 'Scrape URL' : kbType === 'database' ? 'Connect' : `Upload ${files.length > 0 ? `(${files.length})` : ''}`}
          </AppButton>
        </>
      }
    >
      <div className="space-y-4">
        {/* Knowledge Base Type Selection */}
        {!kbType && (
          <fieldset className="space-y-3">
            <legend className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-3">
              Select Knowledge Base Type
            </legend>
            <div className="grid grid-cols-2 gap-3">
              {KB_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setKbType(type.id)}
                    className="p-4 rounded-xl text-left transition-all bg-stone-50 hover:bg-stone-100 border border-stone-200 hover:border-stone-300 group"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-white rounded-lg border border-stone-100 group-hover:border-stone-200">
                        <Icon size={18} className="text-stone-600" />
                      </div>
                      <span className="text-sm font-bold text-stone-900">{type.name}</span>
                    </div>
                    <p className="text-xs text-stone-500">{type.description}</p>
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        {/* URL Input */}
        {kbType === 'url' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-stone-600 mb-2">
              <Globe size={16} />
              <span className="text-xs font-bold uppercase tracking-wide">Web URL Source</span>
            </div>
            <FormField
              label="Website URL"
              name="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/docs"
            />
            <p className="text-xs text-stone-500">
              Enter the URL of the website or documentation page to scrape content from.
            </p>
          </div>
        )}

        {/* Database Connection */}
        {kbType === 'database' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-stone-600 mb-2">
              <Database size={16} />
              <span className="text-xs font-bold uppercase tracking-wide">Database Connection</span>
            </div>
            <FormField
              label="Connection String"
              name="dbConnection"
              value={dbConnection}
              onChange={(e) => setDbConnection(e.target.value)}
              placeholder="postgresql://user:pass@host:5432/db"
            />
            <p className="text-xs text-stone-500">
              Enter your database connection string. Supported: PostgreSQL, MySQL, MongoDB.
            </p>
          </div>
        )}

        {/* File Upload for PDF/Text */}
        {(kbType === 'pdf' || kbType === 'text') && (
          <>
            <div className="flex items-center gap-2 text-stone-600 mb-2">
              {kbType === 'pdf' ? <FileText size={16} /> : <FileType size={16} />}
              <span className="text-xs font-bold uppercase tracking-wide">
                {kbType === 'pdf' ? 'PDF Documents' : 'Text Files'}
              </span>
            </div>

            {/* Drop Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-stone-200 rounded-2xl p-8 text-center cursor-pointer hover:border-stone-400 transition-colors"
            >
              <Upload size={32} className="mx-auto text-stone-400 mb-3" />
              <p className="text-sm font-medium text-stone-700">Click to upload files</p>
              <p className="text-xs text-stone-500 mt-1">
                {kbType === 'pdf' ? 'PDF files up to 10MB each' : 'TXT, DOCX, MD up to 10MB each'}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={getAcceptedFiles()}
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-stone-500 uppercase tracking-wide">
                  Selected Files ({files.length})
                </p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-stone-50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <File size={16} className="text-stone-400" />
                        <div>
                          <p className="text-sm font-medium text-stone-700 truncate max-w-[200px]">
                            {file.name}
                          </p>
                          <p className="text-xs text-stone-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="p-1.5 hover:bg-stone-200 rounded-lg transition-colors"
                      >
                        <X size={14} className="text-stone-500" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
          <p className="text-xs text-purple-800">
            {kbType === 'url'
              ? 'The website content will be scraped and indexed for AI training. Respect robots.txt rules.'
              : kbType === 'database'
              ? 'Database content will be securely queried and indexed. Read-only access recommended.'
              : 'Documents will be processed and indexed for AI training. This may take a few minutes depending on file size.'}
          </p>
        </div>
      </div>
    </BaseModal>
  );
};
