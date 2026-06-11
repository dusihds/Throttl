export default function EventDetailLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10 animate-pulse">
      <div className="h-4 w-28 rounded-full bg-white/[0.06] mb-8" />
      <div className="aspect-video rounded-2xl bg-white/[0.05] mb-6" />
      <div className="h-8 w-2/3 rounded-xl bg-white/[0.07] mb-2" />
      <div className="h-4 w-1/4 rounded-full bg-white/[0.05] mb-8" />
      <div className="grid grid-cols-2 gap-3 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-white/[0.05]" />
        ))}
      </div>
      <div className="h-12 w-full rounded-xl bg-white/[0.06]" />
    </div>
  )
}
