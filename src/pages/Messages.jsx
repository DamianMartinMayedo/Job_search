export default function Messages() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mensajes</h1>
          <p className="mt-1 text-sm text-slate-500">
            Seguimiento de tus emails de contacto
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <p className="text-center text-sm text-slate-400">
          Aún no hay mensajes. Crea uno desde la página de detalle de una empresa.
        </p>
      </div>
    </div>
  )
}
