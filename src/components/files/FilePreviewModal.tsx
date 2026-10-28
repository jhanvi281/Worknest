import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, Download, FileText, CheckCircle2, Presentation, Image, FileSpreadsheet } from 'lucide-react';
import type { ProjectFile } from '../../types';

interface Props {
  file: ProjectFile | null;
  onClose: () => void;
}

export const FilePreviewModal: React.FC<Props> = ({ file, onClose }) => {
  const { addToast } = useApp();

  if (!file) return null;

  const handleDownload = () => {
    addToast(`Downloading ${file.name}...`, 'info');
  };

  let fileIcon = <FileText className="w-12 h-12 text-cyan-500" />;
  if (file.type === 'PPTX' || file.type === 'PPT') fileIcon = <Presentation className="w-12 h-12 text-amber-500" />;
  if (file.type === 'PNG' || file.type === 'JPG') fileIcon = <Image className="w-12 h-12 text-indigo-500" />;
  if (file.type === 'XLSX' || file.type === 'XLS') fileIcon = <FileSpreadsheet className="w-12 h-12 text-emerald-500" />;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white truncate">
            <span>File Preview:</span>
            <span className="text-cyan-600 dark:text-cyan-400 truncate">{file.name}</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewer Content Area */}
        <div className="p-8 flex-1 overflow-y-auto flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950/50 text-center space-y-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
            {fileIcon}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{file.name}</h3>
            <p className="text-xs text-slate-500 mt-1">
              Uploaded by {file.uploadedBy} on {file.date} ({file.size})
            </p>
          </div>

          <div className="p-4 max-w-md w-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left text-xs text-slate-600 dark:text-slate-400 space-y-2">
            <div className="flex justify-between">
              <span className="font-semibold text-slate-800 dark:text-slate-200">File Type:</span>
              <span className="font-mono uppercase">{file.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-slate-800 dark:text-slate-200">Category:</span>
              <span className="capitalize">{file.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-slate-800 dark:text-slate-200">Security Status:</span>
              <span className="text-emerald-500 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Virus Scanned & Encrypted
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Close
          </button>
          <button
            onClick={handleDownload}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-md shadow-cyan-600/30 flex items-center gap-2 transition"
          >
            <Download className="w-4 h-4" /> Download File
          </button>
        </div>
      </div>
    </div>
  );
};
