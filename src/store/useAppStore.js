import { create } from 'zustand'

const useAppStore = create((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  toasts: [],
  addToast: (toast) =>
    set((s) => ({
      toasts: [...s.toasts, { id: Date.now(), ...toast }],
    })),
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  companyFilters: { status: '', sector: '', city: '', search: '' },
  setCompanyFilter: (key, value) =>
    set((s) => ({
      companyFilters: { ...s.companyFilters, [key]: value },
    })),
  clearCompanyFilters: () =>
    set({
      companyFilters: { status: '', sector: '', city: '', search: '' },
    }),
}))

export default useAppStore
