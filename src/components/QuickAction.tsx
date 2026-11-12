import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Target, Calendar, ListTodo, Wrench } from 'lucide-react';
import { BottomSheet } from './BottomSheet';

type Action = {
  label: string;
  icon: any;
  path: string;
};

const ACTIONS: Action[] = [
  { label: 'Add Lead', icon: Target, path: '/leads' },
  { label: 'Schedule Meeting', icon: Calendar, path: '/meetings' },
  { label: 'Create Task', icon: ListTodo, path: '/tasks' },
  { label: 'Technical Request', icon: Wrench, path: '/handovers' },
];

export function QuickAction() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  function go(a: Action) {
    setOpen(false);
    navigate(a.path, { state: { openCreate: true } });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Quick action"
        className="md:hidden fixed right-4 bottom-[calc(80px+env(safe-area-inset-bottom,20px))] w-14 h-14 rounded-full bg-brand-primary text-black shadow-lg flex items-center justify-center z-40 active:scale-95 transition-transform"
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>

      <BottomSheet isOpen={open} onClose={() => setOpen(false)} title="Quick Action">
        <div className="grid grid-cols-2 gap-3 pb-2">
          {ACTIONS.map(a => (
            <button
              key={a.label}
              onClick={() => go(a)}
              className="card p-4 flex flex-col items-center gap-2 active:scale-95 transition-transform"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                <a.icon size={20} />
              </div>
              <span className="text-[13px] font-semibold text-center leading-tight">{a.label}</span>
            </button>
          ))}
        </div>
      </BottomSheet>
    </>
  );
}
