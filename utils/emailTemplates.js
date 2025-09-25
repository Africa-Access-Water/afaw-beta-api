function userContactConfirmationEmail(name) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <title>Thank You for Contacting Africa Access Water</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin:0; padding:0;">
      <table align="center" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; padding: 20px; border-radius: 8px;">
        <tr>
          <td align="center" style="padding-bottom: 20px;">
            <img src="https://africaaccesswater.org/assets/img/afaw-logo-africa.png" alt="Africa Access Water Logo" width="150" />
          </td>
        </tr>
        <tr>
          <td style="color: #333333; font-size: 16px; line-height: 1.6;">
            <p>Hi <strong>${name}</strong>,</p>
            <p>Thank you for reaching out to <strong>Africa Access Water (AfAW)</strong>.</p>
            <p>We are a non-profit organization committed to improving livelihoods through sustainable, solar-powered water infrastructure in rural African communities.</p>
            <p>We have received your message and will respond shortly. If your inquiry is urgent, feel free to reply directly to this email.</p>
          </td>
        </tr>
        <tr>
          <td style="padding-top: 30px; border-top: 1px solid #dddddd; color: #666666; font-size: 14px; line-height: 1.5;">
            <p>Best regards,</p>
            <p><strong>Africa Access Water Team</strong></p>
            <p>
              <a href="https://africaaccesswater.org" style="color: #3498db; text-decoration: none;">www.africaaccesswater.org</a><br />
              Phone: +260 211 231 174<br />
              Email: <a href="mailto:info@africaaccesswater.org" style="color: #3498db;">info@africaaccesswater.org</a>
            </p>
            <p style="margin-top: 20px;">
              <em>“Invest in Water, Invest in Livelihoods.”</em><br/>
              <small>Registered 501(c)(3) Nonprofit | Zambia & USA</small>
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

function adminContactNotificationEmail(name, email, message) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <title>New Contact Submission - Africa Access Water</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin:0; padding:0;">
      <table align="center" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; padding: 20px; border-radius: 8px;">
        <tr>
          <td align="center" style="padding-bottom: 20px;">
            <img src="https://africaaccesswater.org/assets/img/afaw-logo-africa.png" alt="Africa Access Water Logo" width="150" />
          </td>
        </tr>
        <tr>
          <td style="color: #333333; font-size: 16px; line-height: 1.6;">
            <p>You’ve received a new contact submission via the website:</p>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Message:</strong><br/> ${message}</p>
          </td>
        </tr>
        <tr>
          <td style="padding-top: 30px; border-top: 1px solid #dddddd; color: #666666; font-size: 14px; line-height: 1.5;">
            <p>This message was sent from the <a href="https://africaaccesswater.org" style="color: #3498db;">Africa Access Water</a> website contact form.</p>
            <p><strong>System Notification</strong></p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}



function donorDonationConfirmationEmail(name, amount, currency, projectName) {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8" /></head>
    <body style="font-family: Arial, sans-serif; background:#f9f9f9; margin:0; padding:0;">
      <table align="center" width="600" cellpadding="0" cellspacing="0" 
             style="background:#ffffff; padding: 20px; border-radius: 8px;">
        <tr>
          <td align="center" style="padding-bottom: 20px;">
            <img src="https://africaaccesswater.org/assets/img/afaw-logo-africa.png" 
                 alt="Africa Access Water Logo" width="150" />
          </td>
        </tr>
        <tr>
          <td style="color:#333; font-size:16px; line-height:1.6;">
            <p>Dear <strong>${name}</strong>,</p>
            <p>Thank you for your generous donation of 
              <strong>${amount} ${currency}</strong> 
              towards <strong>${projectName}</strong>.</p>
            <p>Your contribution is directly helping communities gain access to 
              clean and sustainable water.</p>
            <p>We’re truly grateful for your support ❤️.</p>
          </td>
        </tr>
        <tr>
          <td style="padding-top:30px; border-top:1px solid #ddd; color:#666; font-size:14px;">
            <p>Africa Access Water Team</p>
            <p><a href="https://africaaccesswater.org" style="color:#3498db;">africaaccesswater.org</a></p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

function adminDonationNotificationEmail(name, email, amount, currency, projectName) {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8" /></head>
    <body style="font-family: Arial, sans-serif; background:#f9f9f9; margin:0; padding:0;">
      <table align="center" width="600" cellpadding="0" cellspacing="0" 
             style="background:#ffffff; padding: 20px; border-radius: 8px;">
        <tr>
          <td align="center" style="padding-bottom: 20px;">
            <img src="https://africaaccesswater.org/assets/img/afaw-logo-africa.png" 
                 alt="Africa Access Water Logo" width="150" />
          </td>
        </tr>
        <tr>
          <td style="color:#333; font-size:16px; line-height:1.6;">
            <p><strong>New Donation Received</strong></p>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Amount:</strong> ${amount} ${currency}</p>
            <p><strong>Project:</strong> ${projectName}</p>
          </td>
        </tr>
        <tr>
          <td style="padding-top:30px; border-top:1px solid #ddd; color:#666; font-size:14px;">
            <p>This is an automated system notification.</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

module.exports = {
  userContactConfirmationEmail,
  adminContactNotificationEmail,
  donorDonationConfirmationEmail,
  adminDonationNotificationEmail,
};

