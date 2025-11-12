import { Resend } from 'resend'

// Initialize Resend client
export const resend = new Resend(process.env.RESEND_API_KEY)

// Email configuration
export const FROM_EMAIL = process.env.EMAIL_FROM || 'alerts@yourdomain.com'
export const REPLY_TO_EMAIL = process.env.EMAIL_REPLY_TO || FROM_EMAIL

// Email sending helper
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string | string[]
  subject: string
  html: string
  text?: string
}) {
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      text,
      reply_to: REPLY_TO_EMAIL,
    })

    console.log(`📧 Email sent successfully:`, result)
    return { success: true, id: result.data?.id }
  } catch (error) {
    console.error('❌ Failed to send email:', error)
    throw error
  }
}

// Batch email sending (for reports)
export async function sendBatchEmails(
  emails: Array<{
    to: string
    subject: string
    html: string
    text?: string
  }>
) {
  const results = await Promise.allSettled(
    emails.map(email => sendEmail(email))
  )

  const successful = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length

  console.log(`📊 Batch email results: ${successful} sent, ${failed} failed`)

  return { successful, failed, results }
}
