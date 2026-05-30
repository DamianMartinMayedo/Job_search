import { useState } from 'react'
import { SignIn } from '@phosphor-icons/react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const { signIn, error } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    await signIn(email, password)
    setSubmitting(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FBFBFA] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-[#111111] text-white">
            <SignIn size={20} weight="bold" />
          </div>
          <h1 className="font-[family-name:var(--font-serif)] text-3xl font-semibold tracking-tight text-[#111111]">JobCRM</h1>
          <p className="mt-2 text-sm text-[#787774]">
            Gestiona tu búsqueda de empleo
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-[#EAEAEA] bg-white p-6"
        >
          <Input
            label="Email"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="mt-4">
            <Input
              label="Contraseña"
              type="password"
              placeholder="Tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={error}
              required
            />
          </div>
          <Button type="submit" disabled={submitting} className="mt-4 w-full">
            {submitting ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </div>
    </div>
  )
}
