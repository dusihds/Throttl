import Link from 'next/link'
import { ArrowLeft, Shield } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — Throttl',
  description: 'How Throttl collects, uses, and protects your data.',
}

const LAST_UPDATED = 'June 8, 2026'
const CONTACT_EMAIL = 'viktormaras2011@gmail.com'

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm mb-8 transition-colors duration-200 text-[#8C8680] hover:text-[#F5F0EB]"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4 mb-10">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.25)' }}
        >
          <Shield className="w-6 h-6 text-[#F97316]" />
        </div>
        <div>
          <p className="text-[11px] font-mono text-[#F97316] uppercase tracking-widest mb-1">Legal</p>
          <h1 className="text-3xl font-bold text-[#F5F0EB] tracking-tight">Privacy Policy</h1>
          <p className="text-sm mt-1" style={{ color: '#8C8680' }}>Last updated: {LAST_UPDATED}</p>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        <Section title="1. Who We Are">
          <P>
            Throttl is a community platform for car enthusiasts to log spotted vehicles and organise local meetups.
            The app is operated by an independent developer. For any privacy-related questions, contact us at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#F97316] hover:text-[#FB923C] transition-colors underline underline-offset-2">
              {CONTACT_EMAIL}
            </a>
            .
          </P>
        </Section>

        <Section title="2. What Data We Collect">
          <P>We collect only what is necessary to provide the service:</P>
          <ul className="mt-3 flex flex-col gap-3 text-sm leading-relaxed">
            {[
              ['Account data', 'Email address, hashed password, chosen username, and account creation date.'],
              ['Profile data', 'Username, optional avatar URL, and optional bio.'],
              ['Car Spots', 'Make, model, year, colour, estimated value, location name, date spotted, optional photo, and optional notes you enter.'],
              ['Events', 'Event title, description, location name, start/end times, recurrence settings, and optional cover photo.'],
              ['Attendance', 'Which events you mark yourself as attending.'],
              ['Photos', 'Images you upload are stored in our cloud storage. Do not upload images that contain private or sensitive information.'],
              ['Location (geolocation)', 'Only used locally in your browser to filter nearby events. Your coordinates are never transmitted to or stored on our servers.'],
            ].map(([term, desc]) => (
              <li key={term} className="flex flex-col gap-0.5">
                <span className="text-[#F97316] font-semibold text-xs uppercase tracking-wide">{term}</span>
                <span style={{ color: '#8C8680' }}>{desc}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="3. How We Use Your Data">
          <ul className="flex flex-col gap-2 text-sm leading-relaxed" style={{ color: '#8C8680' }}>
            {[
              'To authenticate your account and keep it secure.',
              'To display your spots and events to other community members.',
              'To associate your username with content you create.',
              'To geocode location names you enter (via OpenStreetMap Nominatim) so distance filtering works for other users.',
              'We do not sell, rent, or share your personal data with any third party for marketing purposes.',
            ].map(item => (
              <li key={item} className="flex gap-2.5">
                <span className="text-[#F97316] shrink-0 mt-0.5">—</span>
                {item}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="4. Third-Party Services">
          <P>Throttl relies on the following third-party providers. By using Throttl, your data is also subject to their respective privacy policies:</P>
          <div className="mt-4 flex flex-col gap-3">
            {[
              {
                name: 'Supabase',
                desc: 'Database, authentication, and file storage. Your account credentials, profile, spots, events, and photos are stored on Supabase infrastructure.',
                link: 'https://supabase.com/privacy',
              },
              {
                name: 'OpenStreetMap Nominatim',
                desc: 'Free geocoding API used to convert location text (e.g. "Rodeo Drive, Beverly Hills") into latitude/longitude coordinates when you create a spot or event. The location string you enter is sent to Nominatim servers.',
                link: 'https://osmfoundation.org/wiki/Privacy_Policy',
              },
            ].map(({ name, desc, link }) => (
              <div
                key={name}
                className="rounded-xl p-4"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <p className="text-sm font-semibold text-[#F5F0EB] mb-1">{name}</p>
                <p className="text-sm leading-relaxed" style={{ color: '#8C8680' }}>{desc}</p>
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#F97316] hover:text-[#FB923C] transition-colors mt-2 inline-block underline underline-offset-2"
                >
                  View their Privacy Policy →
                </a>
              </div>
            ))}
          </div>
        </Section>

        <Section title="5. Geolocation">
          <P>
            The "Near Me" feature on the Events page requests access to your device's location. We ask for this permission
            so we can calculate distances between you and car events on your screen only. <strong className="text-[#F5F0EB]">Your coordinates are
            processed entirely in your browser and are never sent to or stored on our servers.</strong> You can decline
            the permission request at any time; the feature will simply be unavailable.
          </P>
        </Section>

        <Section title="6. Email Verification">
          <P>
            When you create an account, we send a one-time confirmation link to your email address via Supabase's
            authentication service. This is used solely to verify that you own the email address and to prevent
            account abuse. We do not send marketing emails.
          </P>
        </Section>

        <Section title="7. Data Retention">
          <P>
            Your data is retained for as long as your account exists. If you wish to delete your account and all
            associated data (spots, events, photos), contact us at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#F97316] hover:text-[#FB923C] transition-colors underline underline-offset-2">
              {CONTACT_EMAIL}
            </a>
            {' '}and we will process your request within 14 days.
          </P>
        </Section>

        <Section title="8. Your Rights">
          <P>Depending on your jurisdiction, you may have the right to:</P>
          <ul className="mt-3 flex flex-col gap-2 text-sm leading-relaxed" style={{ color: '#8C8680' }}>
            {[
              'Access the personal data we hold about you.',
              'Request correction of inaccurate data.',
              'Request deletion of your account and all associated data.',
              'Object to processing of your data.',
              'Withdraw consent at any time (where processing is based on consent).',
            ].map(item => (
              <li key={item} className="flex gap-2.5">
                <span className="text-[#F97316] shrink-0 mt-0.5">—</span>
                {item}
              </li>
            ))}
          </ul>
          <P>To exercise any of these rights, email us at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#F97316] hover:text-[#FB923C] transition-colors underline underline-offset-2">
              {CONTACT_EMAIL}
            </a>.
          </P>
        </Section>

        <Section title="9. Cookies & Local Storage">
          <P>
            Throttl uses browser cookies and local storage solely to maintain your authentication session via Supabase.
            We do not use tracking cookies or third-party advertising cookies.
          </P>
        </Section>

        <Section title="10. Changes to This Policy">
          <P>
            We may update this Privacy Policy from time to time. When we do, we will update the "Last updated" date
            at the top of this page. Continued use of Throttl after changes constitutes acceptance of the updated policy.
          </P>
        </Section>

        <Section title="11. Contact">
          <P>
            For any questions about this Privacy Policy or your data, contact the developer at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#F97316] hover:text-[#FB923C] transition-colors underline underline-offset-2">
              {CONTACT_EMAIL}
            </a>.
          </P>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-[#F5F0EB] mb-3 tracking-tight">{title}</h2>
      <div
        className="rounded-2xl p-5"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        {children}
      </div>
    </section>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm leading-relaxed" style={{ color: '#8C8680' }}>{children}</p>
}
