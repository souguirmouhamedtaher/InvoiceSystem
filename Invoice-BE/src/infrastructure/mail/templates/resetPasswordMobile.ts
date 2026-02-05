import { PasswordResetInput } from "src/domain/types/passwordReset.inputType"

/**
 * 
 * @param userName
 * @param otpCode
 * @returns
 *
 */
export const resetPasswordMobile = function (
    {
        userName,
        resetPasswordUrl: otpCode
    }: PasswordResetInput
) {
    return `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset OTP for ${userName}</title>
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
        .otp-container {
            text-align: center;
            margin: 20px 0;
        }
        .otp-code {
            font-size: 24px;
            font-weight: bold;
            padding: 10px;
            background-color: #e9e9e9;
            border-radius: 5px;
            display: inline-block;
            margin-right: 10px;
        }
        .copy-button {
            background-color: #4CAF50;
            border: none;
            color: white;
            padding: 10px 20px;
            text-align: center;
            text-decoration: none;
            display: inline-block;
            font-size: 16px;
            margin: 4px 2px;
            cursor: pointer;
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset OTP</h1>
        </div>
        <div class="content">
            <p>Dear ${userName},</p>
            <p>We have received a request to reset your password for your account at ${userName}-moblisig app . If you did not make this request, please ignore this email.</p>
            
            <h2>Your One-Time Password (OTP)</h2>
            <p>Please use the following OTP to reset your password:</p>
            <div class="otp-container">
                <span id="otpCode" class="otp-code">${otpCode}</span>
                <button class="copy-button" onclick="copyOTP()">Copy OTP</button>
            </div>
            <p><strong>If you're using Gmail App Select and copy the OTP above, then paste it into the password reset page.</strong></p>
            <p>This OTP will expire in 10 minutes for security reasons. If the OTP has expired, please request a new password reset.</p>
            
            <h2>Password Reset Instructions</h2>
            <ol>
                <li>Go to the password reset page on islamiqueApp.</li>
                <li>Enter the OTP provided above.</li>
                <li>Create a new password for your account.</li>
                <li>Confirm your new password.</li>
                <li>Submit the form to complete the password reset process.</li>
            </ol>
            
            <h2>Important Security Tips</h2>
            <ul>
                <li>Never share your password or OTP with anyone.</li>
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

    <script>
        function copyOTP() {
            var otpCode = document.getElementById("otpCode").innerText;
            navigator.clipboard.writeText(otpCode).then(function() {
                alert("OTP copied to clipboard!");
            }, function(err) {
                console.error('Could not copy text: ', err);
            });
        }
    </script>
</body>
</html>
    `
}