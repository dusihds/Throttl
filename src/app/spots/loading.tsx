export default function SpotsLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-end justify-between mb-10">
        <div>
          <div className="h-3 w-28 rounded-full bg-white/[0.06] mb-3 animate-pulse" />
          <div className="h-8 w-36 rounded-xl bg-white/[0.06] animate-pulse" />
        </div>
        <div className="h-10 w-32 rounded-xl bg-white/[0.06] animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl overflow-hidden animate-pulse" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="aspect-video bg-white/[0.05]" />
            <div className="p-4 flex flex-col gap-3">
              <div className="h-4 w-3/4 rounded-full bg-white/[0.07]" />
              <div className="h-3 w-1/2 rounded-full bg-white/[0.05]" />
              <div className="h-3 w-1/3 rounded-full bg-white/[0.05]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
