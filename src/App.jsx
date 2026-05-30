import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './hooks/AuthProvider'
import { useAuth } from './hooks/useAuth'
import AppLayout from './components/layout/AppLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Companies from './pages/Companies'
import CompanyDetail from './pages/CompanyDetail'
import Messages from './pages/Messages'
import Offers from './pages/Offers'
import OfferDetail from './pages/OfferDetail'
import Templates from './pages/Templates'
import Settings from './pages/Settings'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
})

function ProtectedRoute({ children }) {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FBFBFA]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#EAEAEA] border-t-[#111111]" />
      </div>
    )
  }

  if (!session) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  const { session } = useAuth()

  return (
    <Routes>
      <Route
        path="/"
        element={session ? <Navigate to="/app/dashboard" replace /> : <Login />}
      />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="companies" element={<Companies />} />
        <Route path="companies/:id" element={<CompanyDetail />} />
        <Route path="contacts" element={<Navigate to="/app/dashboard" replace />} />
        <Route path="messages" element={<Messages />} />
        <Route path="offers" element={<Offers />} />
        <Route path="offers/:id" element={<OfferDetail />} />
        <Route path="templates" element={<Templates />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
