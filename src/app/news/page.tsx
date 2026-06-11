import { Newspaper } from 'lucide-react'
import { fetchAllNews } from '@/lib/news'
import NewsClient from './NewsClient'

export const revalidate = 1800

export default async function NewsPage() {
  const articles = await fetchAllNews()

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <p className="text-[11px] font-mono text-[#5E6AD2] uppercase tracking-widest mb-2">Latest</p>
        <h1 className="text-3xl font-bold text-[#EDEDEF] tracking-tight flex items-center gap-2">
          <Newspaper className="w-7 h-7 text-[#5E6AD2]" />
          Car & Motorsport News
        </h1>
        <p className="text-sm mt-1" style={{ color: '#8A8F98' }}>
          Aggregated from the best automotive and racing sources.
        </p>
      </div>

      <NewsClient articles={articles} />
    </div>
  )
}
