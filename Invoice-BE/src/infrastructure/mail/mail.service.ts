import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import { Subject } from "src/domain/enums/emailSubject.enums";
import { PasswordResetInput } from "src/domain/types/passwordReset.inputType";
import { IMailerService } from "../../domain/abstracts";
import { onboardingInputAdmin, onboardingInputUser } from "../../domain/types/onboarding.inputType";
import { onboardingAdmin, onboardingUser, resetPassword, resetPasswordMobile } from "./templates";

@Injectable()
export class MailerService extends IMailerService {
    private transporter: nodemailer.Transporter
    constructor(
        private readonly configService: ConfigService
    ) {
        super();
        this.transporter = nodemailer.createTransport({
            host: this.configService.get<string>("mailer.host"),
            port: this.configService.get<number>("mailer.port"),
            secure: true,
            auth: {
                user: this.configService.get<string>("mailer.user"),
                pass: this.configService.get<string>("mailer.password"),
            },
        });
    }

    async passwordResetEmail(input: PasswordResetInput): Promise<void> {
        const mailOptions = {
            from: this.configService.get<string>('mailer.sender'),
            to: input.userEmail,
            subject: Subject.PASSWORD_RESET,
            html: resetPassword(input),
            headers: {
                "Content-Type": "text/html",
            },
        };

        await this.transporter.sendMail(mailOptions);
    }

    async passwordResetEmailMobile(input: PasswordResetInput): Promise<void> {
        const mailOptions = {
            from: this.configService.get<string>('mailer.sender'),
            to: input.userEmail,
            subject: Subject.PASSWORD_RESET,
            html: resetPasswordMobile(input),
            headers: {
                "Content-Type": "text/html",
            },
        };

        await this.transporter.sendMail(mailOptions);
    }

    async onboardingAdminEmail(input: onboardingInputAdmin): Promise<void> {
        const mailOptions = {
            from: this.configService.get<string>('mailer.sender'),
            to: input.userEmail,
            subject: Subject.User_INVITATION,
            html: onboardingAdmin(input),
            headers: {
                "Content-Type": "text/html",
            },
        };

        await this.transporter.sendMail(mailOptions);
    }

    
    async onboardingEmailUser(input2: onboardingInputUser): Promise<void> {
        const mailOptions = {
            from: this.configService.get<string>('mailer.sender'),
            to: input2.userEmail,
            subject: Subject.User_INVITATION,
            html: onboardingUser(input2),
            headers: {
                "Content-Type": "text/html",
            },
        };

        await this.transporter.sendMail(mailOptions);
    }
}
