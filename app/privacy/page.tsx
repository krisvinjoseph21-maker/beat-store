import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — KJYOUCRAZY | Data Collection & Your Rights',
  description: 'How KJYOUCRAZY collects, uses, and protects your personal data when you purchase beats or create an account. No data sold to third parties.',
  alternates: { canonical: '/privacy' },
}

const SECTIONS = [
  {
    title: 'Information We Collect',
    body: 'When you create an account or make a purchase, we collect your email address and order information. We do not collect payment card details directly — all payments are processed securely through Stripe.',
  },
  {
    title: 'How We Use Your Information',
    body: 'We use your email address to deliver download links, process orders, and send account-related notifications. We do not sell or share your personal information with third parties for marketing purposes.',
  },
  {
    title: 'Order Data',
    body: 'Your purchase history is stored in our database to allow you to re-download beats at any time from your Purchases page. This data is linked to your account email and is not shared with third parties.',
  },
  {
    title: 'Cookies',
    body: 'We use cookies to maintain your login session and remember your preferences. These are functional cookies necessary for the Site to work. See our Cookie Preferences page to manage optional cookies.',
  },
  {
    title: 'Third-Party Services',
    body: 'We use Stripe for payment processing and Supabase for authentication and data storage. These services have their own privacy policies and may process your data in accordance with their respective terms.',
  },
  {
    title: 'Data Retention',
    body: 'We retain your account and order data for as long as your account is active. If you delete your account, your personal data will be removed from our systems within 30 days, except where retention is required by law.',
  },
  {
    title: 'Your Rights',
    body: 'You have the right to access, correct, or delete your personal data at any time. To make a request, contact us through the Services page. We will respond within 30 days.',
  },
  {
    title: 'Security',
    body: 'We take reasonable steps to protect your information from unauthorized access or disclosure. All data is transmitted over HTTPS. However, no method of transmission over the internet is 100% secure.',
  },
  {
    title: 'Changes to This Policy',
    body: 'We may update this Privacy Policy from time to time. We will notify you of significant changes via email or a notice on the Site. Continued use of the Site after changes constitutes acceptance.',
  },
  {
    title: 'Contact',
    body: 'If you have any questions about this Privacy Policy, contact us through the Services page.',
  },
]

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <div className="mb-10 text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          Legal
        </p>
        <h1 className="text-3xl font-black text-white sm:text-4xl">Privacy Policy</h1>
        <p className="mt-3 text-sm text-muted max-w-md mx-auto">
          Last updated: March 2026
        </p>
      </div>

      <div className="space-y-3">
        {SECTIONS.map(({ title, body }) => (
          <div key={title} className="rounded-xl border border-line bg-surface-2 p-5">
            <p className="mb-2 font-bold text-white text-sm">{title}</p>
            <p className="text-sm text-muted leading-relaxed">{body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
