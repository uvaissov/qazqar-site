"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type FaqItem = {
  id: string;
  questionRu: string;
  answerRu: string;
};

function FaqAccordionItem({
  item,
  isOpen,
  onToggle,
}: {
  item: FaqItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center justify-between w-full py-5 text-left"
      >
        <span className="text-lg font-medium text-gray-900 pr-4">
          {item.questionRu}
        </span>
        <svg
          className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m19.5 8.25-7.5 7.5-7.5-7.5"
          />
        </svg>
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          isOpen ? "max-h-96 pb-5" : "max-h-0"
        }`}
      >
        <p className="text-gray-600 leading-relaxed">{item.answerRu}</p>
      </div>
    </div>
  );
}

export default function FaqSection({ faqItems }: { faqItems: FaqItem[] }) {
  const t = useTranslations("faq");
  const [openId, setOpenId] = useState<string | null>(null);

  if (faqItems.length === 0) return null;

  return (
    <section id="faq" className="py-16 md:py-24 bg-white">
      <div className="max-w-3xl mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-12">
          <span className="text-cyan-500 font-semibold text-sm uppercase tracking-wider">
            {t("sectionTitle")}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">
            {t("title")}
          </h2>
        </div>

        {/* Accordion */}
        <div className="bg-white rounded-xl border border-gray-200 divide-y-0 px-6">
          {faqItems.map((item) => (
            <FaqAccordionItem
              key={item.id}
              item={item}
              isOpen={openId === item.id}
              onToggle={() =>
                setOpenId(openId === item.id ? null : item.id)
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}
