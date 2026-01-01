import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Sim, Excluir',
  cancelLabel = 'Cancelar'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-stone-900 rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-stone-200 dark:border-stone-800 animate-in zoom-in-95 duration-300">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-500" />
          </div>
          
          <h2 className="text-2xl font-serif italic text-stone-900 dark:text-white mb-2">
            {title}
          </h2>
          
          <p className="text-stone-500 dark:text-stone-400 mb-8 leading-relaxed whitespace-pre-line">
            {message}
          </p>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3 px-4 rounded-xl border border-stone-200 dark:border-stone-700 font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors uppercase text-xs tracking-widest"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-3 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-colors shadow-lg shadow-red-500/20 uppercase text-xs tracking-widest"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};