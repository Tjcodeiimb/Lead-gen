import { describe, expect, it } from "vitest";
import { scoreQualification } from "../src/lib/claude/scoring";
import { mockQualifier } from "../src/lib/jobs/mocks";

describe("scoreQualification", () => {
  it("computes points from levels and applies the A-gate", () => {
    const q = mockQualifier({ fullName: "Asha Rao", title: "CEO", company: "Acme" });
    const s = scoreQualification(q, new Set(["E1", "E2", "E3", "INPUT:company", "INPUT:title"]));
    // C1 L3=15, C2 L3=15, C3 L3=11.25, C4 L3=7.5, C5 L2=5, C6 L3=7.5, C7 L2=5, C8 UNKNOWN=0
    expect(s.total).toBe(62.5); // C3 cites user input only, so L3 is capped to L2 (7.5 not 11.25)
    expect(s.tier).toBe("B");
    expect(s.primaryOffer).toBe("market_entry");
  });

  it("drops criteria that cite evidence ids that do not exist", () => {
    const q = mockQualifier({ fullName: "A", title: "CEO", company: "Acme" });
    const s = scoreQualification(q, new Set(["INPUT:company", "INPUT:title"]));
    expect(s.levels.C2_expansion_intent).toBe("UNKNOWN");
    expect(s.tier).toBe("NEEDS_RESEARCH");
  });

  it("caps user-input-only evidence at L2", () => {
    const q = mockQualifier({ fullName: "A", title: "CEO", company: "Acme" });
    q.criteria = q.criteria.map((c) => c.criterion === "C3_buyer_role" ? { ...c, level: "L4", evidence_ids: ["INPUT:title"] } : c);
    const s = scoreQualification(q, new Set(["E1", "E2", "E3", "INPUT:company", "INPUT:title"]));
    expect(s.levels.C3_buyer_role).toBe("L2");
  });

  it("knockouts force DQ", () => {
    const q = mockQualifier({ fullName: "A", title: "CEO", company: "Acme" });
    q.knockouts = [{ code: "competitor", evidence_ids: ["E1"] }];
    const s = scoreQualification(q, new Set(["E1", "E2", "E3"]));
    expect(s.tier).toBe("DQ");
  });
});
