export abstract class IJwtService {
    abstract generateToken(data: Record<string, any>, tokenType: string): string;
    abstract verifyToken(token: string, tokenType: string): Record<string, any>;
    abstract verifyResetToken(token: string, tokenType: string): string;
}