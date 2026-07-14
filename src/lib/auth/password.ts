import { argon2id, hash, needsRehash, verify } from "argon2";

export const PASSWORD_MIN_CHARACTERS = 12;
export const PASSWORD_MAX_BYTES = 1_024;

export const ARGON2ID_OPTIONS = {
  type: argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

/**
 * A public, non-secret hash used to keep missing-account password checks on the
 * same Argon2id code path as real accounts. It must never match a real user.
 */
export const DUMMY_PASSWORD_HASH =
  "$argon2id$v=19$m=19456,t=2,p=1$aGlyZXRyYWNrLWR1bW15IQ$/HbD0/wQUzVXIW8T8khBd1zjljsqi9jsdCWc0yRyTIk";

const DUMMY_PASSWORD_VALUE = "hiretrack-dummy-password-never-valid";

export type PasswordPolicyIssue = Readonly<{
  code: "PASSWORD_TOO_SHORT" | "PASSWORD_TOO_LONG";
  message: string;
}>;

export class PasswordPolicyError extends Error {
  readonly code: PasswordPolicyIssue["code"];

  constructor(issue: PasswordPolicyIssue) {
    super(issue.message);
    this.name = "PasswordPolicyError";
    this.code = issue.code;
  }
}

export function passwordCharacterLength(password: string): number {
  return Array.from(password).length;
}

export function passwordByteLength(password: string): number {
  return new TextEncoder().encode(password).byteLength;
}

export function getPasswordPolicyIssue(
  password: string,
): PasswordPolicyIssue | null {
  if (passwordCharacterLength(password) < PASSWORD_MIN_CHARACTERS) {
    return {
      code: "PASSWORD_TOO_SHORT",
      message: `Password must contain at least ${PASSWORD_MIN_CHARACTERS} characters`,
    };
  }

  if (passwordByteLength(password) > PASSWORD_MAX_BYTES) {
    return {
      code: "PASSWORD_TOO_LONG",
      message: `Password must be at most ${PASSWORD_MAX_BYTES} UTF-8 bytes`,
    };
  }

  return null;
}

export function isPasswordPolicyCompliant(password: string): boolean {
  return getPasswordPolicyIssue(password) === null;
}

export function assertPasswordPolicy(password: string): void {
  const issue = getPasswordPolicyIssue(password);

  if (issue) {
    throw new PasswordPolicyError(issue);
  }
}

export async function hashPassword(password: string): Promise<string> {
  assertPasswordPolicy(password);
  return hash(password, ARGON2ID_OPTIONS);
}

function isPlausibleArgon2idHash(value: string | null | undefined) {
  return Boolean(value?.startsWith("$argon2id$"));
}

/**
 * Verifies exactly one safe Argon2id path for normal missing-account and
 * wrong-password cases. Oversized attacker input is replaced before reaching
 * the native Argon2 implementation, while a dummy verification still occurs.
 */
export async function verifyPassword(
  storedHash: string | null | undefined,
  candidatePassword: string,
): Promise<boolean> {
  const candidateWithinLimit =
    passwordByteLength(candidatePassword) <= PASSWORD_MAX_BYTES;
  const safeCandidate = candidateWithinLimit
    ? candidatePassword
    : DUMMY_PASSWORD_VALUE;
  const hasStoredHash = isPlausibleArgon2idHash(storedHash);
  const hashToVerify = hasStoredHash ? storedHash : DUMMY_PASSWORD_HASH;

  try {
    const matches = await verify(
      hashToVerify ?? DUMMY_PASSWORD_HASH,
      safeCandidate,
    );
    return Boolean(hasStoredHash && candidateWithinLimit && matches);
  } catch {
    // A corrupt stored digest is treated as a failed login. Perform the dummy
    // path before returning so malformed database state does not become a
    // conspicuously fast authentication response.
    await verify(DUMMY_PASSWORD_HASH, DUMMY_PASSWORD_VALUE);
    return false;
  }
}

export function passwordHashNeedsRehash(storedHash: string): boolean {
  try {
    return needsRehash(storedHash, ARGON2ID_OPTIONS);
  } catch {
    return true;
  }
}
