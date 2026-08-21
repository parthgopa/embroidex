import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import random
import datetime

SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_EMAIL = os.getenv("SMTP_EMAIL", "embroidex0910@gmail.com")
# Remove any spaces in app password
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "fgfjouuugjomtfqi").replace(" ", "")

def send_otp_email(to_email, otp_code, user_name="User"):
    """
    Send a verification OTP email using Gmail SMTP.
    """
    try:
        sender_email = os.getenv("SMTP_EMAIL", "embroidex0910@gmail.com")
        password = os.getenv("SMTP_PASSWORD", "fgfjouuugjomtfqi").replace(" ", "")

        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"{otp_code} is your Embroidex verification code"
        msg["From"] = f"Embroidex <{sender_email}>"
        msg["To"] = to_email

        # Plain-text version
        text_content = f"""Hello {user_name},

Your Embroidex verification code is: {otp_code}

This code is valid for 10 minutes. Please do not share this code with anyone.

Best regards,
Embroidex Team
"""

        # Beautiful HTML version
        html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="500" style="max-width: 500px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05); overflow: hidden; padding: 0;" border="0" cellspacing="0" cellpadding="0">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); padding: 28px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Embroidex</h1>
              <p style="color: #e0e7ff; margin: 6px 0 0 0; font-size: 14px;">Email Verification</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 35px 30px;">
              <h2 style="color: #0f172a; margin: 0 0 12px 0; font-size: 18px; font-weight: 600;">Welcome, {user_name}!</h2>
              <p style="color: #475569; font-size: 14px; line-height: 1.5; margin: 0 0 24px 0;">
                Thank you for joining Embroidex. Use the verification code below to verify your email address and activate your account:
              </p>
              
              <!-- OTP Box -->
              <div style="background-color: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 10px; padding: 18px; text-align: center; margin-bottom: 24px;">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #4f46e5; display: inline-block;">
                  {otp_code}
                </span>
                <p style="color: #64748b; font-size: 12px; margin: 8px 0 0 0;">Valid for 10 minutes</p>
              </div>

              <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0;">
                If you did not request this verification code, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #f1f5f9;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                © 2026 Embroidex. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""

        msg.attach(MIMEText(text_content, "plain"))
        msg.attach(MIMEText(html_content, "html"))

        # Connect to Gmail SMTP
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=15)
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(sender_email, password)
        server.sendmail(sender_email, to_email, msg.as_string())
        server.quit()
        return True, "Email sent successfully"
    except Exception as e:
        print(f"Failed to send OTP email: {e}")
        return False, str(e)
