import { NavLink } from 'react-router-dom'
import {
  SquaresFour,
  Buildings,
  Briefcase,
  FileText,
  GearSix,
  CaretLeft,
  SignOut,
  Envelope,
} from '@phosphor-icons/react'
import useAppStore from '../../store/useAppStore'
import { useAuth } from '../../hooks/useAuth'
import { useJobOffers } from '../../hooks/useJobOffers'

const navItems = [
  { to: '/app/dashboard', icon: SquaresFour, label: 'Dashboard' },
  { to: '/app/companies', icon: Buildings, label: 'Empresas' },
  { to: '/app/messages', icon: Envelope, label: 'Mensajes' },
  { to: '/app/offers', icon: Briefcase, label: 'Ofertas', badgeKey: 'new-offers' },
  { to: '/app/templates', icon: FileText, label: 'Plantillas' },
]

const bottomItems = [
  { to: '/app/settings', icon: GearSix, label: 'Ajustes' },
]

const activeClass = 'bg-[#F7F6F3] text-[#111111]'
const inactiveClass = 'text-[#787774] hover:bg-[#F7F6F3] hover:text-[#111111]'

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
        className={`fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-[#EAEAEA] bg-white transition-[width] duration-200 ease-out lg:flex ${collapsed ? 'w-16' : 'w-60'}`}
      >
        <div className="flex h-14 items-center border-b border-[#EAEAEA] px-4">
          {!collapsed && (
            <span className="font-[family-name:var(--font-serif)] text-base font-semibold text-[#111111]">JobCRM</span>
          )}
          <button
            onClick={toggleSidebar}
            className={`rounded-lg p-1.5 text-[#ABABAB] hover:bg-[#F7F6F3] hover:text-[#111111] cursor-pointer transition-colors ${collapsed ? 'mx-auto' : 'ml-auto'}`}
            aria-label="Colapsar sidebar"
          >
            <CaretLeft
              size={16}
              weight="bold"
              className={`transition-transform ${collapsed ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
          {navItems.map((item) => {
            const badge = item.badgeKey ? badges[item.badgeKey] : 0
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${collapsed ? 'justify-center' : ''} ${isActive ? activeClass : inactiveClass}`
                }
                title={collapsed ? item.label : undefined}
              >
                <item.icon size={18} weight="regular" />
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {badge > 0 && (
                      <span className="rounded-full bg-[#E1F3FE] px-1.5 py-0.5 text-xs font-medium text-[#1F6C9F]">
                        {badge}
                      </span>
                    )}
                  </>
                )}
                {collapsed && badge > 0 && (
                  <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#1F6C9F]" />
                )}
              </NavLink>
            )
          })}
        </nav>

        <div className="border-t border-[#EAEAEA] p-2">
          {bottomItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${collapsed ? 'justify-center' : ''} ${isActive ? activeClass : inactiveClass}`
              }
              title={collapsed ? item.label : undefined}
            >
              <item.icon size={18} weight="regular" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </div>

        <div className="border-t border-[#EAEAEA] p-3">
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F7F6F3] text-xs font-medium text-[#111111]">
                {email.charAt(0).toUpperCase()}
              </div>
              <button
                onClick={signOut}
                className="rounded p-1 text-[#ABABAB] hover:bg-[#F7F6F3] hover:text-[#111111] cursor-pointer transition-colors"
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
              >
                <SignOut size={15} weight="bold" />
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F7F6F3] text-xs font-medium text-[#111111]">
                  {email.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 truncate">
                  <p className="text-sm font-medium text-[#111111]">
                    {email.split('@')[0]}
                  </p>
                  <p className="text-xs text-[#ABABAB] truncate">{email}</p>
                </div>
              </div>
              <button
                onClick={signOut}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-[#787774] hover:bg-[#F7F6F3] hover:text-[#111111] cursor-pointer transition-colors"
              >
                <SignOut size={13} weight="bold" />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Tablet icon-only sidebar (768px - 1023px) */}
      <aside
        className="fixed left-0 top-0 z-40 hidden h-screen w-12 flex-col border-r border-[#EAEAEA] bg-white md:flex lg:hidden"
      >
        <div className="flex h-14 items-center justify-center border-b border-[#EAEAEA]">
          <span className="font-[family-name:var(--font-serif)] text-sm font-semibold text-[#111111]">J</span>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-1.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-center rounded-lg p-2.5 transition-colors ${isActive ? activeClass : inactiveClass}`
              }
              title={item.label}
            >
              <item.icon size={18} weight="regular" />
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-[#EAEAEA] p-1.5">
          {bottomItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-center rounded-lg p-2.5 transition-colors ${isActive ? activeClass : inactiveClass}`
              }
              title={item.label}
            >
              <item.icon size={18} weight="regular" />
            </NavLink>
          ))}
        </div>
      </aside>

      {/* Mobile bottom nav (<768px) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-[#EAEAEA] bg-white md:hidden">
        {navItems.slice(0, 4).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-xs transition-colors ${isActive ? 'text-[#111111]' : 'text-[#ABABAB]'}`
            }
          >
            <item.icon size={18} weight="regular" />
            <span className="text-[10px]">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  )
}
