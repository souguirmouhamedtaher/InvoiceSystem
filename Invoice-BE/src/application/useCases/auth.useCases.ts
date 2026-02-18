import { ConflictException, ForbiddenException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { IDataServices, IHashService, IJwtService, IMailerService } from "../../domain/abstracts";
import { User } from "../../domain/entities";
import { TokenType } from "../../domain/enums/tokenType.enum";
import { ResetPasswordMobileDto, SignUpDto, UpdateUserProfileDto, VerifPasswordMobileDto } from "../dtos";
import { ForgotPasswordDto } from "../dtos/auth/forgotPassword.dto";
import { LoginDto } from "../dtos/auth/login.dto";
import { ResetPasswordDto } from "../dtos/auth/resetPassword.dto";
import { Role } from "src/domain/enums/role.enums";
import { UserFactory } from "../factoryMapper";

@Injectable()
export class AuthUseCases {
    private logger: Logger = new Logger('AuthUseCase');

    constructor(
        private readonly dataService: IDataServices,
        private readonly hashService: IHashService,
        private readonly jwtService: IJwtService,
        private readonly mailerService: IMailerService,
        private readonly userFactory: UserFactory,
        private readonly configService: ConfigService
    ) { }

    //TODO check with the bussiness requirements auth methods
    async SignUp(userToCreate: SignUpDto): Promise<User> {
        const user = this.userFactory.createVisitUser(userToCreate);
        user.password = await this.hashService.hash(userToCreate.password);

        const userExists = await this.dataService.user.findByAttribute(
            "email",
            user.email
        );

        if (userExists) throw new ConflictException("User already exist.");    
    return await this.dataService.user.create(user); 

    }
    async login({ email, password }: LoginDto): Promise<Record<string, any>> {
        this.logger.log(`Attempting to find user with email: ${email.toLowerCase()}`);
        const user: User = await this.dataService.user.findByAttribute("email", email.toLowerCase());
    
        if (!user) {
            this.logger.error(`User not found with email: ${email.toLowerCase()}`);
            throw new NotFoundException("Check Your Credentials");
        }
        const isPwValid = await this.hashService.compare(
            password,
            user.password
        );
        if (!isPwValid) {
            this.logger.error("Password does not match");
            throw new NotFoundException("Check Your Credentials");
        }
    
        delete user.password;
        const userIdStr = user._id?.toString?.() ?? String(user._id);
        const tokens = await this.getTokens(userIdStr, user.role);
        await this.updateRefreshToken(user._id, tokens.refreshToken);
        this.logger.log("Login operation success");
        return tokens;
    }
    

    async logout(_id: string) {
        await this.dataService.user.update(_id, { refreshToken: null })
        return 'Logout Success';
    }

    async loadCurrentUserDetails(_id: string): Promise<User | null> {
        const user = await this.dataService.user.get(_id);
    
        return { ...user["_doc"] };
    }
    
    

    async refreshTokens(_id: string, refreshToken: string) {
        const user = await this.dataService.user.get(_id);
        if (!user || !user.refreshToken)
            throw new ForbiddenException('Access Denied');

        const refreshTokenMatches = await this.hashService.compare(
            refreshToken,
            user.refreshToken,
        );

        if (!refreshTokenMatches) throw new ForbiddenException('Access Denied');
        const tokens = await this.getTokens(user._id, user.role );
        await this.updateRefreshToken(user._id, tokens.refreshToken);
        return tokens;
    }

    async forgotPassword({ email,resetPassLink }: ForgotPasswordDto): Promise<string> {
        const user: User = await this.dataService.user.findByAttribute(
            "email",
            email.toLowerCase()
        );
        if (!user) throw new NotFoundException("User not found.");
        const resetToken = this.jwtService.generateToken({ userId: user._id.toString() }, TokenType.RESET);
        const link = `${resetPassLink}?token=${resetToken}`;
        await this.mailerService.passwordResetEmail(
            {
                userName: user.firstName,
                userEmail: user.email,
                resetPasswordUrl: link
            }
        );
        return "A link has been sent to your email";
    }

    async resetPassword({ newPassword, token }: ResetPasswordDto): Promise<string> {
        const userId = this.jwtService.verifyResetToken(token, TokenType.RESET);
        if (!userId) throw new NotFoundException("Invalid or expired token");

        const user = await this.dataService.user.get(userId);
        if (!user) throw new NotFoundException("User not found");

        const hashedNewPassword = await this.hashService.hash(
            newPassword
        );
        await this.dataService.user.update(userId, {
            password:hashedNewPassword,
        });

        return "Password updated successfully.";
    }

    async forgotPasswordMobile({ email }: ForgotPasswordDto): Promise<string> {
        const user: User = await this.dataService.user.findByAttribute(
            "email",
            email.toLowerCase()
        );
        if (!user) throw new NotFoundException("User not found.");

        const OTP = String(Math.floor(Math.random() * 9000) + 1000);

        const expiration = new Date();
        expiration.setMinutes(expiration.getMinutes() + 10)

        await this.dataService.user.update(user._id, { otp: OTP, otpExp: expiration })

        await this.mailerService.passwordResetEmailMobile(
            {
                userName: user.firstName,
                userEmail: user.email,
                resetPasswordUrl: OTP
            }
        );
        return "A link has been sent to your email";
    }

    async resetPasswordMobile({ email, otp, newPassword }: ResetPasswordMobileDto): Promise<string> {
        const user = await this.dataService.user.findByAttribute("email", email.toLowerCase());

        if (!user) throw new NotFoundException("Check Your Email");

        if (user.otpExp < new Date()) throw new NotFoundException("OTP has been Expired");

        if (user.otp !== otp) throw new NotFoundException("Check your OTP again");

        const hashedNewPassword = await this.hashService.hash(
            newPassword
        );

        await this.dataService.user.update(user._id, {
            password:hashedNewPassword,
        });

        return "Password updated successfully.";
    }
    async otpVerificationMobile({ email, otp }: VerifPasswordMobileDto): Promise<boolean> {
        const user = await this.dataService.user.findByAttribute("email", email.toLowerCase());
        if (!user) throw new NotFoundException("Check Your Email");
        if (user.otpExp < new Date()) throw new NotFoundException("OTP has been Expired");
        if (user.otp !== otp) throw new NotFoundException("Check your OTP again");

        return true;
    }

    async updatePassword(
        id: string,
        oldPassword: string,
        newPassword: string
    ): Promise<string> {
        const user = await this.dataService.user.get(id);
        if (!user) {
            throw new Error("User not found.");
        }
        const isValid = await this.hashService.compare(
            oldPassword,
            user.password
        );
        if (!isValid) {
            throw new Error("Invalid Password!.");
        }
       const newPass = await this.hashService.hash(
            newPassword
        );
        await this.dataService.user.update(id, {password:newPass});
        return "password changed succefully";
    }

    async updateProfile(id: string, payload: UpdateUserProfileDto): Promise<User> {
        const user = await this.dataService.user.get(id);
        if (!user) {
            throw new NotFoundException("User not found.");
        }

        return this.dataService.user.update(id, {
            phoneNumber: payload.phone,
            updatedAt: new Date(),
        });
    }

    /**
     *      Utils Methods
     */

    async updateRefreshToken(_id: any, refreshToken: string) {
        const hashedRefreshToken = await this.hashService.hash(refreshToken);

        await this.dataService.user.update(_id, {
            refreshToken: hashedRefreshToken,
        });
    }

    async getTokens(userId: string, roles:Role[]) {
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.generateToken(
                {
                    _id: userId,
                    roles,
                },
                TokenType.ACCESS
            ),
            this.jwtService.generateToken(
                {
                    sub: userId,
                },
                TokenType.REFRESH
            ),
        ]);

        return {
            accessToken,
            refreshToken,
        };
    }

}