import { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, FileJson, FileText, FileType } from 'lucide-react';

const FORMATS = [
  { id: 'json', label: 'JSON', icon: FileJson, hint: 'Re-importable' },
  { id: 'markdown', label: 'Markdown', icon: FileText, hint: 'Readable / shareable' },
  { id: 'pdf', label: 'PDF', icon: FileType, hint: 'Printable' },
];

// A small "Export ▾" button that opens a format picker. `onExport(format)`
// is called with 'json' | 'markdown' | 'pdf' and should return a promise.
export default function ExportMenu({ onExport, label = 'Export', disabled = false }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handlePick(format) {
    setBusy(true);
    try {
      await onExport(format);
    } finally {
      setBusy(false);
      setOpen(false);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => setOpen((o) => !o)}
        className="btn-ghost"
      >
        <Download size={16} /> {busy ? 'Exporting…' : label} <ChevronDown size={14} />
      </button>
      {open && (
        <div className="glass-card absolute left-0 top-full z-20 mt-2 w-52 max-w-[calc(100vw-2rem)] space-y-1 p-2 sm:left-auto sm:right-0">
          {FORMATS.map(({ id, label: fLabel, icon: Icon, hint }) => (
            <button
              key={id}
              type="button"
              onClick={() => handlePick(id)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-100 hover:bg-white/[0.06]"
            >
              <Icon size={15} className="shrink-0 text-muted" />
              <span className="flex-1">{fLabel}</span>
              <span className="text-[11px] text-muted">{hint}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
