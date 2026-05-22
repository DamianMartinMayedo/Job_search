import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import ToastContainer from '../ui/Toast'
import useAppStore from '../../store/useAppStore'

export default function AppLayout() {
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed)

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main
        className={`flex flex-1 flex-col transition-all duration-200 ${sidebarCollapsed ? 'ml-16' : 'ml-60'}`}
      >
        <Header />
        <div className="flex-1 p-6">
          <Outlet />
        </div>
      </main>
      <ToastContainer />
    </div>
  )
}
