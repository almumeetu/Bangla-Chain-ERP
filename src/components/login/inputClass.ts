/**
 * Shared utility that returns the Tailwind class string for a text input.
 * Kept as a plain function (no JSX) so it can be imported by both
 * Server and Client components without pulling in React.
 */
export function inputClass(focused = false): string {
  const base =
    'w-full h-11 px-4 rounded-lg border bg-white text-xs font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-400';
  const state = focused
    ? 'border-slate-900 ring-2 ring-slate-900/5'
    : 'border-slate-200 hover:border-slate-300';
  return `${base} ${state}`;
}
