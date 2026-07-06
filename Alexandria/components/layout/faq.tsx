"use client";

import { useState } from "react";

const faqItems = [
  {
    question: "When is thesis?",
    answer:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  },
  {
    question: "When is capstone?",
    answer:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  },
  {
    question: "Who are the advisors?",
    answer:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  },
  {
    question: "How do I submit my paper?",
    answer:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  },
  {
    question: "Can I contribute?",
    answer:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  },
  {
    question: "How do I contribute?",
    answer:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  },
  {
    question: "Are these verified?",
    answer:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  },
  {
    question: "Can we use these as citations?",
    answer:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  },
];

export default function FaqRail() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <aside className="px-4 py-5 lg:px-6">
      <div className="rounded-lg border border-white/30 p-4">
        <h3 className="mb-4 text-sm font-semibold">
          Frequently Asked Questions (FAQ)
        </h3>

        <div className="space-y-3 text-sm text-white/75">
          {faqItems.map((item, index) => {
            const isOpen = openIndex === index;

            return (
              <div key={item.question} className="border-b border-white/10 pb-2">
                <button
                  type="button"
                  onClick={() =>
                    setOpenIndex(isOpen ? null : index)
                  }
                  className="flex w-full items-center justify-between text-left"
                >
                  <span>{item.question}</span>
                  <span>{isOpen ? "−" : "⌄"}</span>
                </button>

                <div
                    className={`grid transition-all duration-300 ease-out ${
                        isOpen ? "grid-rows-[1fr] opacity-100 mt-2" : "grid-rows-[0fr] opacity-0 mt-0"
                    }`}
                    >
                    <div className="overflow-hidden">
                        <p className="text-sm leading-6 text-white/60">
                        {item.answer}
                        </p>
                    </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}