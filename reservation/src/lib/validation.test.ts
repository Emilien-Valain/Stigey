import { describe, expect, it } from "vitest";
import { emailValide } from "./validation";

describe("emailValide", () => {
  it("accepte un email correctement formé", () => {
    expect(emailValide("awa@exemple.fr")).toBe(true);
    expect(emailValide("  awa@exemple.fr  ")).toBe(true);
  });

  it("rejette les formats invalides", () => {
    expect(emailValide("")).toBe(false);
    expect(emailValide("awa")).toBe(false);
    expect(emailValide("awa@")).toBe(false);
    expect(emailValide("awa@exemple")).toBe(false);
    expect(emailValide("@exemple.fr")).toBe(false);
    expect(emailValide("awa exemple@fr.fr")).toBe(false);
  });
});
