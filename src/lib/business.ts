import { BUSINESS } from "./business-info";
export { BUSINESS };

export function businessProfiles() {
  return [BUSINESS.twoGisUrl, process.env.GOOGLE_MAPS_PROFILE_URL, process.env.YANDEX_MAPS_PROFILE_URL]
    .filter((url): url is string => Boolean(url && /^https:\/\//.test(url)));
}

export function businessData() {
  return {
    "@context": "https://schema.org", "@type": "AutoRental", "@id": "https://qazqar.kz/#business",
    name: BUSINESS.name, url: "https://qazqar.kz", telephone: BUSINESS.phone,
    image: "https://qazqar.kz/images/logo.png",
    address: { "@type": "PostalAddress", streetAddress: BUSINESS.streetAddress, addressLocality: "Астана", addressCountry: "KZ" },
    openingHours: BUSINESS.hours, sameAs: businessProfiles(), priceRange: "₸₸",
  };
}
