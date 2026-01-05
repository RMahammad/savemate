export type FaqItem = { question: string; answer: string };

export const defaultFaqItems: FaqItem[] = [
  {
    question: "How do I find deals in my city?",
    answer:
      "Use the search box on the homepage, or open the Deals page and filter by city/voivodeship.",
  },
  {
    question: "Do I need an account to browse deals?",
    answer:
      "No — browsing is free. Create an account if you want business features or access to protected areas.",
  },
  {
    question: "What do “Newest” and “Biggest discount” mean?",
    answer:
      "“Newest” sorts by recently published deals. “Biggest discount” prioritizes offers with the highest percentage discount.",
  },
  {
    question: "How do businesses publish deals?",
    answer:
      "Register as a Business user, then go to the Business dashboard to create and manage your listings.",
  },
  {
    question: "Are deals moderated?",
    answer:
      "Yes — business listings can go through moderation before appearing publicly, and always show validity dates.",
  },
];
