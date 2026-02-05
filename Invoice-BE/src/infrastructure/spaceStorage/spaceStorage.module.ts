import { Module } from "@nestjs/common";
import { ISpaceStorage } from "../../domain/abstracts/ISpaceStorage.service";
import { SpaceStorageService } from "./spaceStorage.service";

@Module({
    providers: [
        {
            provide: ISpaceStorage,
            useClass: SpaceStorageService
        }
    ],
    exports: [ISpaceStorage]
})
export class SpaceStorageModule { }