export default function SectionCard({ title, children, actions }) {
  return (
    <section className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-white font-semibold">{title}</h2>
        <div className="flex items-center gap-2">{actions}</div>
      </div>
      <div className="text-blue-100/90 text-sm">
        {children}
      </div>
    </section>
  )
}
