import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Use — KJYOUCRAZY | Beat Licensing Agreement',
  description: 'Terms and conditions for purchasing and licensing beats from KJYOUCRAZY — leases, prohibited uses, refund policy, and intellectual property.',
  alternates: { canonical: '/terms' },
}

const SECTIONS = [
  {
    title: 'Acceptance of Terms',
    body: 'By accessing or using KJYOUCRAZY ("the Site"), you agree to be bound by these Terms of Use. If you do not agree to these terms, please do not use the Site.',
  },
  {
    title: 'Purchases and Licenses',
    body: 'All beats sold on this Site are licensed, not sold. Purchasing a beat grants you a limited, non-transferable license to use the beat under the terms of the license tier selected at checkout (Standard Lease, Unlimited Lease, or Exclusive Rights). See the Licensing Info page for full details on each tier.',
  },
  {
    title: 'No Refunds',
    body: 'All sales are final. Due to the digital nature of the products, we do not offer refunds after a beat has been delivered. If you experience a technical issue with your download, contact us and we will resolve it.',
  },
  {
    title: 'Prohibited Uses',
    body: 'You may not resell, sublicense, or redistribute beats purchased on this Site. You may not use beats in a way that violates applicable laws, infringes on third-party rights, or misrepresents the origin of the content.',
  },
  {
    title: 'Intellectual Property',
    body: 'All beats, production, and content on this Site are the intellectual property of KJYOUCRAZY unless otherwise stated. Unauthorized reproduction or redistribution is strictly prohibited.',
  },
  {
    title: 'User Accounts',
    body: 'You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account. We are not liable for any loss resulting from unauthorized account access.',
  },
  {
    title: 'Disclaimer of Warranties',
    body: 'The Site and its content are provided "as is" without warranties of any kind. KJYOUCRAZY does not warrant that the Site will be uninterrupted, error-free, or free of viruses or other harmful components.',
  },
  {
    title: 'Limitation of Liability',
    body: 'To the fullest extent permitted by law, KJYOUCRAZY shall not be liable for any indirect, incidental, special, or consequential damages arising out of your use of the Site or purchase of beats.',
  },
  {
    title: 'Changes to Terms',
    body: 'We reserve the right to update these Terms at any time. Continued use of the Site after changes are posted constitutes acceptance of the revised Terms.',
  },
  {
    title: 'Contact',
    body: 'For questions regarding these Terms, please contact us through the Services page.',
  },
]

export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <div className="mb-10 text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          Legal
        </p>
        <h1 className="text-3xl font-black text-white sm:text-4xl">Terms of Use</h1>
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
