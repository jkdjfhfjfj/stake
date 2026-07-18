import { useEffect } from "react";

interface SeoMeta {
  title: string;
  description?: string;
  type?: "article" | "website";
  /** ISO date string */
  datePublished?: string;
}

export function useSeo({ title, description, type = "website", datePublished }: SeoMeta) {
  useEffect(() => {
    // Page title
    document.title = title;

    // Meta description
    if (description) {
      let el = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.name = "description";
        document.head.appendChild(el);
      }
      el.content = description;
    }

    // OG title
    let ogTitle = document.querySelector('meta[property="og:title"]') as HTMLMetaElement | null;
    if (ogTitle) ogTitle.content = title;

    // OG description
    if (description) {
      let ogDesc = document.querySelector('meta[property="og:description"]') as HTMLMetaElement | null;
      if (ogDesc) ogDesc.content = description;
    }

    // OG type
    let ogType = document.querySelector('meta[property="og:type"]') as HTMLMetaElement | null;
    if (ogType) ogType.content = type === "article" ? "article" : "website";

    // Article published date
    if (type === "article" && datePublished) {
      let existing = document.querySelector('meta[property="article:published_time"]') as HTMLMetaElement | null;
      if (!existing) {
        existing = document.createElement("meta");
        (existing as any).setAttribute("property", "article:published_time");
        document.head.appendChild(existing);
      }
      existing.content = datePublished;
    }

    return () => {
      // Restore defaults on unmount
      document.title = "StakeKE — Kenya's #1 M-Pesa Investment & Staking Platform";
      const ogTypeEl = document.querySelector('meta[property="og:type"]') as HTMLMetaElement | null;
      if (ogTypeEl) ogTypeEl.content = "website";
    };
  }, [title, description, type, datePublished]);
}
