export type DownloadLink = {
  title: string
  url: string
}

export type OrderConfirmationData = {
  orderId: string
  displayId: string | number
  customerEmail: string
  links: DownloadLink[]
}

export function buildOrderConfirmationEmail(data: OrderConfirmationData): {
  subject: string
  html: string
} {
  const subject = `طلبك جاهز للتحميل — Promptr #${data.displayId}`

  const downloadButtons = data.links
    .map(
      (link) => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #1a1a2e;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="font-family: Tahoma, Arial, sans-serif; font-size: 15px; color: #e0e0e0; padding-left: 8px;">
              ${link.title}
            </td>
            <td align="left" style="white-space: nowrap; padding-right: 0;">
              <a href="${link.url}"
                 target="_blank"
                 style="display: inline-block; background-color: #6C2BFF; color: #ffffff;
                        font-family: Tahoma, Arial, sans-serif; font-size: 14px; font-weight: bold;
                        text-decoration: none; padding: 10px 22px; border-radius: 8px;">
                ⬇ تحميل
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>`
    )
    .join("")

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #080810; font-family: Tahoma, Arial, sans-serif;" dir="rtl">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #080810;">
    <tr>
      <td align="center" style="padding: 40px 16px 0;">

        <!-- Card -->
        <table width="600" cellpadding="0" cellspacing="0" border="0"
               style="max-width: 600px; background-color: #0d0d1f;
                      border: 1px solid #1e1e3a; border-radius: 16px; overflow: hidden;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding: 32px 40px 24px;
                                       border-bottom: 1px solid #1a1a2e;">
              <span style="font-family: Tahoma, Arial, sans-serif; font-size: 26px;
                           font-weight: 900; letter-spacing: 4px; color: #ffffff;">
                PROMPTR
              </span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 36px 40px;">

              <!-- Greeting -->
              <p style="margin: 0 0 8px; font-size: 22px; font-weight: 700; color: #ffffff;">
                شكراً لك! 🎉
              </p>
              <p style="margin: 0 0 28px; font-size: 15px; color: #9090b0; line-height: 1.7;">
                تم استلام طلبك بنجاح وملفاتك جاهزة للتحميل الآن.
              </p>

              <!-- Order number badge -->
              <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 28px;">
                <tr>
                  <td style="background-color: #13132b; border: 1px solid #2a2a50;
                              border-radius: 8px; padding: 10px 18px;">
                    <span style="font-family: Tahoma, Arial, sans-serif; font-size: 13px;
                                 color: #6C2BFF; font-weight: 700; letter-spacing: 1px;">
                      رقم الطلب
                    </span>
                    <span style="font-family: Tahoma, Arial, sans-serif; font-size: 13px;
                                 color: #c0c0d8; margin-right: 8px;">
                      #${data.displayId}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Section title -->
              <p style="margin: 0 0 16px; font-size: 16px; font-weight: 700;
                         color: #00CFFF; border-right: 3px solid #00CFFF;
                         padding-right: 10px;">
                ملفاتك جاهزة للتحميل
              </p>

              <!-- Download list -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="margin-bottom: 20px;">
                ${downloadButtons}
              </table>

              <!-- Expiry note -->
              <p style="margin: 0 0 32px; font-size: 13px; color: #606080;
                         background-color: #0a0a1a; border: 1px solid #1a1a30;
                         border-radius: 6px; padding: 10px 14px;">
                ⏱ الروابط صالحة لمدة 7 أيام من تاريخ الطلب.
              </p>

              <!-- Help note -->
              <p style="margin: 0; font-size: 14px; color: #7070a0; line-height: 1.7;">
                إذا واجهتك أي مشكلة في التحميل، تواصل معنا عبر
                <a href="https://promptrsa.com"
                   style="color: #00CFFF; text-decoration: none;">promptrsa.com</a>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center"
                style="padding: 20px 40px; border-top: 1px solid #1a1a2e;
                        background-color: #080810;">
              <a href="https://promptrsa.com"
                 style="font-family: Tahoma, Arial, sans-serif; font-size: 13px;
                         color: #404060; text-decoration: none;">
                promptrsa.com
              </a>
              <span style="color: #2a2a40; margin: 0 8px;">·</span>
              <span style="font-family: Tahoma, Arial, sans-serif; font-size: 13px;
                            color: #404060;">
                جميع الحقوق محفوظة © Promptr ${new Date().getFullYear()}
              </span>
            </td>
          </tr>

        </table>
        <!-- /Card -->

      </td>
    </tr>
    <tr>
      <td style="height: 40px;"></td>
    </tr>
  </table>

</body>
</html>`

  return { subject, html }
}
