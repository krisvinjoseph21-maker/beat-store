import 'server-only'
import { Resend } from 'resend'

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

/** Strip CR/LF from any string used in an email subject line to prevent header injection. */
function subj(str: string): string {
  return str.replace(/[\r\n]+/g, ' ').trim()
}

// Lazy singleton — only constructed at runtime, not at build time
let _resend: Resend | null = null
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY!)
  return _resend
}

function getFrom() {
  return process.env.RESEND_FROM_EMAIL ?? 'beats@prodkjbeats.com'
}
function getToAdmin() {
  return process.env.RESEND_TO_EMAIL ?? 'kjbeats6@gmail.com'
}
function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
}

export async function sendDownloadEmail({
  customerEmail,
  customerName,
  beatTitles,
  downloadToken,
  licenseType,
}: {
  customerEmail: string
  customerName: string
  beatTitles: string[]
  downloadToken: string
  licenseType: string
}) {
  const downloadUrl = `${getSiteUrl()}/api/download/${downloadToken}`
  const beatsHtml = beatTitles.map((t) => `<li>${esc(t)}</li>`).join('')

  const result = await getResend().emails.send({
    from: `PRODKJBEATS <${getFrom()}>`,
    to: customerEmail,
    subject: 'Your PRODKJBEATS Download is Ready',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#fff;padding:40px;border-radius:8px">
        <h1 style="color:#fff;font-size:24px;margin-bottom:8px">Your beats are ready 🎧</h1>
        <p style="color:#aaa">Hey ${esc(customerName)}, thanks for your order!</p>
        <p style="color:#aaa">You purchased the <strong style="color:#fff">${esc(licenseType)} license(s)</strong> for:</p>
        <ul style="color:#fff">${beatsHtml}</ul>
        <a href="${downloadUrl}" style="display:inline-block;margin-top:24px;background:#fff;color:#0a0a0a;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:700;font-size:16px">
          Download Your Beats
        </a>
        <p style="color:#555;font-size:12px;margin-top:24px">This link expires in 48 hours.</p>
        <p style="color:#555;font-size:12px">— PRODKJBEATS</p>
      </div>
    `,
  })
  return result
}

export async function sendServiceInquiryEmail({
  artistName,
  email,
  serviceType,
  projectDetails,
}: {
  artistName: string
  email: string
  serviceType: string
  projectDetails: string
}) {
  const { error } = await getResend().emails.send({
    from: `PRODKJBEATS <${getFrom()}>`,
    to: getToAdmin(),
    subject: subj(`New Service Inquiry: ${serviceType} — ${artistName}`),
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2>New Service Inquiry</h2>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px;font-weight:bold">Artist Name</td><td style="padding:8px">${esc(artistName)}</td></tr>
          <tr><td style="padding:8px;font-weight:bold">Email</td><td style="padding:8px">${esc(email)}</td></tr>
          <tr><td style="padding:8px;font-weight:bold">Service</td><td style="padding:8px">${esc(serviceType)}</td></tr>
          <tr><td style="padding:8px;font-weight:bold">Project Details</td><td style="padding:8px;white-space:pre-wrap">${esc(projectDetails)}</td></tr>
        </table>
      </div>
    `,
  })
  if (error) throw new Error(error.message)
}

export async function sendExclusiveOfferEmail({
  artistName,
  email,
  beatTitle,
  beatId,
  offerPrice,
  message,
}: {
  artistName: string
  email: string
  beatTitle: string
  beatId: string
  offerPrice: number
  message?: string
}) {
  const siteUrl = getSiteUrl()
  const { error } = await getResend().emails.send({
    from: `PRODKJBEATS <${getFrom()}>`,
    to: getToAdmin(),
    replyTo: email,
    subject: subj(`Exclusive Offer: $${offerPrice} for "${beatTitle}" — ${artistName}`),
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#fff;padding:40px;border-radius:8px">
        <h2 style="color:#fff;margin-bottom:4px">💰 New Exclusive Beat Offer</h2>
        <p style="color:#888;margin-top:0">Someone wants to buy the exclusive rights to one of your beats.</p>
        <table style="width:100%;border-collapse:collapse;margin-top:24px">
          <tr style="border-bottom:1px solid #222">
            <td style="padding:10px 8px;color:#888;font-size:13px">Beat</td>
            <td style="padding:10px 8px;color:#fff;font-weight:700">${esc(beatTitle)}</td>
          </tr>
          <tr style="border-bottom:1px solid #222">
            <td style="padding:10px 8px;color:#888;font-size:13px">Offer Price</td>
            <td style="padding:10px 8px;color:#22c55e;font-weight:700;font-size:18px">$${offerPrice}</td>
          </tr>
          <tr style="border-bottom:1px solid #222">
            <td style="padding:10px 8px;color:#888;font-size:13px">Artist Name</td>
            <td style="padding:10px 8px;color:#fff">${esc(artistName)}</td>
          </tr>
          <tr style="border-bottom:1px solid #222">
            <td style="padding:10px 8px;color:#888;font-size:13px">Email</td>
            <td style="padding:10px 8px;color:#fff"><a href="mailto:${esc(email)}" style="color:#60a5fa">${esc(email)}</a></td>
          </tr>
          ${message ? `<tr><td style="padding:10px 8px;color:#888;font-size:13px;vertical-align:top">Message</td><td style="padding:10px 8px;color:#fff;white-space:pre-wrap">${esc(message)}</td></tr>` : ''}
        </table>
        <a href="${siteUrl}/beat/${beatId}" style="display:inline-block;margin-top:28px;background:#fff;color:#0a0a0a;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px">
          View Beat
        </a>
        <p style="color:#555;font-size:12px;margin-top:24px">Reply directly to this email to respond to the artist.</p>
      </div>
    `,
  })
  if (error) throw new Error(error.message)
}

export async function sendBookingEmail({
  artistName,
  email,
  genre,
  projectType,
  deadline,
  budget,
  referenceTracks,
}: {
  artistName: string
  email: string
  genre: string
  projectType: string
  deadline: string
  budget: string
  referenceTracks: string
}) {
  const refHtml = referenceTracks
    ? `<tr style="border-bottom:1px solid #222"><td style="padding:10px 8px;color:#888;font-size:13px;vertical-align:top">Reference Tracks</td><td style="padding:10px 8px;color:#fff;white-space:pre-wrap">${esc(referenceTracks)}</td></tr>`
    : ''
  const { error } = await getResend().emails.send({
    from: `PRODKJBEATS <${getFrom()}>`,
    to: getToAdmin(),
    replyTo: email,
    subject: subj(`New Booking: ${projectType} — ${artistName}`),
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#fff;padding:40px;border-radius:8px">
        <h2 style="color:#fff;margin-bottom:4px">New Booking Request</h2>
        <p style="color:#888;margin-top:0">A new project intake form was submitted.</p>
        <table style="width:100%;border-collapse:collapse;margin-top:24px">
          <tr style="border-bottom:1px solid #222">
            <td style="padding:10px 8px;color:#888;font-size:13px">Artist Name</td>
            <td style="padding:10px 8px;color:#fff;font-weight:700">${esc(artistName)}</td>
          </tr>
          <tr style="border-bottom:1px solid #222">
            <td style="padding:10px 8px;color:#888;font-size:13px">Email</td>
            <td style="padding:10px 8px;color:#fff"><a href="mailto:${esc(email)}" style="color:#60a5fa">${esc(email)}</a></td>
          </tr>
          <tr style="border-bottom:1px solid #222">
            <td style="padding:10px 8px;color:#888;font-size:13px">Genre</td>
            <td style="padding:10px 8px;color:#fff">${esc(genre)}</td>
          </tr>
          <tr style="border-bottom:1px solid #222">
            <td style="padding:10px 8px;color:#888;font-size:13px">Project Type</td>
            <td style="padding:10px 8px;color:#fff">${esc(projectType)}</td>
          </tr>
          <tr style="border-bottom:1px solid #222">
            <td style="padding:10px 8px;color:#888;font-size:13px">Deadline</td>
            <td style="padding:10px 8px;color:#fff">${esc(deadline)}</td>
          </tr>
          <tr style="border-bottom:1px solid #222">
            <td style="padding:10px 8px;color:#888;font-size:13px">Budget</td>
            <td style="padding:10px 8px;color:#22c55e;font-weight:700">${esc(budget)}</td>
          </tr>
          ${refHtml}
        </table>
        <p style="color:#555;font-size:12px;margin-top:24px">Reply directly to this email to respond to the artist.</p>
      </div>
    `,
  })
  if (error) throw new Error(error.message)
}

export async function sendBookingConfirmationEmail({
  artistName,
  email,
  projectType,
  deadline,
}: {
  artistName: string
  email: string
  projectType: string
  deadline: string
}) {
  await getResend().emails.send({
    from: `PRODKJBEATS <${getFrom()}>`,
    to: email,
    subject: 'Booking Request Received — PRODKJBEATS',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#fff;padding:40px;border-radius:8px">
        <h1 style="color:#fff;font-size:24px;margin-bottom:8px">We got your request</h1>
        <p style="color:#aaa">Hey ${esc(artistName)}, thanks for reaching out!</p>
        <p style="color:#aaa">Your booking request for <strong style="color:#fff">${esc(projectType)}</strong> has been received. I'll review the details and get back to you within 24–48 hours.</p>
        <table style="width:100%;border-collapse:collapse;margin-top:24px">
          <tr style="border-bottom:1px solid #222">
            <td style="padding:10px 8px;color:#888;font-size:13px">Project</td>
            <td style="padding:10px 8px;color:#fff">${esc(projectType)}</td>
          </tr>
          <tr style="border-bottom:1px solid #222">
            <td style="padding:10px 8px;color:#888;font-size:13px">Deadline</td>
            <td style="padding:10px 8px;color:#fff">${esc(deadline)}</td>
          </tr>
        </table>
        <p style="color:#555;font-size:12px;margin-top:32px">— PRODKJBEATS</p>
      </div>
    `,
  })
}

export async function sendSubscribeNotificationEmail({
  name,
  email,
}: {
  name: string
  email: string
}) {
  const { error } = await getResend().emails.send({
    from: `PRODKJBEATS <${getFrom()}>`,
    to: getToAdmin(),
    subject: subj(`New Subscriber: ${name || email}`),
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#fff;padding:40px;border-radius:8px">
        <h2 style="color:#fff;margin-bottom:4px">New Email Subscriber</h2>
        <p style="color:#888;margin-top:0">Someone signed up via the website popup.</p>
        <table style="width:100%;border-collapse:collapse;margin-top:24px">
          ${name ? `<tr style="border-bottom:1px solid #222"><td style="padding:10px 8px;color:#888;font-size:13px">Name</td><td style="padding:10px 8px;color:#fff;font-weight:700">${esc(name)}</td></tr>` : ''}
          <tr><td style="padding:10px 8px;color:#888;font-size:13px">Email</td><td style="padding:10px 8px;color:#fff"><a href="mailto:${esc(email)}" style="color:#c8a86a">${esc(email)}</a></td></tr>
        </table>
        <p style="color:#555;font-size:12px;margin-top:24px">— PRODKJBEATS site</p>
      </div>
    `,
  })
  if (error) throw new Error(error.message)
}

export async function sendContactEmail({
  name,
  email,
  subject,
  message,
}: {
  name: string
  email: string
  subject: string
  message: string
}) {
  const { error } = await getResend().emails.send({
    from: `PRODKJBEATS <${getFrom()}>`,
    to: getToAdmin(),
    replyTo: email,
    subject: subj(`Contact: ${subject} — ${name}`),
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2>New Contact Message</h2>
        <p><strong>Name:</strong> ${esc(name)}</p>
        <p><strong>Email:</strong> ${esc(email)}</p>
        <p><strong>Subject:</strong> ${esc(subject)}</p>
        <p><strong>Message:</strong></p>
        <p style="white-space:pre-wrap">${esc(message)}</p>
      </div>
    `,
  })
  if (error) throw new Error(error.message)
}
