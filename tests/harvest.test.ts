import { describe, expect, it } from "vitest";
import { harvestFindings } from "../src/lib/jobs/qualify";

const cite = (url: string, text: string) => ({ type: "web_search_result_location", url, title: "t", cited_text: text, encrypted_index: "x" });

describe("harvestFindings", () => {
  it("joins a FINDING prefix block with the cited sentence block that follows it", () => {
    const content = [
      { type: "server_tool_use", id: "1", name: "web_search", input: {} },
      { type: "text", text: "ENTITY: CONFIRMED | Acme | acme.com | IN\nFINDING [C2,C4] (date: 2026-08-15): " },
      { type: "text", text: "Acme launched on Noon in the UAE.", citations: [cite("https://news.example/a", "Acme launched on Noon")] },
      { type: "text", text: "\nFINDING [C5] (date: undated): " },
      { type: "text", text: "Acme has no public revenue figure." },
      { type: "text", text: "\nGAPS: revenue" },
    ];
    const rows = harvestFindings(content);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ evidence_id: "E1", criteria: ["C2", "C4"], published_date: "2026-08-15", url: "https://news.example/a" });
    expect(rows[0].claim).toBe("Acme launched on Noon in the UAE.");
  });

  it("also works when prefix and citation are in the same block", () => {
    const rows = harvestFindings([{ type: "text", text: "FINDING [C1] (date: 2026-01): Acme is in Pune.", citations: [cite("https://acme.com/about", "Pune")] }]);
    expect(rows[0].criteria).toEqual(["C1"]);
  });
});
