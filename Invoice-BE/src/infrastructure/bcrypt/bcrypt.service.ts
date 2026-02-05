import { Injectable } from "@nestjs/common";
import { compare, hash } from "bcryptjs";
import { IHashService } from "src/domain/abstracts";


@Injectable()
export class BcryptService implements IHashService {
    async hash(password: string): Promise<string> {
        const saltRounds = 10;
        return await hash(password, saltRounds);
    }

    async compare(
        plainPassword: string,
        hashedPassword: string
    ): Promise<boolean> {
        return await compare(plainPassword, hashedPassword);
    }

}