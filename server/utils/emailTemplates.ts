export const emailStyles = `
  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: #333;
    background-color: #f4f4f5;
    margin: 0;
    padding: 0;
  }
  .container {
    max-width: 600px;
    margin: 20px auto;
    background-color: #ffffff;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
  .header {
    background: linear-gradient(to right, #16a34a, #15803d);
    color: white;
    padding: 30px 20px;
    text-align: center;
  }
  .header h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 700;
    letter-spacing: 0.5px;
  }
  .content {
    padding: 30px;
  }
  .greeting {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 20px;
    color: #111827;
  }
  .card {
    background-color: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
  }
  .label {
    font-size: 12px;
    text-transform: uppercase;
    color: #6b7280;
    font-weight: 700;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
  }
  .value {
    font-size: 16px;
    color: #1f2937;
    margin-bottom: 16px;
  }
  .value:last-child {
    margin-bottom: 0;
  }
  .message-box {
    background-color: #eff6ff;
    border-left: 4px solid #3b82f6;
    padding: 16px;
    margin: 20px 0;
    font-style: italic;
    color: #1e40af;
  }
  .footer {
    background-color: #f9fafb;
    padding: 20px;
    text-align: center;
    font-size: 12px;
    color: #6b7280;
    border-top: 1px solid #e5e7eb;
  }
  .button {
    display: inline-block;
    background-color: #16a34a;
    color: white;
    padding: 12px 24px;
    text-decoration: none;
    border-radius: 6px;
    font-weight: 600;
    margin-top: 20px;
  }
  .status-badge {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
  }
  .status-success { background-color: #d1fae5; color: #065f46; }
  .status-error { background-color: #fee2e2; color: #991b1b; }
  .status-warning { background-color: #fef3c7; color: #92400e; }
  .status-info { background-color: #dbeafe; color: #1e40af; }
`;

interface EmailTemplateOptions {
    title: string;
    greeting?: string; // e.g., "Dear Student,"
    mainContent: string; // HTML string
    actionUrl?: string;
    actionText?: string;
}

export const generateEmailHtml = ({
    title,
    greeting = "Hello,",
    mainContent,
    actionUrl,
    actionText = "View in Dashboard",
}: EmailTemplateOptions): string => {
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          ${emailStyles}
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>OJT Monitoring System</h1>
          </div>
          <div class="content">
            <div class="greeting">${greeting}</div>
            
            ${mainContent}
            
            ${actionUrl
            ? `<div style="text-align: center;">
                    <a href="${actionUrl}" class="button" style="color: white !important;">${actionText}</a>
                   </div>`
            : ""
        }
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} OJT Monitoring System. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};
