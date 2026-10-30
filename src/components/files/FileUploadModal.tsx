import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X, UploadCloud, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import {
  MAX_FILE_SIZE_BYTES,
  formatFileSize,
  detectFileTypeAndCategory,
  sanitizeFileName,
} from '../../services/fileService';
import type { FileCategory } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultTeamId?: string;
}

export const FileUploadModal: React.FC<Props> = ({ isOpen, onClose, defaultTeamId }) => {
  const { uploadFile, teams, activeTeamId } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customFileName, setCustomFileName] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string>(defaultTeamId || activeTeamId || '');
  const [category, setCategory] = useState<FileCategory>('documents');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedTeamId(defaultTeamId || activeTeamId || '');
      setErrorMessage(null);
    } else {
      setSelectedFile(null);
      setCustomFileName('');
      setErrorMessage(null);
      setIsUploading(false);
    }
  }, [isOpen, defaultTeamId, activeTeamId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isUploading) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isUploading, onClose]);

  if (!isOpen) return null;

  const handleFileSelection = (file: File) => {
    setErrorMessage(null);

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage(
        `File size (${formatFileSize(file.size)}) exceeds the maximum allowed limit of 50MB.`
      );
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setCustomFileName(sanitizeFileName(file.name));
    const detected = detectFileTypeAndCategory(file.name);
    setCategory(detected.category);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage('Please select a file to upload.');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      await uploadFile(selectedFile, {
        teamId: selectedTeamId ? selectedTeamId : undefined,
        customName: customFileName.trim() || selectedFile.name,
        category,
      });

      onClose();
    } catch (err: unknown) {
      console.error('File upload failed in modal:', err);
      const msg = err instanceof Error ? err.message : 'Upload failed. Please try again.';
      setErrorMessage(msg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="file-upload-modal-title"
      onClick={!isUploading ? onClose : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white dark:bg-[#141414] rounded-3xl shadow-2xl border border-[#E5E5E5] dark:border-[#333333] overflow-hidden flex flex-col max-h-[calc(100vh-2rem)] my-auto"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E5E5E5] dark:border-[#333333] flex items-center justify-between shrink-0">
          <div id="file-upload-modal-title" className="flex items-center gap-2.5 font-bold text-[#171717] dark:text-[#FAFAFA]">
            <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-[#F97316]">
              <UploadCloud className="w-5 h-5" />
            </div>
            <span>Upload Project File</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-[#737373] dark:text-[#A3A3A3] hover:text-[#171717] dark:hover:text-[#FAFAFA] transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleInputChange}
            className="hidden"
          />

          {/* Drag & Drop Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`p-6 border-2 border-dashed rounded-2xl text-center space-y-2 cursor-pointer transition-colors ${
              isDragging
                ? 'border-[#F97316] bg-orange-50 dark:bg-orange-950/40'
                : selectedFile
                ? 'border-emerald-500/50 bg-emerald-50/20 dark:bg-emerald-950/20'
                : 'border-[#E5E5E5] dark:border-[#333333] hover:border-[#F97316] bg-[#FAFAFA] dark:bg-[#1C1C1C]'
            }`}
          >
            {selectedFile ? (
              <div className="space-y-1.5">
                <div className="inline-flex p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div className="text-sm font-bold text-[#171717] dark:text-[#FAFAFA] truncate max-w-xs mx-auto">
                  {selectedFile.name}
                </div>
                <div className="text-xs text-[#737373] dark:text-[#A3A3A3] font-mono">
                  {formatFileSize(selectedFile.size)} • Click or drop to replace
                </div>
              </div>
            ) : (
              <>
                <UploadCloud className="w-8 h-8 text-[#F97316] mx-auto" />
                <div className="text-xs font-bold text-[#171717] dark:text-[#FAFAFA]">
                  Drag & drop your file here, or{' '}
                  <span className="text-[#F97316] underline">browse</span>
                </div>
                <p className="text-[11px] text-[#737373] dark:text-[#A3A3A3]">
                  Supports documents, presentations, images, sheets, and archives (Max 50MB)
                </p>
              </>
            )}
          </div>

          {/* File Name Field */}
          <div>
            <label className="block text-xs font-semibold text-[#171717] dark:text-[#FAFAFA] mb-1">
              File Display Name
            </label>
            <input
              type="text"
              required
              value={customFileName}
              onChange={(e) => setCustomFileName(e.target.value)}
              placeholder="e.g. WorkNest_Architecture_Specs.pdf"
              className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-[#171717] dark:text-[#FAFAFA] text-xs focus:outline-none focus:ring-2 focus:ring-[#F97316]"
            />
          </div>

          {/* Grid of Team Scope and Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Team Scope */}
            <div>
              <label className="block text-xs font-semibold text-[#171717] dark:text-[#FAFAFA] mb-1">
                Access Scope / Team
              </label>
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-[#171717] dark:text-[#FAFAFA] text-xs focus:outline-none focus:ring-2 focus:ring-[#F97316]"
              >
                <option value="">Personal File (Private to me)</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    Team: {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-[#171717] dark:text-[#FAFAFA] mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FileCategory)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-[#171717] dark:text-[#FAFAFA] text-xs focus:outline-none focus:ring-2 focus:ring-[#F97316]"
              >
                <option value="documents">Documents</option>
                <option value="presentations">Presentations</option>
                <option value="images">Images</option>
                <option value="other">Other / Archive</option>
              </select>
            </div>
          </div>

          {/* Security & Validation Notice */}
          <div className="p-3 rounded-2xl bg-[#FAFAFA] dark:bg-[#1C1C1C] border border-[#E5E5E5] dark:border-[#333333] text-[11px] text-[#737373] dark:text-[#A3A3A3] flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Files are encrypted at rest and guarded by PostgreSQL Row-Level Security.</span>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#E5E5E5] dark:border-[#333333] shrink-0">
            <button
              type="button"
              disabled={isUploading}
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#737373] dark:text-[#A3A3A3] hover:bg-[#FAFAFA] dark:hover:bg-[#1C1C1C] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedFile || isUploading}
              className="px-5 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] dark:hover:bg-[#FB923C] text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading to Storage...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload File</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
