type Brand = {
  name: string;
  logoMark: string;
  tagline: string;
  locale: string;
  copy: {
    featuredTitle: string;
    featuredDescription: string;
    shopByCategoryTitle: string;
    topRatedTitle: string;
    topRatedBadge: string;
    moreInCategoryTitle: string;
    searchPlaceholder: string;
    footerNote: string;
    enquiryCallToAction: string;
    enquiryTitle: string;
    enquiryDescription: string;
    enquiryResponseNote: string;
    enquirySubmit: string;
    enquirySubmitting: string;
    enquirySentTitle: string;
    enquirySendAnother: string;
  };
};

export const brand: Brand = {
  name: "Catalogue",
  logoMark: "C",
  tagline: "Browse our range and send us an enquiry.",
  locale: "en-US",
  copy: {
    featuredTitle: "Featured products",
    featuredDescription: "Hand-picked by our team.",
    shopByCategoryTitle: "Shop by category",
    topRatedTitle: "Top rated",
    topRatedBadge: "Top 3",
    moreInCategoryTitle: "More in this category",
    searchPlaceholder: "Search products",
    footerNote: "Prices in USD",
    enquiryCallToAction: "Enquire about this product",
    enquiryTitle: "Ask our sales team",
    enquiryDescription:
      "Questions about stock, sizing or bulk orders? Send us a message about this product.",
    enquiryResponseNote: "We reply by email, usually within one business day.",
    enquirySubmit: "Send enquiry",
    enquirySubmitting: "Sending…",
    enquirySentTitle: "Thank you for your enquiry",
    enquirySendAnother: "Send another enquiry",
  },
};
