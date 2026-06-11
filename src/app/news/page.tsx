import { Newspaper } from 'lucide-react'
import { fetchAllNews } from '@/lib/news'
import NewsClient from './NewsClient'

export const revalidate = 1800

export default async function NewsPage() {
  const articles = await fetchAllNews()

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <p className="text-[11px] font-mono text-[#F97316] uppercase tracking-widest mb-2">Latest</p>
        <h1 className="text-3xl font-bold text-[#F5F0EB] tracking-tight flex items-center gap-2">
          <Newspaper className="w-7 h-7 text-[#F97316]" />
          Car & Motorsport News
        </h1>
        <p className="text-sm mt-1" style={{ color: '#8C8680' }}>
          Aggregated from the best automotive and racing sources.
        </p>
      </div>

      <NewsClient articles={articles} />
    </div>
  )
}
