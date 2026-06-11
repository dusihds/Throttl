export default function ProfileLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 animate-pulse">
      {/* Header card */}
      <div className="rounded-2xl p-6 mb-8" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.08] shrink-0" />
          <div className="flex-1 flex flex-col gap-3">
            <div className="h-6 w-40 rounded-xl bg-white/[0.08]" />
            <div className="h-3 w-24 rounded-full bg-white/[0.05]" />
            <div className="h-3 w-56 rounded-full bg-white/[0.05]" />
          </div>
        </div>
      </div>
      {/* Spots section */}
      <div className="h-6 w-28 rounded-xl bg-white/[0.07] mb-5" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="aspect-video bg-white/[0.05]" />
            <div className="p-4 flex flex-col gap-2">
              <div className="h-4 w-3/4 rounded-full bg-white/[0.07]" />
              <div className="h-3 w-1/2 rounded-full bg-white/[0.05]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
