import { onboardingInputUser, onboardingInputAdmin } from "../types/onboarding.inputType";
import { PasswordResetInput } from "../types/passwordReset.inputType";

export abstract class IMailerService {
    abstract passwordResetEmail(input: PasswordResetInput): void;
    abstract passwordResetEmailMobile(input: PasswordResetInput): void;
    abstract onboardingAdminEmail(input: onboardingInputAdmin): void;
    abstract onboardingEmailUser(input: onboardingInputUser): void;

}
