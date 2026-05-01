import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cookie Preferences — PRODKJBEATS | Manage Your Cookie Settings',
  description: 'Manage cookie settings for PRODKJBEATS — learn about essential, analytics, and preference cookies and how each one affects your experience.',
  alternates: { canonical: '/cookies' },
}

const COOKIE_TYPES = [
  {
    name: 'Essential Cookies',
    required: true,
    description:
      'These cookies are required for the Site to function. They manage your login session, keep your cart intact, and enable secure checkout. These cannot be disabled.',
    examples: ['Auth session token', 'Cart state'],
  },
  {
    name: 'Analytics Cookies',
    required: false,
    description:
      'These cookies help us understand how visitors use the Site — which pages are visited most, where users drop off, and how they find us. All data is aggregated and anonymous.',
    examples: ['Page view counts', 'Traffic sources'],
  },
  {
    name: 'Preference Cookies',
    required: false,
    description:
      "These cookies remember settings you've chosen, such as your preferred playback volume or filter selections in the store.",
    examples: ['Volume level', 'Last applied genre filter'],
  },
]

export default function CookiesPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <div className="mb-10 text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          Legal
        </p>
        <h1 className="text-3xl font-black text-white sm:text-4xl">Cookie Preferences</h1>
        <p className="mt-3 text-sm text-muted max-w-md mx-auto">
          We use cookies to keep the site running, understand usage, and remember your settings.
        </p>
      </div>

      <div className="space-y-4">
        {COOKIE_TYPES.map(({ name, required, description, examples }) => (
          <div key={name} className="rounded-xl border border-line bg-surface-2 p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="font-bold text-white text-sm">{name}</p>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  required
                    ? 'bg-line text-muted-mid'
                    : 'bg-surface-2 text-muted'
                }`}
              >
                {required ? 'Always on' : 'Optional'}
              </span>
            </div>
            <p className="text-sm text-muted leading-relaxed mb-3">{description}</p>
            <div className="flex flex-wrap gap-2">
              {examples.map((ex) => (
                <span
                  key={ex}
                  className="text-xs bg-line-mid border border-line text-muted-low px-2 py-1 rounded-md"
                >
                  {ex}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-10 text-xs text-muted-low text-center leading-relaxed">
        By continuing to use this site, you consent to our use of essential cookies. For questions,
        contact us through the{' '}
        <a href="/about" className="underline hover:text-muted-mid transition-colors">
          Services page
        </a>
        .
      </p>
    </div>
  )
}
