"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, HelpCircle, MessageCircleQuestion } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <div className={cn(
      "group relative glass rounded-3xl transition-all duration-500 overflow-hidden mb-4",
      isOpen ? "shadow-2xl shadow-cyan-100/50" : "hover:border-cyan-200"
    )}>
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center justify-between w-full p-6 text-left"
      >
        <div className="flex items-center gap-4">
           <div className={cn(
             "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
             isOpen ? "bg-cyan-500 text-white" : "bg-gray-50 text-gray-400 group-hover:bg-cyan-50 group-hover:text-cyan-500"
           )}>
              <HelpCircle className="w-5 h-5" />
           </div>
           <span className={cn(
             "text-lg font-bold transition-colors",
             isOpen ? "text-cyan-600" : "text-gray-900"
           )}>
             {item.questionRu}
           </span>
        </div>
        <div className={cn(
          "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300",
          isOpen ? "bg-cyan-500 border-cyan-500 text-white rotate-180" : "border-gray-100 text-gray-400"
        )}>
           <ChevronDown className="w-4 h-4" />
        </div>
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-500 ease-in-out",
          isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="px-6 pb-6 pt-0 ml-14">
           <div className="h-px w-full bg-gray-100 mb-6" />
           <p className="text-gray-600 leading-relaxed text-lg">{item.answerRu}</p>
        </div>
      </div>
    </div>
  );
}

export default function FaqSection({ faqItems }: { faqItems: FaqItem[] }) {
  const t = useTranslations("faq");
  const [openId, setOpenId] = useState<string | null>(null);

  if (faqItems.length === 0) return null;

  return (
    <section id="faq" className="py-24 md:py-32 bg-white relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-50 rounded-full blur-3xl -ml-40 -mb-40" />

      <div className="max-w-4xl mx-auto px-4 relative">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-50 text-cyan-600 text-sm font-black uppercase tracking-widest mb-4">
             <MessageCircleQuestion className="w-4 h-4" />
             {t("sectionTitle")}
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
            {t("title")}
          </h2>
        </div>

        {/* Accordion List */}
        <div className="perspective-1000">
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
