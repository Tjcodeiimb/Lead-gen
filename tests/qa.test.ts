import { describe, expect, it } from "vitest";
import { countSentences, emailCore, qaFlags } from "@/lib/jobs/copy";
import { mockCopy } from "@/lib/jobs/mocks";

const ids = new Set(["E1", "E2"]);

describe("cold email QA", () => {
  it("passes the mock email with no flags", () => {
    const c = mockCopy({ firstName: "Asha", company: "Acme", market: "UAE" });
    expect(qaFlags(c.email.subject, c.email.body, c.linkedin_note, c.facts_used, ids)).toEqual([]);
    expect(countSentences(emailCore(c.email.body))).toBeLessThanOrEqual(5);
  });

  it("flags long emails, two asks, preambles and bad subjects", () => {
    const body = "Hi Asha,\n\nI hope you are well. One. Two. Three. Four. Can we talk? Or want a deck?\n\nShardul Singh\n\nIf this isn't relevant, reply 'no' and I won't contact you again.";
    const f = qaFlags("Quick question: UAE?", body, "x", [{ evidence_id: "E1" }], ids);
    expect(f).toEqual(expect.arrayContaining(["over_5_sentences", "more_than_one_ask", "preamble_opener", "subject_has_colon_or_question", "subject_not_lowercase"]));
  });

  it("flags drafts that cite no fact", () => {
    expect(qaFlags("uae launch", "Hi\n\nHello.\n\nShardul\n\nreply 'no'", "x", [], ids)).toContain("no_cited_fact");
  });
});
