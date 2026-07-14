import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Brand } from "@/components/brand";

describe("Brand", () => {
  it("links to the product home with an accessible name", () => {
    render(<Brand />);

    expect(
      screen.getByRole("link", { name: "HireTrack Lite home" }),
    ).toHaveAttribute("href", "/");
    expect(screen.getByText("HireTrack Lite")).toBeVisible();
  });

  it("can render the compact brand mark without duplicated visible text", () => {
    render(<Brand compact />);

    expect(screen.queryByText("HireTrack Lite")).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "HireTrack Lite home" }),
    ).toBeVisible();
  });
});
