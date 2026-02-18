import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as sgMail from '@sendgrid/mail';
import * as nodemailer from "nodemailer";
import { Subject } from "src/domain/enums/emailSubject.enums";
import { PasswordResetInput } from "src/domain/types/passwordReset.inputType";
import { IMailerService } from "../../domain/abstracts";
import { onboardingInputAdmin, onboardingInputUser } from "../../domain/types/onboarding.inputType";
import { onboardingAdmin, onboardingUser, resetPassword, resetPasswordMobile } from "./templates";

@Injectable()
export class MailerService extends IMailerService {
    private readonly logger = new Logger(MailerService.name);
    private transporter: nodemailer.Transporter | null = null;
    private useSendgrid = false;
    constructor(
        private readonly configService: ConfigService
    ) {
        super();
        const sendgridApiKey = this.configService.get<string>('mailer.sendgridApiKey');

        if (sendgridApiKey) {
            this.useSendgrid = true;
            sgMail.setApiKey(sendgridApiKey);
            this.logger.log('Mailer initialized with SendGrid provider.');
        } else {
            this.transporter = nodemailer.createTransport({
                host: this.configService.get<string>("mailer.host"),
                port: this.configService.get<number>("mailer.port"),
                secure: true,
                auth: {
                    user: this.configService.get<string>("mailer.user"),
                    pass: this.configService.get<string>("mailer.password"),
                },
            });
            this.logger.log('Mailer initialized with SMTP provider.');
        }
    }

    async passwordResetEmail(input: PasswordResetInput): Promise<void> {
        await this.sendMail({
            to: input.userEmail,
            subject: Subject.PASSWORD_RESET,
            html: resetPassword(input),
        });
    }

    async passwordResetEmailMobile(input: PasswordResetInput): Promise<void> {
        await this.sendMail({
            to: input.userEmail,
            subject: Subject.PASSWORD_RESET,
            html: resetPasswordMobile(input),
        });
    }

    async onboardingAdminEmail(input: onboardingInputAdmin): Promise<void> {
        await this.sendMail({
            to: input.userEmail,
            subject: Subject.User_INVITATION,
            html: onboardingAdmin(input),
        });
    }

    
    async onboardingEmailUser(input2: onboardingInputUser): Promise<void> {
        await this.sendMail({
            to: input2.userEmail,
            subject: Subject.User_INVITATION,
            html: onboardingUser(input2),
        });
    }

    private async sendMail({ to, subject, html }: { to: string; subject: string; html: string }): Promise<void> {
        const from = this.configService.get<string>('mailer.sender');
        if (!from) {
            this.logger.warn('MAILER_SENDER is not configured. Skipping email.');
            return;
        }

        if (this.useSendgrid) {
            await sgMail.send({
                to,
                from,
                subject,
                html,
            });
            return;
        }

        if (!this.transporter) {
            this.logger.warn('Mailer transporter is not configured. Skipping email.');
            return;
        }

        await this.transporter.sendMail({
            from,
            to,
            subject,
            html,
            headers: {
                "Content-Type": "text/html",
            },
        });
    }
}
