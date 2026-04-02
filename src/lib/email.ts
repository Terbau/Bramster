import { EmailClient } from "@azure/communication-email"

const connectionString = process.env.AZURE_COMMUNICATION_SERVICES_CONNECTION_STRING

export const sendQuestionErrorReportEmail = async ({
  questionId,
  questionContent,
  reportContent,
  reporterEmail,
}: {
  questionId: string
  questionContent: string
  reportContent: string
  reporterEmail: string
}) => {
  if (!connectionString) {
    console.warn("AZURE_COMMUNICATION_SERVICES_CONNECTION_STRING is not set — skipping email")
    return
  }

  const client = new EmailClient(connectionString)

  await client.beginSend({
    senderAddress: process.env.AZURE_COMMUNICATION_SERVICES_SENDER_ADDRESS ?? "DoNotReply@bramster.no",
    recipients: {
      to: [{ address: "bragebau@hotmail.no" }],
    },
    content: {
      subject: `[Bramster] Error reported on question ${questionId}`,
      plainText: [
        "A user has reported an error on a question.",
        "",
        `Reporter: ${reporterEmail}`,
        `Question ID: ${questionId}`,
        "",
        "Question content:",
        questionContent,
        "",
        "Error description:",
        reportContent,
      ].join("\n"),
      html: `
        <h2>Error reported on a question</h2>
        <table style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
          <tr>
            <td style="padding:4px 12px 4px 0;color:#6b7280;vertical-align:top">Reporter</td>
            <td style="padding:4px 0">${reporterEmail}</td>
          </tr>
          <tr>
            <td style="padding:4px 12px 4px 0;color:#6b7280;vertical-align:top">Question ID</td>
            <td style="padding:4px 0;font-family:monospace">${questionId}</td>
          </tr>
        </table>
        <h3 style="margin-top:20px">Question content</h3>
        <p style="background:#f3f4f6;padding:12px;border-radius:6px;white-space:pre-wrap">${questionContent}</p>
        <h3>Error description</h3>
        <p style="background:#fef2f2;padding:12px;border-radius:6px;white-space:pre-wrap">${reportContent}</p>
      `,
    },
  })
}
