export abstract class ISpaceStorage {
    abstract getFile(fileid: string): Promise<string>;
    abstract uploadFile(file: Express.Multer.File, fileid: string): Promise<string>;
    abstract deleteFile(fileid: string): Promise<string>;
}