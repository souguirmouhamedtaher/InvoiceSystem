import { Module } from "@nestjs/common";
import { IMailerService } from "../../domain/abstracts";
import { MailerService } from "./mail.service";

@Module({
    providers: [
        {
            provide: IMailerService,
            useClass: MailerService
        }
    ],
    exports: [IMailerService]
})
export class MailMdoule { }