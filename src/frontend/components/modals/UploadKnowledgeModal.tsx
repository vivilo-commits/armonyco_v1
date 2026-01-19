import React, { useState, useRef } from 'react';
import { FileText, Upload, Check, X, File } from 'lucide-react';
import { BaseModal } from '../design-system/BaseModal';
import { AppButton } from '../design-system';

interface UploadKnowledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UploadedFile {
  name: string;
  size: number;
  type: string;
}

export const UploadKnowledgeModal: React.FC<UploadKnowledgeModalProps> = ({ isOpen, onClose }) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
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
    // TODO: Upload to Supabase Storage
    await new Promise((r) => setTimeout(r, 1500));
    setUploading(false);
    setFiles([]);
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Knowledge Base"
      subtitle="Train AI with your documents"
      icon={<FileText size={24} />}
      maxWidth="max-w-lg"
      footer={
        <>
          <AppButton variant="secondary" onClick={onClose}>
            Cancel
          </AppButton>
          <AppButton
            variant="primary"
            icon={<Check size={16} />}
            onClick={handleUpload}
            loading={uploading}
            disabled={files.length === 0}
          >
            Upload {files.length > 0 && `(${files.length})`}
          </AppButton>
        </>
      }
    >
      <div className="space-y-4">
        {/* Drop Zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-stone-200 rounded-2xl p-8 text-center cursor-pointer hover:border-stone-400 transition-colors"
        >
          <Upload size={32} className="mx-auto text-stone-400 mb-3" />
          <p className="text-sm font-medium text-stone-700">Click to upload files</p>
          <p className="text-xs text-stone-500 mt-1">PDF, DOCX, TXT up to 10MB each</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.txt,.md"
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

        <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
          <p className="text-xs text-purple-800">
            Documents will be processed and indexed for AI training. This may take a few minutes
            depending on file size.
          </p>
        </div>
      </div>
    </BaseModal>
  );
};
