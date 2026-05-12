export class SyntaxValidator {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  public static validate(email: string): boolean {
    if (!email || email.length > 254) return false;
    return this.EMAIL_REGEX.test(email);
  }
}
