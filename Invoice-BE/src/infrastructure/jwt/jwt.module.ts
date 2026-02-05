import { Module } from "@nestjs/common";
import { IJwtService } from "../../domain/abstracts";
import { JwtService } from "./jwt.service";

@Module({
    providers: [
        {
            provide: IJwtService,
            useClass: JwtService
        }
    ],
    exports: [IJwtService]
})
export class JwtModule { }