const fs = require('fs');

// --- 1. Update Modal.tsx with theme tokens ---
const modalContent = `import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function Modal({ isOpen, onClose, title, subtitle, children, footer }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements && focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-6">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[6px] transition-opacity"
        onClick={onClose}
      />
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="relative w-full max-w-[520px] max-h-[calc(100dvh-0px)] sm:max-h-[calc(100dvh-48px)] bg-surface-elevatedLight dark:bg-surface-elevatedDark border border-surface-borderLight dark:border-surface-borderDark sm:rounded-2xl rounded-t-2xl shadow-[0_24px_60px_rgba(0,0,0,0.5)] flex flex-col animate-modal-enter"
      >
        <div className="w-full flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-black/15 dark:bg-white/20 rounded-full" />
        </div>

        <div className="flex items-start justify-between px-6 py-5 border-b border-surface-borderLight dark:border-surface-borderDark shrink-0">
          <div>
            <h2 id="modal-title" className="text-[20px] font-semibold text-text-primaryLight dark:text-text-primaryDark tracking-tight">{title}</h2>
            {subtitle && <p className="text-[13px] text-text-secondaryLight dark:text-text-secondaryDark mt-1">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-text-secondaryLight dark:text-text-secondaryDark hover:bg-black/5 dark:hover:bg-white/5 hover:text-text-primaryLight dark:hover:text-text-primaryDark transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {children}
        </div>

        {footer && (
          <div className="shrink-0 px-6 py-4 border-t border-surface-borderLight dark:border-surface-borderDark bg-surface-elevatedLight dark:bg-surface-elevatedDark sm:rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
`;
fs.writeFileSync('src/components/Modal.tsx', modalContent);

// --- 2. Add keyframes to index.css ---
let css = fs.readFileSync('src/index.css', 'utf8');
if (!css.includes('@keyframes modal-enter')) {
  css += `\n\n@keyframes modal-enter {\n  from {\n    opacity: 0;\n    transform: scale(0.96) translateY(8px);\n  }\n  to {\n    opacity: 1;\n    transform: scale(1) translateY(0);\n  }\n}\n.animate-modal-enter {\n  animation: modal-enter 180ms ease-out forwards;\n}\n`;
  fs.writeFileSync('src/index.css', css);
}

// --- 3. Patch Leads.tsx ---
let leads = fs.readFileSync('src/pages/Leads.tsx', 'utf8');

// Fix the broken className at line 358
const brokenRegex = /className=\{\\peer[^}]+\}`\}/g;
leads = leads.replace(brokenRegex, "className={['input-field !pl-10 peer', nameError ? '!border-state-danger ring-[3px] ring-state-danger/20' : ''].join(' ')}");

// Find the exact New Lead <Modal> and replace it with the clean version
const modalStart = leads.indexOf('<Modal isOpen={showNewLead}');
if (modalStart !== -1) {
  const modalEnd = leads.indexOf('</Modal>', modalStart) + '</Modal>'.length;
  const cleanModal = `<Modal
      isOpen={showNewLead}
      onClose={() => { setShowNewLead(false); setNameError(false); }}
      title="New Lead"
      subtitle="Add a new prospect to your pipeline."
      footer={
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => { setShowNewLead(false); setNameError(false); }}
            className="px-4 h-[44px] rounded-[10px] text-[14px] font-medium text-text-secondaryLight dark:text-text-secondaryDark hover:bg-black/5 dark:hover:bg-white/5 border border-transparent transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="new-lead-form"
            disabled={saving}
            className="px-6 h-[44px] rounded-[10px] bg-brand-primary text-black text-[14px] font-semibold transition-all hover:opacity-90 hover:-translate-y-[1px] disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
          >
            {saving ? <><Loader2 className="animate-spin" size={16} /> Saving...</> : "Save Lead"}
          </button>
        </div>
      }
    >
      <form
        id="new-lead-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!bizName.trim()) {
            setNameError(true);
            return;
          }
          handleCreateLead();
        }}
        className="space-y-5"
      >
        <div>
          <label className="block text-[12px] uppercase tracking-wider text-text-mutedLight dark:text-text-mutedDark mb-2 font-medium">
            Business Name <span className="text-state-danger">*</span>
          </label>
          <div className="relative">
            <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-mutedLight dark:text-text-mutedDark peer-focus:text-brand-primary transition-colors pointer-events-none" size={16} />
            <input
              type="text"
              placeholder="e.g. Acme Corp"
              value={bizName}
              onChange={e => { setBizName(e.target.value); setNameError(false); }}
              className={[
                'input-field !pl-10 peer',
                nameError ? '!border-state-danger ring-[3px] ring-state-danger/20' : ''
              ].join(' ')}
            />
          </div>
          {nameError && <p className="text-[12px] text-state-danger mt-1">Business name is required.</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-[12px] uppercase tracking-wider text-text-mutedLight dark:text-text-mutedDark mb-2 font-medium">
              Industry
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-mutedLight dark:text-text-mutedDark peer-focus:text-brand-primary transition-colors pointer-events-none" size={16} />
              <input
                type="text"
                placeholder="e.g. Restaurant, Retail"
                value={bizIndustry}
                onChange={e => setBizIndustry(e.target.value)}
                className="input-field !pl-10 peer"
              />
            </div>
          </div>
          <div>
            <label className="block text-[12px] uppercase tracking-wider text-text-mutedLight dark:text-text-mutedDark mb-2 font-medium">
              City
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-mutedLight dark:text-text-mutedDark peer-focus:text-brand-primary transition-colors pointer-events-none" size={16} />
              <input
                type="text"
                placeholder="e.g. Tunis"
                value={bizCity}
                onChange={e => setBizCity(e.target.value)}
                className="input-field !pl-10 peer"
              />
            </div>
          </div>
        </div>
      </form>
    </Modal>`;
  leads = leads.slice(0, modalStart) + cleanModal + leads.slice(modalEnd);
}

// Find the remaining <BottomSheet> and replace it with the Lead Details sheet
const oldNewLeadStart = leads.indexOf('<BottomSheet');
if (oldNewLeadStart !== -1) {
  const oldNewLeadEnd = leads.indexOf('</BottomSheet>', oldNewLeadStart) + '</BottomSheet>'.length;
  
  const detailsSheet = `<BottomSheet isOpen={!!selectedLead} onClose={() => setSelectedLead(null)} title={selectedLead?.businesses?.name || 'Lead Details'}>
        {selectedLead && (
          <div className="space-y-6">
            <div className="flex gap-2">
              <button onClick={() => setShowLogActivity(true)} className="btn-secondary flex-1 !h-10"><FileText size={14} className="text-brand-primary" /> Log Call</button>
            </div>
            <ActivityTimeline leadId={selectedLead.id} />
            <LeadQualification lead={selectedLead} />
            <LeadAssignment lead={selectedLead} />
          </div>
        )}
      </BottomSheet>`;
      
  leads = leads.slice(0, oldNewLeadStart) + detailsSheet + leads.slice(oldNewLeadEnd);
}

// Ensure imports are present
if (!leads.includes('import { Modal }')) {
  leads = "import { Modal } from '../components/Modal';\n" + leads;
}

fs.writeFileSync('src/pages/Leads.tsx', leads);
console.log('✅ Successfully repaired Leads.tsx and Modal.tsx');
