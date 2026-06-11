export type NewsCategory =
  | 'cars'
  | 'f1'
  | 'motogp'
  | 'wrc'
  | 'nascar'
  | 'gt'
  | 'motorsport-general'

export interface NewsItem {
  title: string
  link: string
  pubDate: string
  description: string
  image: string | null
  source: string
  category: NewsCategory
}

export interface CategoryMeta {
  label: string
  emoji: string
  group: 'cars' | 'motorsport'
  color: { bg: string; text: string; border: string }
}

export const CATEGORY_META: Record<NewsCategory, CategoryMeta> = {
  'cars':               { label: 'Cars',             emoji: '🚗', group: 'cars',       color: { bg: 'rgba(249,115,22,0.12)',  text: '#FB923C', border: 'rgba(249,115,22,0.25)' } },
  'f1':                 { label: 'Formula 1',        emoji: '🏎️', group: 'motorsport', color: { bg: 'rgba(220,38,38,0.12)',   text: '#f87171', border: 'rgba(220,38,38,0.25)'  } },
  'motogp':             { label: 'MotoGP',           emoji: '🏍️', group: 'motorsport', color: { bg: 'rgba(234,88,12,0.12)',   text: '#fb923c', border: 'rgba(234,88,12,0.25)'  } },
  'wrc':                { label: 'WRC / Rally',      emoji: '🪨', group: 'motorsport', color: { bg: 'rgba(22,163,74,0.12)',   text: '#4ade80', border: 'rgba(22,163,74,0.25)'  } },
  'nascar':             { label: 'NASCAR',           emoji: '🏁', group: 'motorsport', color: { bg: 'rgba(202,138,4,0.12)',   text: '#facc15', border: 'rgba(202,138,4,0.25)'  } },
  'gt':                 { label: 'GT & Endurance',   emoji: '⏱️', group: 'motorsport', color: { bg: 'rgba(6,182,212,0.12)',   text: '#22d3ee', border: 'rgba(6,182,212,0.25)'  } },
  'motorsport-general': { label: 'Motorsport',       emoji: '🏆', group: 'motorsport', color: { bg: 'rgba(168,85,247,0.12)',  text: '#c084fc', border: 'rgba(168,85,247,0.25)' } },
}

interface FeedConfig {
  url: string
  source: string
  category: NewsCategory
}

const FEEDS: FeedConfig[] = [
  // Cars
  { url: 'https://www.motor1.com/rss/news/all/',          source: 'Motor1',        category: 'cars' },
  { url: 'https://www.caranddriver.com/rss/all.xml/',     source: 'Car & Driver',  category: 'cars' },
  { url: 'https://www.autocar.co.uk/rss',                 source: 'Autocar',       category: 'cars' },
  // Formula 1
  { url: 'https://www.racefans.net/feed/',                source: 'RaceFans',      category: 'f1' },
  { url: 'https://the-race.com/formula-1/feed/',          source: 'The Race',      category: 'f1' },
  { url: 'https://www.autosport.com/rss/f1/news/',        source: 'Autosport F1',  category: 'f1' },
  // MotoGP
  { url: 'https://www.motorsport.com/rss/motogp/news/',   source: 'Motorsport.com',category: 'motogp' },
  { url: 'https://www.autosport.com/rss/motogp/news/',    source: 'Autosport MotoGP', category: 'motogp' },
  // WRC / Rally
  { url: 'https://www.autosport.com/rss/wrc/news/',       source: 'Autosport WRC', category: 'wrc' },
  { url: 'https://www.dirtfish.com/feed/',                source: 'DirtFish',      category: 'wrc' },
  // NASCAR
  { url: 'https://www.motorsport.com/rss/nascar-cup/news/', source: 'Motorsport.com', category: 'nascar' },
  { url: 'https://www.autosport.com/rss/nascar/news/',    source: 'Autosport NASCAR', category: 'nascar' },
  // GT & Endurance
  { url: 'https://www.autosport.com/rss/imsa/news/',      source: 'Autosport IMSA', category: 'gt' },
  { url: 'https://www.motorsport.com/rss/fia-wec/news/',  source: 'Motorsport WEC',  category: 'gt' },
  // General motorsport
  { url: 'https://www.autosport.com/rss/news/',           source: 'Autosport',     category: 'motorsport-general' },
  { url: 'https://www.speedcafe.com/feed/',               source: 'Speedcafe',     category: 'motorsport-general' },
]

function extract(xml: string, tag: string): string {
  const cdata = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i')
  const plain = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i')
  const m = xml.match(cdata) ?? xml.match(plain)
  return m ? m[1].trim() : ''
}

function extractImage(xml: string): string | null {
  const patterns = [
    /enclosure[^>]+url="([^"]+)"[^>]+type="image/,
    /media:thumbnail[^>]+url="([^"]+)"/,
    /media:content[^>]+url="([^"]+)"[^>]*type="image/,
    /media:content[^>]+url="([^"]+)"/,
    /<img[^>]+src="([^"]+)"/,
  ]
  for (const re of patterns) {
    const m = xml.match(re)
    if (m?.[1]?.startsWith('http')) return m[1]
  }
  return null
}

async function fetchFeed(config: FeedConfig): Promise<NewsItem[]> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 5000)
  try {
    const res = await fetch(config.url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Throttl/1.0 (car & motorsport news aggregator; contact: hello@throttl.com)' },
      next: { revalidate: 1800 },
    })
    clearTimeout(timer)
    if (!res.ok) return []
    const xml = await res.text()
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]
    return items.slice(0, 8).flatMap(([, itemXml]) => {
      const title = extract(itemXml, 'title')
      const link  = extract(itemXml, 'link').replace(/^<!\[CDATA\[|\]\]>$/g, '').trim()
      if (!title || !link) return []
      return [{
        title,
        link,
        pubDate:     extract(itemXml, 'pubDate'),
        description: extract(itemXml, 'description').replace(/<[^>]+>/g, '').trim().slice(0, 200),
        image:       extractImage(itemXml),
        source:      config.source,
        category:    config.category,
      }]
    })
  } catch {
    clearTimeout(timer)
    return []
  }
}

export async function fetchAllNews(): Promise<NewsItem[]> {
  const results = await Promise.all(FEEDS.map(fetchFeed))
  return results
    .flat()
    .sort((a, b) => {
      const ta = a.pubDate ? new Date(a.pubDate).getTime() : 0
      const tb = b.pubDate ? new Date(b.pubDate).getTime() : 0
      return tb - ta
    })
}
