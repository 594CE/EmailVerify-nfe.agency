export class ScoringEngine {
  public static calculate(results: {
    syntaxValid: boolean;
    isDisposable: boolean;
    isRoleAccount: boolean;
    hasMx: boolean;
    hasSpf: boolean;
    smtpStatus: string;
    isCatchAll: boolean;
  }): { score: number; status: string } {
    if (!results.syntaxValid) return { score: 0, status: "invalid" };
    if (!results.hasMx) return { score: 0, status: "invalid" };

    let score = 100;

    if (results.isDisposable) {
      return { score: 0, status: "disposable" };
    }

    if (results.smtpStatus === "invalid") {
      return { score: 0, status: "invalid" };
    }

    if (results.isRoleAccount) score -= 20;
    if (!results.hasSpf) score -= 10;
    if (results.isCatchAll) score -= 30;
    if (results.smtpStatus === "unknown" || results.smtpStatus === "risky")
      score -= 40;

    let finalStatus = "valid";
    if (results.isCatchAll) finalStatus = "catch-all";
    else if (score < 50) finalStatus = "risky";
    else if (results.smtpStatus === "unknown") finalStatus = "unknown";

    return { score: Math.max(0, score), status: finalStatus };
  }
}
