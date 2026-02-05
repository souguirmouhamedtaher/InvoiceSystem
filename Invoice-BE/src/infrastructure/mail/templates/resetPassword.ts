import { PasswordResetInput } from "src/domain/types/passwordReset.inputType"

/**
 * 
 * @param userName,
 * @param resetPasswordUrl,
 * @param supportEmail,
 * @param supportPhoneNumber
 * @returns
 *
 */
export const resetPassword = function (
    {
        userName,
        resetPasswordUrl
    }: PasswordResetInput
) {
    return `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Request for ${userName}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        .header {
            background-color: #f4f4f4;
            padding: 10px;
            text-align: center;
        }
        .content {
            padding: 20px;
        }
        .footer {
            background-color: #f4f4f4;
            padding: 10px;
            text-align: center;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset Request</h1>
        </div>
        <div class="content">
            <p>Dear ${userName},</p>
            <p>We have received a request to reset your password for your account at ${userName}-invoiceApp. If you did not make this request, please ignore this email.</p>
            
            <h2>Password Reset Instructions</h2>
            <p>To reset your password, please click on the link below:</p>
            <p><a href="${resetPasswordUrl}">Reset Password</a></p>
            <p>This link will expire in 24 hours for security reasons. If the link has expired, please request a new password reset.</p>
            
            <h2>Important Security Tips</h2>
            <ul>
                <li>Never share your password with anyone.</li>
                <li>Use a unique password for each of your online accounts.</li>
                <li>Change your passwords regularly.</li>
                <li>If you suspect your account has been compromised, please contact us immediately.</li>
            </ul>
            
            <h2>Contact Us</h2>
            <p>If you have any questions or need further assistance, please contact our support team at <a href="mailto:${process.env.MAILER_SENDER}">${process.env.MAILER_SENDER}</a>.</p>
            
            <p>Thank you for your cooperation and understanding.</p>
        </div>
        <div class="footer">
            <p>Best regards,<br>
            islamiqueApp</p>
        </div>
    </div>
</body>
</html>
    `
}
