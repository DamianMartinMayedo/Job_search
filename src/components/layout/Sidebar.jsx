import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  Users,
  Mail,
  Briefcase,
  FileText,
  Settings,
  ChevronLeft,
  LogOut,
} from 'lucide-react'
import useAppStore from '../../store/useAppStore'
import { useAuth } from '../../hooks/useAuth'
import { useJobOffers } from '../../hooks/useJobOffers'

const navItems = [
  { to: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/app/companies', icon: Building2, label: 'Empresas' },
  { to: '/app/contacts', icon: Users, label: 'Contactos' },
  { to: '/app/messages', icon: Mail, label: 'Mensajes' },
  { to: '/app/offers', icon: Briefcase, label: 'Ofertas', badgeKey: 'new-offers' },
  { to: '/app/templates', icon: FileText, label: 'Plantillas' },
]

const bottomItems = [
  { to: '/app/settings', icon: Settings, label: 'Ajustes' },
]

const activeClass =
  'bg-primary-50 text-primary-700 border-r-2 border-primary-500'
const inactiveClass =
  'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-r-2 border-transparent'
const collapsedActiveClass = 'bg-primary-50 text-primary-700'
const collapsedInactiveClass =
  'text-slate-600 hover:bg-slate-50 hover:text-slate-900'

export default function Sidebar() {
  const collapsed = useAppStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)
  const { session, signOut } = useAuth()
  const email = session?.user?.email || ''
  const { data: newOffers } = useJobOffers({ status: 'new', limit: 1, page: 1 })
  const badges = { 'new-offers': newOffers?.total || 0 }

  return (
    <>
      {/* Desktop sidebar (≥1024px) */}
      <aside
        className={`fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-slate-200 bg-white transition-all duration-200 lg:flex ${collapsed ? 'w-16' : 'w-60'}`}
      >
        <div className="flex h-14 items-center border-b border-slate-200 px-4">
          {!collapsed && (
            <span className="text-lg font-bold text-primary-600">JobCRM</span>
          )}
          <button
            onClick={toggleSidebar}
            className={`rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer ${collapsed ? 'mx-auto' : 'ml-auto'}`}
            aria-label="Colapsar sidebar"
          >
            <ChevronLeft
              size={18}
              className={`transition-transform ${collapsed ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
          {navItems.map((item) => {
            const badge = item.badgeKey ? badges[item.badgeKey] : 0
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${collapsed ? 'justify-center' : ''} ${isActive ? (collapsed ? collapsedActiveClass : activeClass) : collapsed ? collapsedInactiveClass : inactiveClass}`
                }
                title={collapsed ? item.label : undefined}
              >
                <item.icon size={20} />
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {badge > 0 && (
                      <span className="rounded-full bg-primary-100 px-1.5 py-0.5 text-xs font-semibold text-primary-700">
                        {badge}
                      </span>
                    )}
                  </>
                )}
                {collapsed && badge > 0 && (
                  <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary-500" />
                )}
              </NavLink>
            )
          })}
        </nav>

        <div className="border-t border-slate-200 p-2">
          {bottomItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${collapsed ? 'justify-center' : ''} ${isActive ? (collapsed ? collapsedActiveClass : activeClass) : collapsed ? collapsedInactiveClass : inactiveClass}`
              }
              title={collapsed ? item.label : undefined}
            >
              <item.icon size={20} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </div>

        <div className="border-t border-slate-200 p-3">
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-700">
                {email.charAt(0).toUpperCase()}
              </div>
              <button
                onClick={signOut}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-700">
                  {email.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 truncate">
                  <p className="text-sm font-medium text-slate-900">
                    {email.split('@')[0]}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{email}</p>
                </div>
              </div>
              <button
                onClick={signOut}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <LogOut size={14} />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Tablet icon-only sidebar (768px - 1023px) */}
      <aside
        className="fixed left-0 top-0 z-40 hidden h-screen w-12 flex-col border-r border-slate-200 bg-white md:flex lg:hidden"
      >
        <div className="flex h-14 items-center justify-center border-b border-slate-200">
          <span className="text-sm font-bold text-primary-600">J</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-1.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-center rounded-lg p-2.5 transition-colors ${isActive ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`
              }
              title={item.label}
            >
              <item.icon size={18} />
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-200 p-1.5">
          {bottomItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-center rounded-lg p-2.5 transition-colors ${isActive ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`
              }
              title={item.label}
            >
              <item.icon size={18} />
            </NavLink>
          ))}
        </div>
      </aside>

      {/* Mobile bottom nav (<768px) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-slate-200 bg-white md:hidden">
        {navItems.slice(0, 4).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs transition-colors ${isActive ? 'text-primary-600' : 'text-slate-500'}`
            }
          >
            <item.icon size={20} />
            <span className="text-[10px]">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  )
}
