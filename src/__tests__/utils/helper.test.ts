import { describe, it, expect } from "vitest";
import { saltAndHashPassword } from "@/utils/helper";
import bcrypt from "bcryptjs";

describe("saltAndHashPassword", () => {
  it("returns a string", () => {
    const hash = saltAndHashPassword("mypassword");
    expect(typeof hash).toBe("string");
  });

  it("returns a valid bcrypt hash", () => {
    const hash = saltAndHashPassword("mypassword");
    expect(hash).toMatch(/^\$2[aby]\$/);
  });

  it("produces different hashes for the same password (salted)", () => {
    const hash1 = saltAndHashPassword("samepassword");
    const hash2 = saltAndHashPassword("samepassword");
    expect(hash1).not.toBe(hash2);
  });

  it("can be verified with bcrypt.compareSync", () => {
    const password = "testpassword123";
    const hash = saltAndHashPassword(password);
    expect(bcrypt.compareSync(password, hash)).toBe(true);
  });

  it("fails verification with wrong password", () => {
    const hash = saltAndHashPassword("correctpassword");
    expect(bcrypt.compareSync("wrongpassword", hash)).toBe(false);
  });

  it("uses 10 salt rounds", () => {
    const hash = saltAndHashPassword("test");
    const parts = hash.split("$");
    expect(parts[2]).toBe("10");
  });
});
