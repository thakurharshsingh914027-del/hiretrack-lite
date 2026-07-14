export const faqs = [
  {
    question: "Who is HireTrack Lite for?",
    answer:
      "It is designed for small companies and recruiting teams that need a reliable applicant pipeline without enterprise ATS complexity.",
  },
  {
    question: "Can viewers change hiring data?",
    answer:
      "In the planned full release, viewer access is read-only and enforced by server-side authorization rather than only by hiding buttons. Milestone 1 contains no recruiting records to change.",
  },
  {
    question: "Does HireTrack Lite use real persisted data?",
    answer:
      "The approved release architecture will use PostgreSQL through Prisma, and browser storage will never be the system of record. Milestone 1 intentionally contains no recruiting data.",
  },
  {
    question: "How are resumes protected?",
    answer:
      "The planned resume flow uses private object storage with server-side validation, authorization, and active-organization scoping. Resume upload is not part of the Milestone 1 foundation.",
  },
  {
    question: "Does the application work offline?",
    answer:
      "The release is designed to preserve clear interaction feedback and safely roll back failed requests, but persisted hiring changes will require a network connection.",
  },
  {
    question: "Is there a free plan?",
    answer:
      "HireTrack Lite is an open-source project under the MIT license. Hosting and managed service costs depend on the deployment you choose.",
  },
] as const;

export function createFaqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}
