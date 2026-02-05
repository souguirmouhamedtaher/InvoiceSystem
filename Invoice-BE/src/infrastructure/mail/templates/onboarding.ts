import { onboardingInputAdmin, onboardingInputUser } from "src/domain/types/onboarding.inputType"

/**
 * 
 * @param userName,
 * @param temporaryPassword,
 * @param supportEmail,
 * @param supportPhoneNumber
 * @returns
 *
 */
export const onboardingAdmin = function (
    {
        userName,
        temporaryPassword,
    }: onboardingInputAdmin
) {
    return ` <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to ${userName}</title>
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
            <h1>Welcome to ${userName}!</h1>
        </div>
        <div class="content">
            <p>Dear ${userName},</p>
            <p>We are excited to have you join ${userName}! Your  account has been successfully created, and we can't wait to see you on the field.</p>
            
            <h2>Your Temporary Password</h2>
            <p>To get started, please use the following temporary password to log in to your user account:</p>
            <p><strong>Password:</strong> ${temporaryPassword}</p>
            
            <h2>Important: Changing Your Password</h2>
            <p>For security reasons, we require all new users to change their temporary password upon their first login. Here’s how you can do it:</p>
            <ol>
                <li>Visit our website at <a href="${process.env.FRONTEND_URL}</a>.</li>
                <li>Click on the "Login" button.</li>
                <li>Enter your email address and the temporary password provided above.</li>
                <li>Once logged in, navigate to your account settings.</li>
                <li>Select the option to change your password.</li>
                <li>Enter your new password and confirm it.</li>
            </ol>
            <p>Please ensure that your new password is strong and unique, containing a mix of letters, numbers, and special characters.</p>
            
            <h2>Next Steps</h2>
            <p>After changing your password, you can start exploring all the features and services we offer. Here are a few things you might want to do:</p>
            <ul>
                <li>Complete your user profile information.</li>
                <li>Review the upcoming events and schedules.</li>
                <li>Reach out to our support team if you have any questions or need assistance.</li>
            </ul>
            
            <h2>Contact Us</h2>
            <p>If you encounter any issues or have any questions, please do not hesitate to contact our support team at <a href="mailto:${process.env.MAILER_SENDER}">${process.env.MAILER_SENDER}</a>. We are here to help you every step of the way.</p>
            
            <p>Once again, welcome to ${userName}! We look forward to seeing you on the field.</p>
        </div>
        <div class="footer">
            <p>Best regards, <br> 
            invoice</p>
        </div>
    </div>
</body>
</html>`
}




export const onboardingUser = function (
    {
        userName,
        temporaryPassword,
    }: onboardingInputUser
) {
    return ` <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to ${userName}</title>
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
            <h1>Welcome to ${userName}!</h1>
        </div>
        <div class="content">
            <p>Dear ${userName},</p>            
            <h2>Your Temporary Password</h2>
            <p>To get started, please use the following temporary password to log in to your user account:</p>
            <p><strong>Password:</strong> ${temporaryPassword}</p>
            
            <h2>Important: Changing Your Password</h2>
            <p>For security reasons, we require all new users to change their temporary password upon their first login. Here’s how you can do it:</p>
            <ol>
                <li>Visit our website at <a href="${process.env.FRONTEND_URL}</a>.</li>
                <li>Click on the "Login" button.</li>
                <li>Enter your email address and the temporary password provided above.</li>
                <li>Once logged in, navigate to your account settings.</li>
                <li>Select the option to change your password.</li>
                <li>Enter your new password and confirm it.</li>
            </ol>
            <p>Please ensure that your new password is strong and unique, containing a mix of letters, numbers, and special characters.</p>
            
            <h2>Next Steps</h2>
            <p>After changing your password, you can start exploring all the features and services we offer. Here are a few things you might want to do:</p>
            <ul>
                <li>Complete your user profile information.</li>
                <li>Review the upcoming events and schedules.</li>
                <li>Reach out to our support team if you have any questions or need assistance.</li>
            </ul>
            
            <h2>Contact Us</h2>
            <p>If you encounter any issues or have any questions, please do not hesitate to contact our support team at <a href="mailto:${process.env.MAILER_SENDER}">${process.env.MAILER_SENDER}</a>. We are here to help you every step of the way.</p>
            
        </div>
        <div class="footer">
            <p>Best regards, <br> 
            islamiqueApp</p>
        </div>
    </div>
</body>
</html>`
}