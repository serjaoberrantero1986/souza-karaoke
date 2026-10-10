import { useEffect, useId, useRef, type ButtonHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';
import { ArrowLeft, Music2, X } from 'lucide-react';

export function Button({ primary, danger, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { primary?: boolean; danger?: boolean }) { return <button type="button" className={`button ${primary ? 'primary' : ''} ${danger ? 'danger' : ''} ${className}`} {...props} />; }
export function IconButton({ label, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) { return <Button aria-label={label} title={label} className="icon-button" {...props}>{children}</Button>; }
export function Panel({ title, onBack, actions, footer, children, className = '' }: { title: string; onBack: () => void; actions?: ReactNode; footer?: ReactNode; children: ReactNode; className?: string }) { return <section className={`panel ${className}`} aria-label={title}><header className="panel-header"><Button onClick={onBack}><ArrowLeft size={16} /> Voltar</Button><h1>{title}</h1><div className="header-actions">{actions}</div></header><div className="panel-body">{children}</div>{footer && <footer className="panel-footer">{footer}</footer>}</section>; }
export function SearchInput({ value, onChange, placeholder = 'Buscar na sua pasta e no YouTube...', label = 'Buscar músicas' }: { value: string; onChange: (value: string) => void; placeholder?: string; label?: string }) { return <input className="search-input" type="search" aria-label={label} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} />; }
export function Select({ label, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) { return <select aria-label={label} {...props}>{children}</select>; }
export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) { return <input type="checkbox" aria-label={label} checked={checked} onChange={e => onChange(e.target.checked)} />; }
export function NumberInput({ label, value, onChange, min = 0, max = 999 }: { label: string; value: number; onChange: (value: number) => void; min?: number; max?: number }) { return <input type="number" aria-label={label} value={value} min={min} max={max} onChange={e => { const n = Number(e.target.value); if (Number.isFinite(n)) onChange(Math.max(min, Math.min(max, n))); }} />; }
export function Slider({ label, value, onChange, max = 100 }: { label: string; value: number; onChange: (value: number) => void; max?: number }) { return <input aria-label={label} type="range" min={0} max={max} value={value} onChange={e => onChange(Number(e.target.value))} />; }
export function EmptyState({ title, description, children }: { title: string; description?: string; children?: ReactNode }) { return <div className="empty-state"><Music2 size={30} /><h2>{title}</h2>{description && <p>{description}</p>}{children}</div>; }
export function Modal({ title, children, onClose, wide = false }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  const titleId = useId(); const ref = useRef<HTMLDivElement>(null); const closeRef = useRef(onClose); closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    const focusables = () => Array.from(dialog?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex="0"]') ?? []);
    (dialog?.querySelector<HTMLElement>('input:not([type=checkbox]):not([disabled])') ?? focusables()[0] ?? dialog)?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (Array.from(document.querySelectorAll('[role="dialog"]')).at(-1) !== dialog) return;
      if (event.key === 'Escape') { event.stopPropagation(); closeRef.current(); }
      if (event.key !== 'Tab') return;
      const items = focusables(); const first = items[0]; const last = items.at(-1);
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog || !dialog?.contains(document.activeElement))) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !dialog?.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handleKey);
    return () => { document.removeEventListener('keydown', handleKey); previous?.focus(); };
  }, []);
  return <div className="modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId} className={`modal ${wide ? 'wide' : ''}`}><header><h2 id={titleId}>{title}</h2><IconButton label="Fechar janela" onClick={onClose}><X size={18} /></IconButton></header><div className="modal-body">{children}</div></div></div>;
}
export function ConfirmDialog({ title, description, onConfirm, onClose }: { title: string; description: string; onConfirm: () => void; onClose: () => void }) { return <Modal title={title} onClose={onClose}><p>{description}</p><div className="dialog-actions"><Button onClick={onClose}>Cancelar</Button><Button danger onClick={() => { onConfirm(); onClose(); }}>Confirmar</Button></div></Modal>; }
