export abstract class IHashService {
    abstract hash(password: string): Promise<string>;
    abstract compare(plain: string, hashed: string): Promise<boolean>;
}
