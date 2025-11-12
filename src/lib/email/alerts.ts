import { sendEmail } from './client'
import {
  generateUrlDroppedEmail,
  generateUrlDroppedEmailText,
  generateBulkDropEmail,
  generateUrlIndexedEmail,
  generateErrorDetectedEmail,
} from './templates'
import { format } from 'date-fns'

interface UrlDroppedAlertData {
  email: string
  userName: string
  projectName: string
  url: string
  previousState: string
  newState: string
  detectedAt: Date
  projectId: string
}

export async function sendUrlDroppedAlert(data: UrlDroppedAlertData) {
  try {
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/projects/${data.projectId}/urls`

    const formattedDate = format(data.detectedAt, 'PPpp') // e.g., "Apr 29, 2023 at 9:30 AM"

    const emailHtml = generateUrlDroppedEmail({
      userName: data.userName || 'there',
      projectName: data.projectName,
      url: data.url,
      previousState: data.previousState,
      newState: data.newState,
      detectedAt: formattedDate,
      dashboardUrl,
    })

    const emailText = generateUrlDroppedEmailText({
      userName: data.userName || 'there',
      projectName: data.projectName,
      url: data.url,
      previousState: data.previousState,
      newState: data.newState,
      detectedAt: formattedDate,
      dashboardUrl,
    })

    await sendEmail({
      to: data.email,
      subject: `⚠️ URL Dropped from Index - ${data.projectName}`,
      html: emailHtml,
      text: emailText,
    })

    console.log(`📧 URL dropped alert sent to ${data.email}`)
    return { success: true }
  } catch (error) {
    console.error('Failed to send URL dropped alert:', error)
    throw error
  }
}

interface BulkDropAlertData {
  email: string
  userName: string
  projectName: string
  droppedCount: number
  totalUrls: number
  timeframe: string
  projectId: string
}

export async function sendBulkDropAlert(data: BulkDropAlertData) {
  try {
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/projects/${data.projectId}/dashboard`

    const emailHtml = generateBulkDropEmail({
      userName: data.userName || 'there',
      projectName: data.projectName,
      droppedCount: data.droppedCount,
      totalUrls: data.totalUrls,
      timeframe: data.timeframe,
      dashboardUrl,
    })

    await sendEmail({
      to: data.email,
      subject: `🚨 CRITICAL: Bulk Indexing Drop - ${data.projectName}`,
      html: emailHtml,
    })

    console.log(`📧 Bulk drop alert sent to ${data.email}`)
    return { success: true }
  } catch (error) {
    console.error('Failed to send bulk drop alert:', error)
    throw error
  }
}

interface UrlIndexedAlertData {
  email: string
  userName: string
  projectName: string
  url: string
  previousState: string
  detectedAt: Date
  projectId: string
}

export async function sendUrlIndexedAlert(data: UrlIndexedAlertData) {
  try {
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/projects/${data.projectId}/urls`
    const formattedDate = format(data.detectedAt, 'PPpp')

    const emailHtml = generateUrlIndexedEmail({
      userName: data.userName || 'there',
      projectName: data.projectName,
      url: data.url,
      previousState: data.previousState,
      detectedAt: formattedDate,
      dashboardUrl,
    })

    await sendEmail({
      to: data.email,
      subject: `✅ URL Now Indexed - ${data.projectName}`,
      html: emailHtml,
    })

    console.log(`📧 URL indexed alert sent to ${data.email}`)
    return { success: true }
  } catch (error) {
    console.error('Failed to send URL indexed alert:', error)
    throw error
  }
}

interface ErrorDetectedAlertData {
  email: string
  userName: string
  projectName: string
  url: string
  errorMessage: string
  detectedAt: Date
  projectId: string
}

export async function sendErrorDetectedAlert(data: ErrorDetectedAlertData) {
  try {
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/projects/${data.projectId}/urls`
    const formattedDate = format(data.detectedAt, 'PPpp')

    const emailHtml = generateErrorDetectedEmail({
      userName: data.userName || 'there',
      projectName: data.projectName,
      url: data.url,
      errorMessage: data.errorMessage,
      detectedAt: formattedDate,
      dashboardUrl,
    })

    await sendEmail({
      to: data.email,
      subject: `⚠️ Indexing Error Detected - ${data.projectName}`,
      html: emailHtml,
    })

    console.log(`📧 Error detected alert sent to ${data.email}`)
    return { success: true }
  } catch (error) {
    console.error('Failed to send error detected alert:', error)
    throw error
  }
}
