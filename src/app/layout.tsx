import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { Car } from "lucide-react";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Throttl — Find & Share Car Sightings",
  description: "Log cars you've spotted, track their worth, and share car meetup events with the community.",
  manifest: "/manifest.json",
  themeColor: "#5E6AD2",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Throttl" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.className}>
      <body className="bg-[#050506] text-[#EDEDEF] min-h-screen flex flex-col">

        {/* ── Ambient Background Layer ─────────────────────────── */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#0a0a0f_0%,#050506_50%,#020203_100%)]" />
          <div className="blob-1 absolute -top-[30%] left-1/2 -translate-x-1/2 w-[900px] h-[700px] rounded-full"
            style={{ background: 'rgba(94,106,210,0.22)', filter: 'blur(150px)' }} />
          <div className="blob-2 absolute top-[25%] -left-[15%] w-[600px] h-[500px] rounded-full"
            style={{ background: 'rgba(120,80,210,0.14)', filter: 'blur(120px)' }} />
          <div className="blob-3 absolute top-[15%] -right-[10%] w-[500px] h-[450px] rounded-full"
            style={{ background: 'rgba(70,90,200,0.11)', filter: 'blur(110px)' }} />
          <div className="blob-4 absolute bottom-[5%] left-1/2 -translate-x-1/2 w-[700px] h-[300px] rounded-full"
            style={{ background: 'rgba(94,106,210,0.10)', filter: 'blur(100px)' }} />
          <div className="absolute inset-0 opacity-[0.018]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.4) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.4) 1px,transparent 1px)',
              backgroundSize: '64px 64px',
            }} />
        </div>

        <Navbar />

        <main className="flex-1 md:pt-16 pb-20 md:pb-0 min-h-screen">
          {children}
        </main>

        {/* ── Footer ───────────────────────────────────────────── */}
        <footer
          className="hidden md:block mt-auto"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(2,2,3,0.70)' }}
        >
          <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-[#5E6AD2]" />
              <span className="text-sm font-semibold text-[#EDEDEF]">Throttl</span>
              <span className="text-xs ml-2" style={{ color: '#8A8F98' }}>
                Built for car enthusiasts
              </span>
            </div>

            <nav className="flex items-center gap-6">
              {[
                { href: '/spots',   label: 'Spots' },
                { href: '/events',  label: 'Events' },
                { href: '/feed',    label: 'Feed' },
                { href: '/news',    label: 'News' },
                { href: '/privacy', label: 'Privacy Policy' },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-xs transition-colors duration-200 hover:text-[#EDEDEF]"
                  style={{ color: '#8A8F98' }}
                >
                  {label}
                </Link>
              ))}
            </nav>

            <p className="text-xs" style={{ color: '#8A8F98' }}>
              © {new Date().getFullYear()} Throttl
            </p>
          </div>
        </footer>

      </body>
    </html>
  );
}
