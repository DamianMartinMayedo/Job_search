import nodemailer from 'nodemailer'

let transporter = null

function getTransporter() {
  if (transporter) return transporter

  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!user || !pass) {
    throw new Error('Credenciales SMTP no configuradas (SMTP_USER / SMTP_PASS)')
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user, pass },
  })

  return transporter
}

export async function sendEmail({ to, subject, body, attachments }) {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to,
    subject,
    text: body,
  }

  if (attachments?.length) {
    mailOptions.attachments = attachments
  }

  const info = await getTransporter().sendMail(mailOptions)
  return { messageId: info.messageId, accepted: info.accepted, rejected: info.rejected }
}
