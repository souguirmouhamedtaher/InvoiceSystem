import {
    Body,
    Controller,
    Get,
    Patch,
    Post,
    Query,
    Req,
    UseGuards
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ResetPasswordMobileDto, SignUpDto, UpdateUserPasswordDto, UpdateUserProfileDto, VerifPasswordMobileDto } from '../../application/dtos';
import { ForgotPasswordDto } from '../../application/dtos/auth/forgotPassword.dto';
import { LoginDto } from '../../application/dtos/auth/login.dto';
import { ResetPasswordDto } from '../../application/dtos/auth/resetPassword.dto';
import { AuthUseCases } from '../../application/useCases/auth.useCases';
import { User } from '../../infrastructure/database/mongo/models';
import { UserDecorator } from '../decorators/getUser.decorator';
import { ResponseMessage } from '../decorators/response-message.decorator';
import { AccessTokenGuard } from '../guards/accessToken.guard';
import { RefreshTokenGuard } from '../guards/refreshToken.guard';


@ApiTags('Auth|auth')
@Controller('auth')
export class AuthController {
    constructor(
        private authUseCases: AuthUseCases
    ) { }

    @Post('SignUp')
    @ResponseMessage('Successfully created!')
    async SignUp(@Body() payload: SignUpDto,): Promise<User> {
          return this.authUseCases.SignUp(payload);
      }
    
    @Post('login')
    @ResponseMessage('Successfully Logged in!')
    async login(@Body() payload: LoginDto): Promise<Record<string, string>> {
        return await this.authUseCases.login(payload);
    }

    @Post('logout')
    async logout(@Body() body?: { userId?: string }): Promise<string> {
        // Allow logout even without valid token - just return success
        if (body?.userId) {
            return await this.authUseCases.logout(body.userId);
        }
        return 'Logged out successfully';
    }

    @UseGuards(AccessTokenGuard)
    @Get('loadme')
    @ApiBearerAuth()
    async loadme(@UserDecorator() user): Promise<User> {
        return await this.authUseCases.loadCurrentUserDetails(user._id);
    }

    @UseGuards(RefreshTokenGuard)
    @Post('refresh')
    @ApiBearerAuth()
    async refresh(@Req() req): Promise<Record<string, string>> {
        const { sub, refreshToken } = req.user;
        return await this.authUseCases.refreshTokens(sub, refreshToken);
    }

    @Post('forgotPassword')
    async forgotPassword(@Body() payload: ForgotPasswordDto): Promise<string> {
        return this.authUseCases.forgotPassword(payload);
    }

    @Post('resetPassword')
    async resetPassword(@Query('token') token: string, @Body() payload: ResetPasswordDto): Promise<string> {
        return this.authUseCases.resetPassword({ token, ...payload });
    }

    @Post('mobile/forgotPassword')
    async forgotPasswordMobile(@Body() payload: ForgotPasswordDto): Promise<string> {
        return this.authUseCases.forgotPasswordMobile(payload);
    }

    @Post('mobile/resetPassword')
    async resetPasswordMobile(@Body() payload: ResetPasswordMobileDto): Promise<string> {
        return this.authUseCases.resetPasswordMobile(payload);
    }

    @Post('mobile/otpVerification')
    async otpVerificationMobile(@Body() payload: VerifPasswordMobileDto): Promise<boolean> {
        return this.authUseCases.otpVerificationMobile(payload);
    }

    @UseGuards(AccessTokenGuard)
    @Post('updatePassword')
    @ApiBearerAuth()
    async updatePassword(@UserDecorator() user, @Body() { currentPassword, newPassword }: UpdateUserPasswordDto): Promise<string> {
        return this.authUseCases.updatePassword(user._id, currentPassword, newPassword);
    }

    @UseGuards(AccessTokenGuard)
    @Patch('profile')
    @ApiBearerAuth()
    async updateProfile(@UserDecorator() user, @Body() payload: UpdateUserProfileDto): Promise<User> {
        return this.authUseCases.updateProfile(user._id, payload);
    }


}
