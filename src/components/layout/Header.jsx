export default function Header({ title }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[#EAEAEA] bg-white px-6">
      <div>
        {title && <h1 className="font-[family-name:var(--font-serif)] text-lg font-semibold text-[#111111]">{title}</h1>}
      </div>
    </header>
  )
}
