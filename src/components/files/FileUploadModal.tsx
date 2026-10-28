import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, UploadCloud } from 'lucide-react';
import type { FileCategory, FileType } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const FileUploadModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { addFile } = useApp();
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState<FileType>('PDF');
  const [category, setCategory] = useState<FileCategory>('documents');
  const [fileSize] = useState('3.4 MB');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim()) return;

    addFile({
      name: fileName.endsWith(`.${fileType.toLowerCase()}`) ? fileName : `${fileName}.${fileType.toLowerCase()}`,
      type: fileType,
      category,
      size: fileSize,
    });

    setFileName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
            <UploadCloud className="w-5 h-5 text-cyan-600" />
            <span>Upload Project File</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Drag & Drop Area */}
          <div className="p-6 border-2 border-dashed border-cyan-500/40 rounded-2xl bg-cyan-50/30 dark:bg-cyan-950/20 text-center space-y-2 cursor-pointer hover:border-cyan-500 transition">
            <UploadCloud className="w-8 h-8 text-cyan-600 mx-auto" />
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Drag & drop your files here</div>
            <p className="text-[10px] text-slate-400">Supports PPTX, PDF, DOCX, XLSX, PNG, JPG, ZIP (max 100MB)</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">File Name</label>
            <input
              type="text"
              required
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="e.g., WorkNest_Q4_Roadmap_Presentation"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">File Format</label>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value as FileType)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="PPTX">PPT / PPTX Presentation</option>
                <option value="PDF">PDF Document</option>
                <option value="DOCX">DOC / DOCX Document</option>
                <option value="XLSX">XLS / XLSX Spreadsheet</option>
                <option value="PNG">PNG / JPG Image</option>
                <option value="ZIP">ZIP Archive</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FileCategory)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="presentations">Presentations</option>
                <option value="documents">Documents</option>
                <option value="images">Images</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-md shadow-cyan-600/30"
            >
              Upload File
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
