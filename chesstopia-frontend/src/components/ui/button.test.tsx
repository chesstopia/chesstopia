import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { Button } from "./button";

describe("Button", () => {
  it("renders its children as accessible label", () => {
    render(<Button>Click me</Button>);

    expect(screen.getByRole("button", { name: "Click me" })).toBeTruthy();
  });

  it("exposes the selected variant and size as data attributes", () => {
    render(
      <Button variant="secondary" size="sm">
        Secondary
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Secondary" });

    expect(button.getAttribute("data-variant")).toBe("secondary");
    expect(button.getAttribute("data-size")).toBe("sm");
  });
});
