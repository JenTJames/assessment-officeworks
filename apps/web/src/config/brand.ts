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
  },
};
