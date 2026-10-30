import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  UploadCloud,
  FileText,
  Presentation,
  Image as ImageIcon,
  FileSpreadsheet,
  Archive,
  Download,
  Eye,
  Trash2,
  Search,
  RefreshCw,
  AlertCircle,
  FolderOpen,
  Filter,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { FileUploadModal } from './FileUploadModal';
import { FilePreviewModal } from './FilePreviewModal';
import { PageHeader } from '../common/PageHeader';
import { EmptyState } from '../common/EmptyState';
import { TableRowSkeleton } from '../common/LoadingSkeleton';
import type { FileCategory, ProjectFile } from '../../types';

export const FilesView: React.FC = () => {
  const {
    files,
    isLoadingFiles,
    filesError,
    refreshFiles,
    downloadFile,
    deleteFile,
    user,
    teams,
  } = useApp();

  const [activeCategory, setActiveCategory] = useState<FileCategory>('all');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<ProjectFile | null>(null);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [filePendingDelete, setFilePendingDelete] = useState<ProjectFile | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && filePendingDelete && !deletingFileId) {
        setFilePendingDelete(null);
      }
    };
    if (filePendingDelete) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filePendingDelete, deletingFileId]);

  // Filter files by category, team scope, and search keyword
  const filteredFiles = files.filter((f) => {
    // 1. Category Filter
    if (activeCategory !== 'all' && f.category !== activeCategory) return false;

    // 2. Team Scope Filter
    if (selectedTeamFilter === 'personal') {
      if (f.teamId) return false;
    } else if (selectedTeamFilter !== 'all') {
      if (f.teamId !== selectedTeamFilter) return false;
    }

    // 3. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = f.name.toLowerCase().includes(q);
      const matchUploader = f.uploadedBy.toLowerCase().includes(q);
      const matchTeam = f.teamName ? f.teamName.toLowerCase().includes(q) : false;
      if (!matchName && !matchUploader && !matchTeam) return false;
    }

    return true;
  });

  const getFileIcon = (type: string) => {
    const upper = type.toUpperCase();
    switch (upper) {
      case 'PPT':
      case 'PPTX':
        return <Presentation className="w-5 h-5 text-amber-500" />;
      case 'PDF':
      case 'DOC':
      case 'DOCX':
        return <FileText className="w-5 h-5 text-[#F97316]" />;
      case 'XLS':
      case 'XLSX':
      case 'CSV':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
      case 'PNG':
      case 'JPG':
      case 'JPEG':
      case 'GIF':
      case 'WEBP':
      case 'SVG':
        return <ImageIcon className="w-5 h-5 text-sky-500" />;
      default:
        return <Archive className="w-5 h-5 text-[#737373] dark:text-[#A3A3A3]" />;
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshFiles();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Determine if the current user has authorization to delete this file
  const canDeleteFile = (file: ProjectFile): boolean => {
    if (!user) return false;
    // Original uploader
    if (file.uploadedById && file.uploadedById === user.id) return true;
    // Team Group Leader
    if (file.teamId) {
      const targetTeam = teams.find((t) => t.id === file.teamId);
      if (targetTeam) {
        if (targetTeam.createdBy === user.id) return true;
        const isLeader = targetTeam.members?.some(
          (m) => m.userId === user.id && m.role === 'group_leader'
        );
        if (isLeader) return true;
      }
    }
    // Fallback for mock/local files without uploadedById
    if (!file.uploadedById && !file.teamId) return true;
    return false;
  };

  const confirmDelete = async () => {
    if (!filePendingDelete) return;
    setDeletingFileId(filePendingDelete.id);
    try {
      await deleteFile(filePendingDelete.id);
      setFilePendingDelete(null);
    } finally {
      setDeletingFileId(null);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <PageHeader
        badge="Asset Repository"
        badgeIcon={FolderOpen}
        title="Project Files"
        description="Store, share, and collaborate on files securely with team-level access control."
        actions={[
          {
            label: isRefreshing || isLoadingFiles ? 'Refreshing...' : 'Refresh',
            icon: RefreshCw,
            onClick: handleManualRefresh,
            variant: 'secondary',
            disabled: isRefreshing || isLoadingFiles,
          },
          {
            label: 'Upload File',
            icon: UploadCloud,
            onClick: () => setIsUploadOpen(true),
            variant: 'primary',
          },
        ]}
      />

      {/* QUICK DRAG AND DROP BANNER */}
      <div
        onClick={() => setIsUploadOpen(true)}
        className="p-6 rounded-3xl border-2 border-dashed border-orange-500/40 bg-orange-50/20 dark:bg-orange-950/20 hover:bg-orange-50/40 dark:hover:bg-orange-950/30 transition-colors flex flex-col sm:flex-row items-center justify-between gap-4 cursor-pointer"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-orange-100 dark:bg-orange-900/60 text-[#F97316] shrink-0">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-bold text-[#171717] dark:text-[#FAFAFA]">
              Quick File Upload Area
            </div>
            <p className="text-xs text-[#737373] dark:text-[#A3A3A3]">
              Drag & drop files or click here to upload documents, presentations, or images (up to 50MB).
            </p>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsUploadOpen(true);
          }}
          className="px-4 py-2 rounded-xl bg-white dark:bg-[#141414] border border-orange-500/40 text-[#F97316] font-bold text-xs shrink-0 hover:bg-orange-50 dark:hover:bg-orange-950/50 transition-colors"
        >
          Browse Files
        </button>
      </div>

      {/* Error Alert */}
      {filesError && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between gap-4 text-xs text-rose-700 dark:text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{filesError}</span>
          </div>
          <button
            onClick={() => refreshFiles()}
            className="px-3 py-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 font-semibold hover:bg-rose-200 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* FILTERS & SEARCH BAR */}
      <div className="bg-white dark:bg-[#141414] p-4 rounded-3xl border border-[#E5E5E5] dark:border-[#333333] shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center p-1 rounded-2xl bg-[#FAFAFA] dark:bg-[#1C1C1C] border border-[#E5E5E5] dark:border-[#333333] text-xs font-semibold overflow-x-auto">
          {(['all', 'presentations', 'documents', 'images', 'other'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl capitalize transition-colors shrink-0 ${
                activeCategory === cat
                  ? 'bg-white dark:bg-[#141414] text-[#F97316] shadow-sm'
                  : 'text-[#737373] dark:text-[#A3A3A3] hover:text-[#171717] dark:hover:text-[#FAFAFA]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Team Scope Filter & Search */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Team Filter Dropdown */}
          <div className="relative w-full sm:w-48">
            <Filter className="w-3.5 h-3.5 text-[#737373] dark:text-[#A3A3A3] absolute left-3 top-3 pointer-events-none" />
            <select
              value={selectedTeamFilter}
              onChange={(e) => setSelectedTeamFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-xs text-[#171717] dark:text-[#FAFAFA] focus:outline-none focus:ring-1 focus:ring-[#F97316]"
            >
              <option value="all">All Scopes</option>
              <option value="personal">Personal Files</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  Team: {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-[#737373] dark:text-[#A3A3A3] absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files or authors..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-xs text-[#171717] dark:text-[#FAFAFA] placeholder-[#737373] focus:outline-none focus:ring-1 focus:ring-[#F97316]"
            />
          </div>
        </div>
      </div>

      {/* FILE TABLE & STATES */}
      <div className="bg-white dark:bg-[#141414] rounded-3xl border border-[#E5E5E5] dark:border-[#333333] shadow-sm overflow-hidden">
        {isLoadingFiles ? (
          <div className="p-4 divide-y divide-[#E5E5E5] dark:divide-[#333333]">
            <TableRowSkeleton columns={7} />
            <TableRowSkeleton columns={7} />
            <TableRowSkeleton columns={7} />
            <TableRowSkeleton columns={7} />
          </div>
        ) : filteredFiles.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="No files found"
            description={
              searchQuery || activeCategory !== 'all' || selectedTeamFilter !== 'all'
                ? 'No files matched your current filter criteria. Try clearing search keywords or switching filters.'
                : 'Upload files to share documents, presentations, and team assets securely.'
            }
            actionLabel="Upload First File"
            onAction={() => setIsUploadOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAFAFA] dark:bg-[#1C1C1C] text-[#737373] dark:text-[#A3A3A3] font-semibold uppercase tracking-wider border-b border-[#E5E5E5] dark:border-[#333333]">
                <tr>
                  <th className="py-3.5 px-6">File Name</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Scope</th>
                  <th className="py-3.5 px-4">Uploaded By</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Size</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5] dark:divide-[#333333]">
                {filteredFiles.map((file) => {
                  const hasDeletePermission = canDeleteFile(file);

                  return (
                    <tr
                      key={file.id}
                      className="hover:bg-[#FAFAFA] dark:hover:bg-[#1C1C1C] transition-colors group"
                    >
                      {/* Name */}
                      <td className="py-4 px-6 font-semibold text-[#171717] dark:text-[#FAFAFA]">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-[#FAFAFA] dark:bg-[#1C1C1C] border border-[#E5E5E5] dark:border-[#333333] shrink-0">
                            {getFileIcon(file.type)}
                          </div>
                          <span
                            onClick={() => setPreviewFile(file)}
                            className="truncate max-w-xs cursor-pointer hover:text-[#F97316] transition-colors"
                            title={file.name}
                          >
                            {file.name}
                          </span>
                        </div>
                      </td>

                      {/* Format / Type */}
                      <td className="py-4 px-4 font-mono text-[#737373] dark:text-[#A3A3A3] uppercase">{file.type}</td>

                      {/* Team Scope */}
                      <td className="py-4 px-4">
                        {file.teamName ? (
                          <span className="px-2.5 py-1 rounded-full bg-orange-50 dark:bg-orange-950/60 border border-orange-200/60 dark:border-orange-800/60 text-orange-700 dark:text-orange-300 font-medium text-[11px]">
                            {file.teamName}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-[#FAFAFA] dark:bg-[#1C1C1C] border border-[#E5E5E5] dark:border-[#333333] text-[#737373] dark:text-[#A3A3A3] font-medium text-[11px]">
                            Personal
                          </span>
                        )}
                      </td>

                      {/* Uploaded By */}
                      <td className="py-4 px-4 font-medium text-[#171717] dark:text-[#FAFAFA]">
                        <div className="flex items-center gap-2">
                          <img
                            src={file.uploaderAvatar}
                            alt={file.uploadedBy}
                            className="w-5 h-5 rounded-full object-cover shrink-0"
                          />
                          <span className="truncate max-w-[120px]">{file.uploadedBy}</span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-4 px-4 text-[#737373] dark:text-[#A3A3A3]">{file.date}</td>

                      {/* Size */}
                      <td className="py-4 px-4 text-[#737373] dark:text-[#A3A3A3] font-mono">{file.size}</td>

                      {/* Action buttons */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Preview */}
                          <button
                            onClick={() => setPreviewFile(file)}
                            className="p-1.5 rounded-lg text-[#737373] dark:text-[#A3A3A3] hover:text-[#F97316] hover:bg-orange-50 dark:hover:bg-orange-950/40 transition-colors"
                            title="Preview File"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Download */}
                          <button
                            onClick={() => downloadFile(file)}
                            className="p-1.5 rounded-lg text-[#737373] dark:text-[#A3A3A3] hover:text-[#F97316] hover:bg-orange-50 dark:hover:bg-orange-950/40 transition-colors"
                            title="Download File"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          {hasDeletePermission ? (
                            <button
                              onClick={() => setFilePendingDelete(file)}
                              disabled={deletingFileId === file.id}
                              className="p-1.5 rounded-lg text-[#737373] dark:text-[#A3A3A3] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors disabled:opacity-50"
                              title="Delete File"
                            >
                              {deletingFileId === file.id ? (
                                <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          ) : (
                            <div
                              className="p-1.5 text-neutral-300 dark:text-neutral-700 cursor-not-allowed"
                              title="Deletion restricted to author or group leader"
                            >
                              <Trash2 className="w-4 h-4 opacity-30" />
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {filePendingDelete && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-file-title"
          onClick={!deletingFileId ? () => setFilePendingDelete(null) : undefined}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white dark:bg-[#141414] rounded-3xl shadow-2xl border border-[#E5E5E5] dark:border-[#333333] p-6 space-y-4"
          >
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-2xl bg-rose-100 dark:bg-rose-950/60">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 id="delete-file-title" className="font-bold text-base text-[#171717] dark:text-[#FAFAFA]">Delete File?</h3>
            </div>

            <p className="text-xs text-[#737373] dark:text-[#A3A3A3] leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <span className="font-semibold text-[#171717] dark:text-[#FAFAFA]">
                "{filePendingDelete.name}"
              </span>
              ? This file will be removed from both the database and cloud storage.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={Boolean(deletingFileId)}
                onClick={() => setFilePendingDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#737373] dark:text-[#A3A3A3] hover:bg-[#FAFAFA] dark:hover:bg-[#1C1C1C] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={Boolean(deletingFileId)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {deletingFileId ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      <FileUploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />

      {/* Preview Modal */}
      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
    </div>
  );
};
