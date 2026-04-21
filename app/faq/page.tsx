import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FAQ — PRODKJBEATS',
}

const FAQS = [
  {
    q: 'What licenses do you offer?',
    a: 'We offer Standard Lease and Unlimited Lease. Standard allows up to 500k streams and 5,000 paid downloads. Unlimited allows unlimited streams and downloads. Both are non-exclusive.',
  },
  {
    q: 'How do I receive my beats after purchase?',
    a: 'A download link is sent to your email immediately after payment. The link is valid for 48 hours. You can also access your purchases anytime by logging into your account.',
  },
  {
    q: 'What file formats are included?',
    a: 'All leases include MP3 and WAV files. Unlimited leases also include track stems.',
  },
  {
    q: 'Can I re-download my beats?',
    a: 'Yes. Sign into your account at prodkjbeats.com/purchases to access all your past orders and re-download at any time.',
  },
  {
    q: 'Do you offer exclusive rights?',
    a: 'Yes, through our Custom Exclusive Beat service. Contact us via the Services page to discuss pricing and availability.',
  },
  {
    q: 'Can I use these beats on YouTube?',
    a: 'Yes. Standard and Unlimited leases allow YouTube use. Make sure to credit PRODKJBEATS in your video description.',
  },
  {
    q: 'What is your refund policy?',
    a: 'All sales are final due to the digital nature of the product. If you have an issue with your order, contact us and we will do our best to resolve it.',
  },
]

export default function FAQPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <div className="mb-10 text-center">
        <p className="mb-2 text-[11px] font-normal uppercase tracking-[0.1em] text-muted-low">
          Help
        </p>
        <h1 className="font-display text-foreground leading-none" style={{ fontSize: 'clamp(48px, 8vw, 88px)', fontWeight: 300 }}>FAQ</h1>
        <p className="mt-3 text-sm text-muted max-w-md mx-auto">
          Frequently asked questions about beats, licensing, and orders.
        </p>
      </div>

      <div className="space-y-3">
        {FAQS.map(({ q, a }) => (
          <div key={q} className="rounded-xl border border-line bg-surface-2 p-5">
            <h3 className="mb-2 font-medium text-foreground text-[15px]">{q}</h3>
            <p className="text-sm text-muted leading-relaxed">{a}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
