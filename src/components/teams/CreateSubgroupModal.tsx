import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Layers, Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
}

export const CreateSubgroupModal: React.FC<Props> = ({ isOpen, onClose, teamId }) => {
  const { addSubgroup } = useApp();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    const success = await addSubgroup(teamId, {
      name: name.trim(),
      description: description.trim(),
    });
    setIsLoading(false);

    if (success) {
      setName('');
      setDescription('');
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-subgroup-modal-title"
      onClick={!isLoading ? onClose : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md max-h-[calc(100vh-2rem)] flex flex-col bg-white dark:bg-[#141414] rounded-3xl shadow-2xl border border-[#E5E5E5] dark:border-[#333333] overflow-hidden my-auto"
      >
        <div className="px-6 py-4 border-b border-[#E5E5E5] dark:border-[#333333] flex items-center justify-between shrink-0">
          <div id="create-subgroup-modal-title" className="flex items-center gap-2 font-bold text-[#171717] dark:text-[#FAFAFA]">
            <Layers className="w-5 h-5 text-[#F97316]" />
            <span>Create Subgroup</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Close dialog"
            className="p-1 rounded-lg text-[#737373] dark:text-[#A3A3A3] hover:text-[#171717] dark:hover:text-[#FAFAFA] transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-semibold text-[#171717] dark:text-[#FAFAFA] mb-1">
              Subgroup Name <span className="text-[#F97316]">*</span>
            </label>
            <input
              type="text"
              required
              disabled={isLoading}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Frontend Engineering"
              className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-[#171717] dark:text-[#FAFAFA] text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316] disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171717] dark:text-[#FAFAFA] mb-1">
              Description
            </label>
            <textarea
              rows={3}
              disabled={isLoading}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Responsibilities or domain focus..."
              className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] dark:border-[#333333] bg-[#FAFAFA] dark:bg-[#1C1C1C] text-[#171717] dark:text-[#FAFAFA] text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316] resize-none disabled:opacity-60"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#E5E5E5] dark:border-[#333333] shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#737373] dark:text-[#A3A3A3] hover:bg-[#FAFAFA] dark:hover:bg-[#1C1C1C] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] dark:hover:bg-[#FB923C] text-white font-bold text-xs shadow-sm flex items-center gap-2 transition disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                'Create Subgroup'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
