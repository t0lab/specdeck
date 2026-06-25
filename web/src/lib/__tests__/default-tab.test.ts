import { describe, it, expect } from "vitest";

import { defaultTab } from "@/lib/default-tab";

describe("defaultTab", () => {
  it("opens a Plan card on the Spec tab (review what's about to be built)", () => {
    expect(defaultTab("plan")).toBe("spec");
  });

  it("opens a Review card on the Checks tab (review what was built)", () => {
    expect(defaultTab("review")).toBe("checks");
  });

  it("defaults Backlog and Done to the Spec tab", () => {
    expect(defaultTab("backlog")).toBe("spec");
    expect(defaultTab("done")).toBe("spec");
  });
});
