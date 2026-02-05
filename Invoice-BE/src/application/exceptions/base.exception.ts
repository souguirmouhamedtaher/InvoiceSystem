import { HttpException, HttpStatus } from '@nestjs/common';

export class BaseException extends HttpException {
    constructor(message: string, status: HttpStatus) {
        super(message, status);
        // assign class name as error name
        this.name = this.constructor.name;

        // capturing the stack trace keeps the reference to your error class
        Error.captureStackTrace(this, this.constructor);
    }

    getTypeName(): string {
        return this.name;
    }

    static NotFound(message: string): BaseException {
        return new this(message, HttpStatus.NOT_FOUND);
    }

    static Unauthorized(message: string = 'Unauthorized access'): BaseException {
        return new this(message, HttpStatus.UNAUTHORIZED);
    }

    static Forbidden(message: string = 'Forbidden resource'): BaseException {
        return new this(message, HttpStatus.FORBIDDEN);
    }

    static BadRequest(message: string): BaseException {
        return new this(message, HttpStatus.BAD_REQUEST);
    }

    static Conflict(message: string): BaseException {
        return new this(message, HttpStatus.CONFLICT);
    }

    static UnprocessableEntity(message: string): BaseException {
        return new this(message, HttpStatus.UNPROCESSABLE_ENTITY);
    }

    static UnsupportedMediaType(message: string): BaseException {
        return new this(message, HttpStatus.UNSUPPORTED_MEDIA_TYPE);
    }
}