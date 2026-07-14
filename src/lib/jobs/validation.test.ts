import { describe, expect, it } from "vitest";
import { jobFormSchema, jobQuerySchema } from "@/lib/jobs/validation";

describe("job validation", () => {
  it("accepts a complete job brief and defaults draft status", () => {
    const result = jobFormSchema.parse({
      title: "Senior Engineer",
      department: "Product",
      location: "Remote",
      employmentType: "FULL_TIME",
      description: "Build resilient product experiences.",
      requirements: "TypeScript and testing experience.",
    });
    expect(result.status).toBe("DRAFT");
  });
  it("rejects blank required fields", () => {
    expect(
      jobFormSchema.safeParse({
        title: " ",
        department: "Product",
        location: "Remote",
        employmentType: "FULL_TIME",
        description: "x",
        requirements: "y",
      }).success,
    ).toBe(false);
  });
  it("clamps page size", () => {
    expect(jobQuerySchema.safeParse({ limit: 101 }).success).toBe(false);
    expect(jobQuerySchema.parse({}).limit).toBe(25);
  });
});
