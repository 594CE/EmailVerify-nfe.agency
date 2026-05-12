import { DisposableDetector } from "../providers/verification/DisposableDetector";

describe("DisposableDetector", () => {
  it("should detect disposable domains", () => {
    const result = DisposableDetector.check("user@mailinator.com");
    expect(result.isDisposable).toBe(true);
  });

  it("should detect role accounts", () => {
    const result = DisposableDetector.check("admin@example.com");
    expect(result.isRoleAccount).toBe(true);
  });

  it("should pass normal emails", () => {
    const result = DisposableDetector.check("john.doe@gmail.com");
    expect(result.isDisposable).toBe(false);
    expect(result.isRoleAccount).toBe(false);
  });
});
