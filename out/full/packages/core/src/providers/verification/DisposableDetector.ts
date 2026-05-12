export class DisposableDetector {
  // In a real app, this would be fetched/cached from a db or external list
  private static readonly DISPOSABLE_DOMAINS = new Set([
    "mailinator.com",
    "10minutemail.com",
    "tempmail.com",
    "guerrillamail.com",
  ]);

  private static readonly ROLE_ACCOUNTS = new Set([
    "admin",
    "support",
    "info",
    "sales",
    "billing",
    "contact",
    "webmaster",
  ]);

  public static check(email: string): {
    isDisposable: boolean;
    isRoleAccount: boolean;
  } {
    const [local, domain] = email.toLowerCase().split("@");

    return {
      isDisposable: this.DISPOSABLE_DOMAINS.has(domain),
      isRoleAccount: this.ROLE_ACCOUNTS.has(local),
    };
  }
}
