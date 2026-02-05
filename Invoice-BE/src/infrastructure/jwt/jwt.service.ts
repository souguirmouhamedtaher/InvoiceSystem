import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtPayload, sign, verify } from "jsonwebtoken";
import { IJwtService } from "../../domain/abstracts";

@Injectable()
export class JwtService implements IJwtService {
    constructor(private readonly configService: ConfigService) { }

    generateToken(data: Record<string, any>, tokenType: string) {

        return sign(
            data,
            this.configService.get<string>(`jwt.${tokenType}.secret`),
            {
                expiresIn: this.configService.get<string>(`jwt.${tokenType}.expiresIn`),
            });
    }

    verifyToken(token: string, tokenType: string): Record<string, any> {
        return verify(token, this.configService.get<string>(`jwt.${tokenType}.secret`)) as Record<string, any>;
    }

    verifyResetToken(token: string, tokenType: string): string | null {
        try {
            const decoded = verify(token, this.configService.get<string>(`jwt.${tokenType}.secret`)) as JwtPayload;
            return decoded.userId || decoded.roles;
        } catch (error) {
            return null;
        }
    }
}