import { describe, expect, it } from "vitest";

import {
  assertStateChangingRequest,
  getSafeCallbackUrl,
  guardRequestContentType,
  guardSameOriginRequest,
  guardStateChangingRequest,
  isSafeRelativeCallbackUrl,
  normalizeHttpOrigin,
  RequestGuardError,
} from "@/lib/auth/urls";

function headers(values: Record<string, string> = {}) {
  return new Headers(values);
}

describe("safe callback URLs", () => {
  it.each([
    "/app",
    "/app/jobs?status=OPEN",
    "/accept-invite?token=abc#continue",
  ])("accepts same-site relative callback %s", (value) => {
    expect(isSafeRelativeCallbackUrl(value)).toBe(true);
    expect(getSafeCallbackUrl(value)).toBe(value);
  });

  it.each([
    "https://evil.example/app",
    "//evil.example/app",
    "/\\evil.example/app",
    "/%2f%2fevil.example/app",
    "/%252f%252fevil.example/app",
    " app",
    "app",
    "/app\nset-cookie:bad",
  ])("rejects unsafe callback %s", (value) => {
    expect(isSafeRelativeCallbackUrl(value)).toBe(false);
    expect(getSafeCallbackUrl(value)).toBe("/app");
  });

  it("uses only a safe relative fallback", () => {
    expect(getSafeCallbackUrl(undefined, "/login")).toBe("/login");
    expect(getSafeCallbackUrl(undefined, "https://evil.example")).toBe("/app");
  });
});

describe("request guards", () => {
  it("normalizes trusted HTTP origins without paths", () => {
    expect(normalizeHttpOrigin("https://app.example.com/a/path")).toBe(
      "https://app.example.com",
    );
    expect(normalizeHttpOrigin("ftp://app.example.com")).toBeNull();
    expect(normalizeHttpOrigin("https://user:pass@app.example.com")).toBeNull();
  });

  it("accepts an exact normalized origin from an allow-list", () => {
    const result = guardSameOriginRequest(
      { headers: headers({ Origin: "https://app.example.com" }) },
      ["https://app.example.com/auth", "https://preview.example.com"],
    );

    expect(result).toEqual({ ok: true });
  });

  it("rejects a missing, opaque, malformed, or foreign origin", () => {
    expect(
      guardSameOriginRequest({ headers: headers() }, "https://app.example.com"),
    ).toMatchObject({ ok: false, code: "ORIGIN_REQUIRED", status: 403 });
    expect(
      guardSameOriginRequest(
        { headers: headers({ Origin: "null" }) },
        "https://app.example.com",
      ),
    ).toMatchObject({ ok: false, code: "ORIGIN_REQUIRED", status: 403 });
    expect(
      guardSameOriginRequest(
        { headers: headers({ Origin: "https://evil.example" }) },
        "https://app.example.com",
      ),
    ).toMatchObject({ ok: false, code: "ORIGIN_DENIED", status: 403 });
  });

  it("accepts allow-listed media types with normal parameters", () => {
    expect(
      guardRequestContentType({
        headers: headers({ "Content-Type": "application/json; charset=utf-8" }),
      }),
    ).toEqual({ ok: true });
    expect(
      guardRequestContentType({
        headers: headers({
          "Content-Type": "multipart/form-data; boundary=hiretrack",
        }),
      }),
    ).toEqual({ ok: true });
  });

  it("rejects missing and unsupported media types", () => {
    expect(guardRequestContentType({ headers: headers() })).toMatchObject({
      ok: false,
      code: "CONTENT_TYPE_REQUIRED",
      status: 415,
    });
    expect(
      guardRequestContentType({
        headers: headers({ "Content-Type": "text/plain" }),
      }),
    ).toMatchObject({
      ok: false,
      code: "CONTENT_TYPE_DENIED",
      status: 415,
    });
  });

  it("combines origin and content-type checks for mutations", () => {
    const request = {
      headers: headers({
        Origin: "https://app.example.com",
        "Content-Type": "application/x-www-form-urlencoded",
      }),
    };

    expect(
      guardStateChangingRequest(request, {
        allowedOrigins: "https://app.example.com",
      }),
    ).toEqual({ ok: true });
    expect(() =>
      assertStateChangingRequest(request, {
        allowedOrigins: "https://evil.example",
      }),
    ).toThrow(RequestGuardError);

    try {
      assertStateChangingRequest(request, {
        allowedOrigins: "https://evil.example",
      });
    } catch (error) {
      expect(error).toMatchObject({ code: "ORIGIN_DENIED", status: 403 });
    }
  });
});
