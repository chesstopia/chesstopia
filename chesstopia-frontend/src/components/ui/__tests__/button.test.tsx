import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { Button } from "../button";

describe("Button", () => {
  it("renders its children as accessible label", () => {
    // ARRANGE
    render(<Button>Click me</Button>);

    // ACT & ASSERTIONS
    expect(screen.getByRole("button", { name: "Click me" })).toBeTruthy();
  });

  it("exposes the selected variant and size as data attributes", () => {
    // ARRANGE
    render(
      <Button variant="secondary" size="sm">
        Secondary
      </Button>,
    );

    // ACT
    const button = screen.getByRole("button", { name: "Secondary" });

    // ASSERTIONS
    expect(button.getAttribute("data-variant")).toBe("secondary");
    expect(button.getAttribute("data-size")).toBe("sm");
  });
});
