import { SyntaxValidator } from "../providers/verification/SyntaxValidator";

describe("SyntaxValidator", () => {
  it("should return true for valid emails", () => {
    expect(SyntaxValidator.validate("test@example.com")).toBe(true);
    expect(SyntaxValidator.validate("user.name+tag@example.co.uk")).toBe(true);
  });

  it("should return false for invalid emails", () => {
    expect(SyntaxValidator.validate("test@.com")).toBe(false);
    expect(SyntaxValidator.validate("test@example")).toBe(false);
    expect(SyntaxValidator.validate("test example.com")).toBe(false);
    expect(SyntaxValidator.validate("")).toBe(false);
  });
});
