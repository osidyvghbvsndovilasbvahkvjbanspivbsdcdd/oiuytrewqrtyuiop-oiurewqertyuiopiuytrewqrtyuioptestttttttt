const express = require('express');
const puppeteer = require('puppeteer');
const QRCode = require('qrcode');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const PORT = process.env.PORT || 3001;
const API_KEY = process.env.PDF_SERVICE_API_KEY;

// Auth middleware
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// Generate certificate PDF
app.post('/generate', authMiddleware, async (req, res) => {
  const { certificate, template } = req.body;

  if (!certificate || !template) {
    return res.status(400).json({ error: 'Certificate and template required' });
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // Generate verify URL and QR code
    const verifyUrl = `${process.env.APP_URL}/verify/${certificate.cert_number}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 200, margin: 1 });

    // Build HTML for certificate
    const html = generateCertificateHTML(certificate, template, qrDataUrl);

    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Set page size to A4 landscape
    await page.setViewport({ width: 1123, height: 794 });

    const pdf = await page.pdf({
      width: '1123px',
      height: '794px',
      printBackground: true,
      preferCSSPageSize: true,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${certificate.cert_number}.pdf"`);
    res.send(pdf);

  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'PDF generation failed' });
  } finally {
    if (browser) await browser.close();
  }
});

function generateCertificateHTML(certificate, template, qrDataUrl) {
  const isBoth = certificate.language === 'both';
  const pages = isBoth ? ['ar', 'en'] : [certificate.language];

  const courseName = certificate.language === 'ar' 
    ? certificate.course?.name_ar 
    : certificate.course?.name_en;

  const pagesHTML = pages.map((lang, index) => {
    const isArabic = lang === 'ar';
    const studentName = isArabic ? certificate.student_name_ar : certificate.student_name_en;
    const courseName = isArabic ? certificate.course?.name_ar : certificate.course?.name_en;
    const institutionName = isArabic ? 'المؤسسة التعليمية' : 'Educational Institution';
    const certTitle = isArabic ? 'شهادة إتمام' : 'Certificate of Completion';
    const dateText = isArabic ? 'تاريخ الإصدار:' : 'Issue Date:';
    const certNumText = isArabic ? 'رقم الشهادة:' : 'Certificate No:';
    const verifyText = isArabic ? 'امسح للتحقق' : 'Scan to Verify';

    return `
      <div class="page ${isArabic ? 'rtl' : 'ltr'}" style="${index > 0 ? 'page-break-before: always;' : ''}">
        <div class="certificate-container" style="background-image: url('${template.template_image_url}');">
          <div class="content">
            <div class="header">
              <img src="${template.logo_url || ''}" class="logo" alt="Logo" />
              <h1 class="title">${certTitle}</h1>
            </div>

            <div class="body">
              <p class="subtitle">${isArabic ? 'تُمنح هذه الشهادة إلى' : 'This certificate is presented to'}</p>
              <h2 class="student-name">${studentName || certificate.student_name_en}</h2>

              <p class="course-text">
                ${isArabic ? 'لإتمام دورة' : 'For completing the course'}
              </p>
              <h3 class="course-name">${courseName}</h3>

              <div class="details">
                <div class="detail-item">
                  <span class="label">${dateText}</span>
                  <span class="value">${new Date(certificate.issue_date).toLocaleDateString(isArabic ? 'ar-SA' : 'en-US')}</span>
                </div>
                <div class="detail-item">
                  <span class="label">${certNumText}</span>
                  <span class="value">${certificate.cert_number}</span>
                </div>
              </div>
            </div>

            <div class="footer">
              <div class="qr-section">
                <img src="${qrDataUrl}" class="qr-code" alt="QR Code" />
                <span class="qr-text">${verifyText}</span>
              </div>
              <div class="signature">
                <div class="line"></div>
                <span>${isArabic ? 'التوقيع' : 'Signature'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        @page {
          size: 1123px 794px;
          margin: 0;
        }

        .page {
          width: 1123px;
          height: 794px;
          position: relative;
          overflow: hidden;
        }

        .certificate-container {
          width: 100%;
          height: 100%;
          background-size: cover;
          background-position: center;
          position: relative;
        }

        .content {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          padding: 60px 80px;
          display: flex;
          flex-direction: column;
        }

        .rtl { direction: rtl; font-family: 'Tajawal', sans-serif; }
        .ltr { direction: ltr; font-family: 'Inter', sans-serif; }

        .header {
          text-align: center;
          margin-bottom: 30px;
        }

        .logo {
          width: 80px;
          height: 80px;
          object-fit: contain;
          margin-bottom: 15px;
        }

        .title {
          font-size: 36px;
          font-weight: 800;
          color: #1e3a5f;
          letter-spacing: 2px;
        }

        .body {
          flex: 1;
          text-align: center;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 15px;
        }

        .subtitle {
          font-size: 18px;
          color: #666;
        }

        .student-name {
          font-size: 42px;
          font-weight: 900;
          color: #1e3a5f;
          margin: 10px 0;
        }

        .course-text {
          font-size: 16px;
          color: #666;
        }

        .course-name {
          font-size: 28px;
          font-weight: 700;
          color: #2563eb;
        }

        .details {
          display: flex;
          justify-content: center;
          gap: 40px;
          margin-top: 20px;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .label {
          font-size: 14px;
          color: #999;
        }

        .value {
          font-size: 16px;
          font-weight: 600;
          color: #333;
        }

        .footer {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: auto;
        }

        .qr-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
        }

        .qr-code {
          width: 100px;
          height: 100px;
        }

        .qr-text {
          font-size: 11px;
          color: #999;
        }

        .signature {
          text-align: center;
        }

        .line {
          width: 150px;
          height: 1px;
          background: #333;
          margin-bottom: 8px;
        }

        .signature span {
          font-size: 14px;
          color: #666;
        }
      </style>
    </head>
    <body>
      ${pagesHTML}
    </body>
    </html>
  `;
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'certificate-pdf-service' });
});

app.listen(PORT, () => {
  console.log(`PDF Service running on port ${PORT}`);
});
