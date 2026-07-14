import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  EmptyState,
  ErrorState,
  SuccessBanner,
} from "@/components/async-states";
import { Button } from "@/components/ui/button";

describe("async state primitives", () => {
  it("gives an empty state a clear primary action", () => {
    render(
      <EmptyState
        title="No jobs yet"
        description="Create the first role to begin hiring."
        action={<Button>Create a job</Button>}
      />,
    );

    expect(screen.getByRole("heading", { name: "No jobs yet" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Create a job" })).toBeEnabled();
  });

  it("announces actionable errors", () => {
    render(<ErrorState description="Check your connection and retry." />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Check your connection and retry.",
    );
  });

  it("announces success without stealing focus", () => {
    render(
      <SuccessBanner
        title="Job created"
        description="The role is now in draft."
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Job created");
  });
});
