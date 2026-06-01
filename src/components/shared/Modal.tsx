import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" 
        onClick={onClose} 
      />
      
      {/* Modal Content */}
      <div className={`relative ${maxWidth} w-full bg-white rounded-[32px] shadow-2xl border border-slate-100 animate-in zoom-in-95 fade-in duration-300 max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md px-8 py-6 border-b border-slate-100 rounded-t-[32px] flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{title}</h3>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
          >
            <X size={18} />
          </button>
        </div>
        
        {/* Body */}
        <div className="px-8 py-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
