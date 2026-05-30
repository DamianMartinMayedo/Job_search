import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import ToastContainer from '../ui/Toast'
import useAppStore from '../../store/useAppStore'

const marginClass = {
  true: 'lg:ml-16',
  false: 'lg:ml-60',
}

export default function AppLayout() {
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed)

  return (
    <div className="flex min-h-screen bg-[#FBFBFA]">
      <Sidebar />
      <main
        className={`flex flex-1 flex-col transition-[margin] duration-200 ease-out ml-0 md:ml-12 ${marginClass[String(sidebarCollapsed)]}`}
      >
        <Header />
        <div className="flex-1 p-4 pb-20 md:p-6 md:pb-6">
          <Outlet />
        </div>
      </main>
      <ToastContainer />
    </div>
  )
}
