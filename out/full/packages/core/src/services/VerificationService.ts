import { SyntaxValidator } from "../providers/verification/SyntaxValidator";
import { DisposableDetector } from "../providers/verification/DisposableDetector";
import { DNSChecker } from "../providers/verification/DNSChecker";
import { SMTPVerifier } from "../providers/verification/SMTPVerifier";
import { ScoringEngine } from "../providers/verification/ScoringEngine";

export class VerificationService {
  public static async verifyEmail(email: string) {
    const syntaxValid = SyntaxValidator.validate(email);
    if (!syntaxValid) {
      return ScoringEngine.calculate({
        syntaxValid,
        isDisposable: false,
        isRoleAccount: false,
        hasMx: false,
        hasSpf: false,
        smtpStatus: "unknown",
        isCatchAll: false,
      });
    }

    const { isDisposable, isRoleAccount } = DisposableDetector.check(email);
    const domain = email.split("@")[1];

    const { hasMx, mxRecords, hasSpf } = await DNSChecker.check(domain);

    if (!hasMx) {
      return ScoringEngine.calculate({
        syntaxValid,
        isDisposable,
        isRoleAccount,
        hasMx,
        hasSpf,
        smtpStatus: "unknown",
        isCatchAll: false,
      });
    }

    const primaryMx = mxRecords[0].exchange;
    const { status: smtpStatus, isCatchAll } = await SMTPVerifier.verify(
      email,
      primaryMx,
    );

    return ScoringEngine.calculate({
      syntaxValid,
      isDisposable,
      isRoleAccount,
      hasMx,
      hasSpf,
      smtpStatus,
      isCatchAll,
    });
  }
}
