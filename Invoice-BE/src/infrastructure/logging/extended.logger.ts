import { ConsoleLogger, ConsoleLoggerOptions, Injectable } from "@nestjs/common";

@Injectable()
export class MyLogger extends ConsoleLogger {
    constructor() {
        const options: ConsoleLoggerOptions = {
            timestamp: true
        };
        super(undefined, options);
    }
}