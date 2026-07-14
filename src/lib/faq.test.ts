import { describe, expect, it } from "vitest";

import { createFaqJsonLd, faqs } from "@/lib/faq";

describe("FAQ structured data", () => {
  it("is generated from the same questions and answers rendered by the UI", () => {
    const data = createFaqJsonLd();

    expect(data.mainEntity).toHaveLength(faqs.length);
    expect(data.mainEntity[0]).toMatchObject({
      name: faqs[0].question,
      acceptedAnswer: { text: faqs[0].answer },
    });
  });
});
