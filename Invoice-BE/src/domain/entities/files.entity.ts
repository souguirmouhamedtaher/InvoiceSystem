import { FilesType } from '../enums/filesType.enums';
import { Base } from './base.entity';

export class Files extends Base {
    fileName: string;
    uploadedBy: any;
    fileUrl: string;
    fileRelatedType: FilesType;
}
