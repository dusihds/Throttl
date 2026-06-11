export default function PublicProfileLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10 animate-pulse">
      <div className="flex flex-col items-center text-center gap-4 mb-10">
        <div className="w-20 h-20 rounded-2xl bg-white/[0.08]" />
        <div className="h-6 w-32 rounded-xl bg-white/[0.08]" />
        <div className="h-3 w-48 rounded-full bg-white/[0.05]" />
        <div className="h-4 w-24 rounded-full bg-white/[0.06]" />
      </div>
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-white/[0.04]" style={{ border: '1px solid rgba(255,255,255,0.06)' }} />
        ))}
      </div>
    </div>
  )
}
