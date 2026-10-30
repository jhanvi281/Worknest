import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Download,
  FileText,
  CheckCircle2,
  Presentation,
  Image as ImageIcon,
  FileSpreadsheet,
  Archive,
  Loader2,
  ExternalLink,
  Users,
  Shield,
  Clock,
  HardDrive,
} from 'lucide-react';
import type { ProjectFile } from '../../types';

interface Props {
  file: ProjectFile | null;
  onClose: () => void;
}

export const FilePreviewModal: React.FC<Props> = ({ file, onClose }) => {
  const { downloadFile, getFilePreviewUrl } = useApp();
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (file) {
      setIsLoadingPreview(true);
      setPreviewError(false);
      setResolvedUrl(null);

      // Resolve signed URL or direct URL
      getFilePreviewUrl(file)
        .then((url) => {
          if (isMounted) {
            setResolvedUrl(url);
            setIsLoadingPreview(false);
          }
        })
        .catch(() => {
          if (isMounted) {
            setPreviewError(true);
            setIsLoadingPreview(false);
          }
        });
    }

    return () => {
      isMounted = false;
    };
  }, [file, getFilePreviewUrl]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && file) {
        onClose();
      }
    };
    if (file) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [file, onClose]);

  if (!file) return null;

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadFile(file);
    } finally {
      setIsDownloading(false);
    }
  };

  const isImage = ['PNG', 'JPG', 'JPEG', 'GIF', 'WEBP', 'SVG'].includes(file.type.toUpperCase());
  const isPdf = file.type.toUpperCase() === 'PDF';

  const getFormatIcon = (type: string) => {
    const upper = type.toUpperCase();
    if (upper === 'PPT' || upper === 'PPTX') {
      return <Presentation className="w-12 h-12 text-amber-500" />;
    }
    if (upper === 'PDF' || upper === 'DOC' || upper === 'DOCX') {
      return <FileText className="w-12 h-12 text-[#F97316]" />;
    }
    if (upper === 'XLS' || upper === 'XLSX' || upper === 'CSV') {
      return <FileSpreadsheet className="w-12 h-12 text-emerald-500" />;
    }
    if (isImage) {
      return <ImageIcon className="w-12 h-12 text-sky-500" />;
    }
    return <Archive className="w-12 h-12 text-[#737373] dark:text-[#A3A3A3]" />;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="file-preview-modal-title"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl bg-white dark:bg-[#141414] rounded-3xl shadow-2xl border border-[#E5E5E5] dark:border-[#333333] overflow-hidden flex flex-col max-h-[calc(100vh-2rem)] my-auto"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E5E5] dark:border-[#333333] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 truncate pr-4">
            <div className="p-2 rounded-xl bg-[#FAFAFA] dark:bg-[#1C1C1C] border border-[#E5E5E5] dark:border-[#333333] shrink-0">
              {getFormatIcon(file.type)}
            </div>
            <div className="truncate">
              <h2 id="file-preview-modal-title" className="text-sm font-bold text-[#171717] dark:text-[#FAFAFA] truncate">
                {file.name}
              </h2>
              <div className="flex items-center gap-2 text-[11px] text-[#737373] dark:text-[#A3A3A3]">
                <span className="font-mono uppercase">{file.type}</span>
                <span>•</span>
                <span>{file.size}</span>
                {file.teamName && (
                  <>
                    <span>•</span>
                    <span className="text-[#F97316] font-medium">
                      {file.teamName}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-[#737373] dark:text-[#A3A3A3] hover:text-[#171717] dark:hover:text-[#FAFAFA] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 overflow-y-auto flex flex-col items-center justify-center bg-[#FAFAFA] dark:bg-[#0A0A0A] min-h-[320px]">
          {isLoadingPreview ? (
            <div className="flex flex-col items-center gap-3 text-[#737373] dark:text-[#A3A3A3]">
              <Loader2 className="w-8 h-8 animate-spin text-[#F97316]" />
              <span className="text-xs">Generating secure preview...</span>
            </div>
          ) : isImage && resolvedUrl && !previewError ? (
            <div className="w-full flex flex-col items-center justify-center">
              <img
                src={resolvedUrl}
                alt={file.name}
                onError={() => setPreviewError(true)}
                className="max-h-[50vh] max-w-full rounded-2xl object-contain shadow-md border border-[#E5E5E5] dark:border-[#333333] bg-white dark:bg-[#141414]"
              />
            </div>
          ) : isPdf && resolvedUrl && !previewError ? (
            <div className="w-full h-[55vh] rounded-2xl overflow-hidden border border-[#E5E5E5] dark:border-[#333333] shadow-md">
              <iframe
                src={`${resolvedUrl}#toolbar=0`}
                title={file.name}
                className="w-full h-full border-0"
              />
            </div>
          ) : (
            <div className="max-w-md w-full space-y-4 text-center">
              <div className="p-6 rounded-3xl bg-white dark:bg-[#141414] border border-[#E5E5E5] dark:border-[#333333] shadow-sm inline-block">
                {getFormatIcon(file.type)}
              </div>
              <div>
                <h3 className="text-base font-bold text-[#171717] dark:text-[#FAFAFA]">
                  {file.name}
                </h3>
                <p className="text-xs text-[#737373] dark:text-[#A3A3A3] mt-1">
                  Preview not available inline for this file format. Download to open on your
                  device.
                </p>
              </div>

              {/* File details card */}
              <div className="p-4 rounded-2xl bg-white dark:bg-[#141414] border border-[#E5E5E5] dark:border-[#333333] text-left text-xs space-y-2.5">
                <div className="flex items-center justify-between text-[#737373] dark:text-[#A3A3A3]">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5" /> Uploaded Date:
                  </span>
                  <span className="font-medium text-[#171717] dark:text-[#FAFAFA]">{file.date}</span>
                </div>
                <div className="flex items-center justify-between text-[#737373] dark:text-[#A3A3A3]">
                  <span className="flex items-center gap-1.5 font-medium">
                    <HardDrive className="w-3.5 h-3.5" /> File Size:
                  </span>
                  <span className="font-mono text-[#171717] dark:text-[#FAFAFA]">{file.size}</span>
                </div>
                <div className="flex items-center justify-between text-[#737373] dark:text-[#A3A3A3]">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Users className="w-3.5 h-3.5" /> Uploader:
                  </span>
                  <div className="flex items-center gap-2">
                    <img
                      src={file.uploaderAvatar}
                      alt={file.uploadedBy}
                      className="w-4 h-4 rounded-full object-cover"
                    />
                    <span className="font-medium text-[#171717] dark:text-[#FAFAFA]">
                      {file.uploadedBy}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[#737373] dark:text-[#A3A3A3]">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Shield className="w-3.5 h-3.5" /> Storage Policy:
                  </span>
                  <span className="text-emerald-500 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Encrypted & Private
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white dark:bg-[#141414] border-t border-[#E5E5E5] dark:border-[#333333] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {resolvedUrl && (
              <a
                href={resolvedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl border border-[#E5E5E5] dark:border-[#333333] text-[#737373] dark:text-[#A3A3A3] text-xs font-semibold hover:bg-[#FAFAFA] dark:hover:bg-[#1C1C1C] flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open Direct
              </a>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#737373] dark:text-[#A3A3A3] hover:bg-[#FAFAFA] dark:hover:bg-[#1C1C1C] transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="px-5 py-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] dark:hover:bg-[#FB923C] text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Downloading...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download File</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
