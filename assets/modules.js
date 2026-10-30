// Add each new tool here, with a matching section in index.html.
export const modules = [
  { id: 'home', path: '/', label: 'Overview', icon: '<path d="m3 8 7-5 7 5v9H3Z"/><path d="M8 17v-6h4v6"/>' },
  { id: 'heater', path: '/heater-schedule', label: 'Heater Schedule', description: 'Class times in. A clear heater plan out.', tag: 'CARVE LABS', available: true, icon: '<path d="M5 3c-4 4 4 5 0 10M10 3c-4 4 4 5 0 10M15 3c-4 4 4 5 0 10M3 17h14"/>' },
  { id: 'receipt', path: '/receipt', label: 'Receipt', description: 'A considered receipt for every purchase, at either studio.', available: true, icon: '<path d="M5 2h10v16l-2-1-3 1-3-1-2 1ZM8 6h4M8 9h4M8 12h2"/>' },
  { id: 'finance', path: '/bank-reconciliation', label: 'Bank Reconciliation', description: 'A future home for keeping the numbers in order.', available: false, icon: '<path d="m3 7 7-4 7 4ZM3 17h14M5 9v6M10 9v6M15 9v6"/>' },
  { id: 'future', path: '/coming-soon', label: 'Future Tools', title: 'Room for what’s next', description: 'New tools will find their place here.', available: false, icon: '<path d="M4 4h4v4H4ZM12 4h4v4h-4ZM4 12h4v4H4ZM14 11v6M11 14h6"/>' }
];

export function moduleForHash(hash) {
  const path = hash.replace(/^#/, '').replace(/\/$/, '') || '/';
  return modules.find(module => module.path === path) || modules[0];
}
