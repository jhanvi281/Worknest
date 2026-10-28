import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  UploadCloud,
  FolderPlus,
  FileText,
  Presentation,
  Image as ImageIcon,
  FileSpreadsheet,
  Archive,
  Download,
  Eye,
  Trash2,
  Search,
} from 'lucide-react';
import { FileUploadModal } from './FileUploadModal';
import { FilePreviewModal } from './FilePreviewModal';
import type { FileCategory, ProjectFile } from '../../types';

export const FilesView: React.FC = () => {
  const { files, deleteFile, addToast } = useApp();
  const [activeCategory, setActiveCategory] = useState<FileCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<ProjectFile | null>(null);

  const filteredFiles = files.filter((f) => {
    if (activeCategory !== 'all' && f.category !== activeCategory) return false;
    if (searchQuery && !f.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'PPT':
      case 'PPTX':
        return <Presentation className="w-5 h-5 text-amber-500" />;
      case 'PDF':
      case 'DOC':
      case 'DOCX':
        return <FileText className="w-5 h-5 text-cyan-500" />;
      case 'XLS':
      case 'XLSX':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
      case 'PNG':
      case 'JPG':
        return <ImageIcon className="w-5 h-5 text-indigo-500" />;
      default:
        return <Archive className="w-5 h-5 text-purple-500" />;
    }
  };

  const handleDownload = (fileName: string) => {
    addToast(`Downloading ${fileName}...`, 'info');
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Project Files
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Store and access everything your team needs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => addToast('New Folder created', 'success')}
            className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-2"
          >
            <FolderPlus className="w-4 h-4 text-amber-500" /> New Folder
          </button>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-lg shadow-cyan-600/25 flex items-center gap-2 transition"
          >
            <UploadCloud className="w-4 h-4" /> Upload File
          </button>
        </div>
      </div>

      {/* DRAG AND DROP QUICK BANNER */}
      <div
        onClick={() => setIsUploadOpen(true)}
        className="p-6 rounded-3xl border-2 border-dashed border-cyan-500/40 bg-cyan-50/20 dark:bg-cyan-950/20 hover:bg-cyan-50/40 dark:hover:bg-cyan-950/30 transition flex flex-col sm:flex-row items-center justify-between gap-4 cursor-pointer"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-cyan-100 dark:bg-cyan-900/60 text-cyan-600 shrink-0">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">Quick File Upload Area</div>
            <p className="text-xs text-slate-500">Drag & drop files or click here to browse your local documents.</p>
          </div>
        </div>

        <button className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-cyan-500/40 text-cyan-600 dark:text-cyan-400 font-bold text-xs shrink-0">
          Browse Files
        </button>
      </div>

      {/* Category Tabs & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Categories */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold overflow-x-auto w-full sm:w-auto">
          {(['all', 'presentations', 'documents', 'images', 'other'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl capitalize transition shrink-0 ${
                activeCategory === cat
                  ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search project files..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none"
          />
        </div>
      </div>

      {/* FILE TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {filteredFiles.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <FileText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">No project files found</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-6">File Name</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Uploaded By</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Size</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group">
                    <td className="py-4 px-6 font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">{getFileIcon(file.type)}</div>
                      <span className="truncate max-w-xs">{file.name}</span>
                    </td>
                    <td className="py-4 px-4 font-mono text-slate-500 uppercase">{file.type}</td>
                    <td className="py-4 px-4 font-medium text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <img src={file.uploaderAvatar} alt={file.uploadedBy} className="w-5 h-5 rounded-full object-cover" />
                        <span>{file.uploadedBy}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-400">{file.date}</td>
                    <td className="py-4 px-4 text-slate-400 font-mono">{file.size}</td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setPreviewFile(file)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 transition"
                          title="Preview File"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownload(file.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition"
                          title="Download File"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteFile(file.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                          title="Delete File"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <FileUploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />

      {/* Preview Modal */}
      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
    </div>
  );
};
