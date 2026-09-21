import { describe, expect, it } from "vitest";

import { listCopyKeys, translate } from "@/lib/i18n";

describe("JaneQ copy tables", () => {
  it("keeps English and Thai keys aligned", () => {
    expect(listCopyKeys("th").sort()).toEqual(listCopyKeys("en").sort());
  });

  it("uses direct Thai PromptPay errors instead of polite filler", () => {
    expect(translate("th", "errorPromptpayIdRequired")).toBe(
      "ใส่เบอร์หรือเลขพร้อมเพย์",
    );
    expect(translate("th", "emptyPreview")).toBe("กรอกข้อมูลเพื่อสร้าง QR");
  });
});
