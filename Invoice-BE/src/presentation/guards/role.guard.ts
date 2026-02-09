import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../domain/enums/role.enums';
import { ROLES_KEY } from '../decorators/role.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredRoles) return true; // If no roles are required, allow access

        const { user } = context.switchToHttp().getRequest();
        const normalizedRoles = (user.roles || []).map((role: string) => {
            const lowered = role.toLowerCase();
            if (lowered === 'superadmin') return Role.SUPERADMIN;
            return lowered;
        });

        return requiredRoles.some((role) => normalizedRoles.includes(role));
    }
}