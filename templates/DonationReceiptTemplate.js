const fs = require('fs');
const path = require('path');

// Read the SVG file
const logoPath = path.join(__dirname, 'afaw-logo-black.svg');
const logoData = fs.readFileSync(logoPath, { encoding: 'utf-8' });

// Encode as base64
const logoBase64 = Buffer.from(logoData).toString('base64');
const logoDataURI = `data:image/svg+xml;base64,${logoBase64}`;

// templates/donationReceiptTemplate.js
function generateDonationReceiptHTML(donation, organization, printDate) {
    const formatDate = (dateString) =>
      new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
  
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Donation Receipt</title>
      <style>
        /* General */
        body { font-family: Arial, sans-serif; line-height: 1.4; color: #333; padding: 16px; max-width: 800px; margin: 0 auto; font-size: 12px; }
        h1, h2, h3 { margin: 0 0 8px 0; }
        h1 { font-size: 28px; color: #2563eb; }
        h2 { font-size: 16px; }
        h3 { font-size: 14px; }
        p { margin: 4px 0; }

        
        /* Layout */
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e5e7eb; padding-bottom: 16px; margin-bottom: 16px; }
        .left { flex: 1; }
        .right {
  flex: 1;
  display: flex;
  flex-direction: column; /* stack logo + details vertically */
  align-items: flex-end;  /* right-align the whole block */
  text-align: right;      /* right-align text inside */
}
.logo {
  max-height: 112px;
  max-width: 160px;
  display: block;
  margin-bottom: 12px; /* spacing between logo and details */
}

  
        /* Sections */
        .section { margin-bottom: 16px; page-break-inside: avoid; }
        .box { padding: 12px; border-radius: 6px; }
        .donor-box { background-color: #eff6ff; }
        .donation-box { background-color: #f0fdf4; }
        .tax-box { background-color: #fefce8; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 6px; }
  
        .message-box { background-color: #fff; padding: 12px; border-radius: 4px; border-left: 4px solid #16a34a; font-style: italic; }
        
        /* Footer */
        .footer { text-align: center; margin-top: 16px; padding-top: 12px; font-size: 11px; }
        .red-line { width: 100%; height: 4px; background-color: #dc2626; margin-bottom: 8px; }
  
        /* Receipt Details */
        .receipt-details div { margin-bottom: 4px; }
  
      </style>
    </head>
    <body>
  
      <!-- Header -->
      <div class="header">
        <div class="left">
          <h1>Donation Receipt</h1>
          <div>${organization.name}</div>
          <div class="receipt-details">
            <div>Receipt No: AFAW-ACKP-${donation.id.toString().padStart(3, '0')}</div>
            <div>Date: ${formatDate(donation.created_at)}</div>
          </div>
        </div>
        <div class="right">
          <img src="${logoDataURI || ''}" alt="AfAW logo" class="logo"/>
          <div>${organization.address}</div>
          <div>${organization.phone}</div>
          <div>${organization.email}</div>
          <div>${organization.website}</div>
          <div>${organization.regNumber}</div>
        </div>
      </div>
  
      <!-- Transaction Info -->
      ${
        donation.transaction_id
          ? `<div class="section box" style="background-color: #f9fafb;">
              <h2>Transaction Information</h2>
              <p><strong>Transaction ID:</strong> ${donation.transaction_id}</p>
            </div>`
          : ''
      }
  
      <!-- Donor Info -->
      <div class="section donor-box box">
        <h2>Donor Information</h2>
        <p><strong>Name:</strong> ${donation.name}</p>
        <p><strong>Email:</strong> ${donation.email}</p>
      </div>
  
      <!-- Donation Details -->
      <div class="section donation-box box">
        <h2>Donation Details</h2>
        <p><strong>Amount Donated:</strong> $${donation.amount.toFixed(2)}</p>
        <p><strong>Payment Method:</strong> ${donation.method}</p>
        ${
          donation.message
            ? `<div class="message-box">"${donation.message}"</div>`
            : ''
        }
      </div>
  
      <!-- Tax Info -->
      <div class="section tax-box">
        <h3>Tax Deductible Information</h3>
        <p>This donation is tax-deductible to the full extent allowed by law. Please keep this receipt for your tax records. Our organization is a registered 501(c)(3) non-profit organization.</p>
      </div>
  
      <!-- Footer -->
      <div class="footer">
        <div class="red-line"></div>
        <p>Thank you for your generous donation!</p>
        <p>For inquiries, contact ${organization.email}</p>
        ${
          printDate
            ? `<p style="color: #888; margin-top: 4px;">Receipt generated on: ${printDate}</p>`
            : ''
        }
      </div>
  
    </body>
    </html>
    `;
  }
  
  module.exports = generateDonationReceiptHTML;
  