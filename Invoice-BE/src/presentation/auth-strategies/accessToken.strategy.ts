import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export type JwtPayload = {
    _id: string,
    roles: string[] 
};

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(private readonly config: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: config.get<string>('jwt.access.secret'),
        });
    }

    validate(payload: JwtPayload) {
        console.log('Decoded JWT Payload:', payload); // Debugging
        return { 
            _id: payload._id, 
            roles: payload.roles || []  , 

        };
    }
    
}