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
  // No borra el toast de loading de golpe: lo marca como `exiting` para que el
  // ToastItem anime su salida y respete un mínimo de visibilidad. Así el
  // "Enviando..." / "Guardando..." siempre se percibe aunque la operación
  // termine en milisegundos.
  dismissLoadingToast: () =>
    set((s) => ({
      toasts: s.toasts.map((t) =>
        t.type === 'loading' ? { ...t, exiting: true } : t
      ),
    })),

  companyFilters: { status: '', sector: '', city: '', search: '' },
  setCompanyFilter: (key, value) =>
    set((s) => ({
      companyFilters: { ...s.companyFilters, [key]: value },
      companyPage: 1,
    })),
  clearCompanyFilters: () =>
    set({
      companyFilters: { status: '', sector: '', city: '', search: '' },
      companyPage: 1,
    }),

  companyPage: 1,
  companyLimit: 10,
  companySort: { field: 'created_at', dir: 'DESC' },
  setCompanyPage: (page) => set({ companyPage: page }),
  setCompanyLimit: (limit) => set({ companyLimit: limit, companyPage: 1 }),
  setCompanySort: (sort) => set({ companySort: sort, companyPage: 1 }),

  offersPage: 1,
  offersLimit: 20,
  offersFilters: { status: 'new', source_id: '', search: '' },
  setOffersPage: (page) => set({ offersPage: page }),
  setOffersLimit: (limit) => set({ offersLimit: limit, offersPage: 1 }),
  setOffersFilter: (key, value) =>
    set((s) => ({ offersFilters: { ...s.offersFilters, [key]: value }, offersPage: 1 })),
}))

export default useAppStore
