import Link from 'next/link'

interface Props {
  label: string
  heading: string
  subtext: string
}

export default function CtaBanner({ label, heading, subtext }: Props) {
  return (
    <section className="relative w-full py-28 flex flex-col items-center text-center px-6 overflow-hidden bg-black border-t border-white/[0.06]">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(255,255,255,0.025) 0%, transparent 70%)' }}
        aria-hidden="true"
      />
      <p className="relative text-[10px] font-semibold uppercase text-accent mb-5" style={{ letterSpacing: '0.15em' }}>
        {label}
      </p>
      <h2
        className="relative text-foreground leading-none mb-5"
        style={{ fontFamily: 'var(--font-bebas)', fontSize: 'clamp(48px, 7vw, 88px)', letterSpacing: '0.01em' }}
      >
        {heading}
      </h2>
      <p className="relative text-[13px] text-muted max-w-sm leading-relaxed mb-10">
        {subtext}
      </p>
      <Link
        href="/store"
        className="relative inline-flex items-center justify-center bg-white text-black text-[11px] font-bold uppercase transition-[background-color,transform] hover:bg-zinc-100 active:scale-[0.98]"
        style={{ padding: '14px 40px', letterSpacing: '0.1em' }}
      >
        Shop Beats
      </Link>
    </section>
  )
}
