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

  contactsPage: 1,
  contactsLimit: 10,
  setContactsPage: (page) => set({ contactsPage: page }),
  setContactsLimit: (limit) => set({ contactsLimit: limit, contactsPage: 1 }),

  messagesPage: 1,
  messagesLimit: 10,
  setMessagesPage: (page) => set({ messagesPage: page }),
  setMessagesLimit: (limit) => set({ messagesLimit: limit, messagesPage: 1 }),
}))

export default useAppStore
