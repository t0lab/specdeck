import { describe, it, expect, beforeEach, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { ThemeToggle } from "@/components/theme-toggle";

// Mutable holder, hoisted with the mock so we can vary resolvedTheme per test.
const h = vi.hoisted(() => ({ setTheme: vi.fn(), resolvedTheme: "dark" }));
vi.mock("next-themes", () => ({
  useTheme: () => ({ setTheme: h.setTheme, resolvedTheme: h.resolvedTheme }),
}));

beforeEach(() => {
  h.setTheme.mockClear();
});

describe("ThemeToggle", () => {
  it("renders one toggle button", () => {
    h.resolvedTheme = "dark";
    render(<ThemeToggle />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("switches dark → light on click (no reload)", () => {
    h.resolvedTheme = "dark";
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button"));
    expect(h.setTheme).toHaveBeenCalledWith("light");
  });

  it("switches light → dark on click", () => {
    h.resolvedTheme = "light";
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button"));
    expect(h.setTheme).toHaveBeenCalledWith("dark");
  });
});
