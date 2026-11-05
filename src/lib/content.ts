import type { IconName } from "@/components/Icon";
import { site } from "./site";

// Photography is TV Install Pro's own, taken from tvinstallpro.ca (logos excluded), then graded,
// upscaled and lightly sharpened into /public/images. Laser TV is the site's product render.
// The booking-page cards (/public/images/services) are generated illustrations, one per service.

export type Service = {
  slug: string;
  title: string;
  /** one line, used in lists */
  short: string;
  /** paraphrased from the service's live booking page */
  body: string;
  icon: IconName;
  image: string;
  /** picture for this service's card on the booking page; falls back to `image` */
  cardImage?: string;
  /** TV mounting has an itemised estimator; everything else is quoted on request */
  estimator?: boolean;
  /** old WordPress booking URL, redirected to /book?service=<slug> (empty for services added in the admin) */
  legacyPath: string;
  /** optional "From $…" price set in the admin; without it the service shows as quoted on request */
  priceFrom?: number;
  /** added in the admin rather than in this file */
  custom?: boolean;
  /** kept, but not shown on the website */
  hidden?: boolean;
};

export const services: Service[] = [
  {
    slug: "tv-mounting",
    title: "TV Installation & Mounting",
    short: "Mounted level, secured properly and finished with clean cables.",
    body: "From a bedroom TV on drywall to a large screen on brick or stone, we mount it securely, level it precisely and finish with clean, hidden cables. Fixed, tilting and full-motion mounts available.",
    icon: "tv",
    image: "/images/tv-marble-wall.jpg",
    cardImage: "/images/services/tv-mounting.jpg",
    estimator: true,
    legacyPath: "/tv-installation-and-mounting-service",
  },
  {
    slug: "mantel-mount",
    title: "Mantel Mount Installation",
    short: "Above the fireplace, at a height that's comfortable to watch.",
    body: "A mantel mount lets your TV sit above the fireplace and come down to eye level when you're watching. More floor space, better viewing angles and no TV stand required.",
    icon: "fireplace",
    image: "/images/mantel-mount-fireplace.jpg",
    cardImage: "/images/services/mantel-mount.jpg",
    legacyPath: "/mantel-mount-installation-service",
  },
  {
    slug: "laser-tv",
    title: "Laser TV Installation",
    short: "Positioned for your room and calibrated for a stunning picture.",
    body: "We assess your room's light and layout, place your laser TV at the ideal distance and height, then fine-tune brightness, contrast and colour so the picture looks its best.",
    icon: "projector",
    image: "/images/laser-tv.jpg",
    cardImage: "/images/services/laser-tv.jpg",
    legacyPath: "/laser-tv-installation-service",
  },
  {
    slug: "samsung-frame",
    title: "Samsung Frame Installation",
    short: "Flush, gallery-style mounting that does The Frame justice.",
    body: "Samsung's Frame TV is designed to hang like artwork. We mount it flush and perfectly positioned, so art mode looks exactly as intended.",
    icon: "frame",
    image: "/images/samsung-frame.jpg",
    cardImage: "/images/services/samsung-frame.jpg",
    legacyPath: "/samsung-frame-tv-installation-service",
  },
  {
    slug: "appliances",
    title: "Home Appliances",
    short: "Dishwashers, fridges, ranges and ovens, installed and tested.",
    body: "From dishwashers and refrigerators to ranges and ovens, we install each appliance correctly for your home and test it before we leave.",
    icon: "appliance",
    image: "/images/microwave-install.jpg",
    cardImage: "/images/services/appliances.jpg",
    legacyPath: "/home-appliances-installation",
  },
  {
    slug: "blinds-curtains",
    title: "Blinds & Curtains",
    short: "Window treatments, measured and hung with care.",
    body: "Traditional, modern or custom blinds and curtains, installed straight, secure and ready for every Canadian season.",
    icon: "blinds",
    image: "/images/blinds-dining-room.jpg",
    cardImage: "/images/services/blinds-curtains.jpg",
    legacyPath: "/blinds-and-curtains-installation",
  },
  {
    slug: "garage-shelving",
    title: "Garage Shelf Organization",
    short: "A cluttered garage turned into organized, usable space.",
    body: "Custom storage and sturdy wall-mounted shelving that brings order to your garage and keeps everything within reach.",
    icon: "shelf",
    image: "/images/garage-shelving.jpg",
    cardImage: "/images/services/garage-shelving.jpg",
    legacyPath: "/garage-shelves-organization",
  },
  {
    slug: "gazebos-sheds",
    title: "Gazebos & Sheds",
    short: "Sturdy outdoor structures, assembled and installed for you.",
    body: "Gazebos and sheds built to last, assembled and installed to suit your yard and the way you use it.",
    icon: "gazebo",
    image: "/images/gazebo-assembly.jpg",
    cardImage: "/images/services/gazebos-sheds.jpg",
    legacyPath: "/gazebos-and-sheds-installation",
  },
  {
    slug: "wallpaper",
    title: "Wallpaper Works",
    short: "Feature walls and textures, from prep to final panel.",
    body: "From a bold feature wall to a subtle texture, we handle it all: cleaning, priming and preparing the wall, then hanging every panel with seams perfectly matched.",
    icon: "wallpaper",
    image: "/images/wallpaper-bedroom.jpg",
    cardImage: "/images/services/wallpaper.jpg",
    legacyPath: "/wallpaper-works",
  },
];

export const serviceBySlug = (slug?: string | null) => services.find((s) => s.slug === slug);

// Listed under "other services" on the Services page.
export const otherServices = [
  "Handyman services",
  "Drywall installation",
  "Fan installation",
  "Furniture assembly",
  "Flooring installation",
  "Shelf installation",
  "Home cinema installation",
  "Sound bar installation & mounts",
  "Outdoor monitors",
  "Outdoor lighting",
  "Picture hanging",
  "Curtain rods",
  "Bidet installation",
  "Custom cabinets",
  "Basement development",
  "New builds",
  "Outdoor living spaces",
  "Emergency services",
];

// The four-step process from the live homepage.
export const process = [
  { title: "Book in minutes", text: "Book online, call or send us a message. Tell us what you need and we'll take it from there." },
  { title: "We confirm your visit", text: "We get in touch to confirm the details and arrive at a time that suits you." },
  { title: "Expert installation", text: "Your technician works cleanly and carefully, with minimal disruption to your home." },
  { title: "Tested and ready", text: "We test every connection, tidy up and make sure you're happy before we leave." },
];

export const images = {
  craft: { src: "/images/technician-at-work.jpg", alt: "TV Install Pro technician at work on an installation" },
  detail: { src: "/images/mount-on-brick.jpg", alt: "Full-motion TV mount fixed to a brick wall, ready for the TV" },
};

// Job photos from the live site. "focus" is the object-position that keeps the subject in crop. Captions only describe what is in the frame: no places, dates or clients.
export const work = [
  { src: "/images/tv-marble-wall.jpg", caption: "TV mounted on a marble feature wall" },
  { src: "/images/mount-on-brick.jpg", caption: "Full-motion mount secured to brick" },
  { src: "/images/tv-panelled-wall.jpg", caption: "TV set into a panelled wall" },
  { src: "/images/mantel-mount-fireplace.jpg", caption: "Mantel mount above a fireplace", focus: "50% 22%" },
  { src: "/images/wallpaper-install.jpg", caption: "Feature wallpaper, hung and matched", focus: "30% 40%" },
  { src: "/images/tv-living-room.jpg", caption: "Living-room installation in progress" },
];

// FAQs answered only with information published on the live site.
export const faqsFor = (b: { warrantyMonths: number; componentsIncluded: number }) => [
  {
    q: "How much does TV mounting cost?",
    a: "Pricing depends on your TV size, mount, wall type and any extras. Our online booking shows your estimate before you send anything, and your technician confirms the final price on site.",
  },
  {
    q: "What kinds of walls can you mount on?",
    a: "Almost any: drywall, wood, metal studs, plaster, concrete, brick, tile and stone. We bring the right anchors and tools for your wall, and harder surfaces are reflected in your estimate.",
  },
  {
    q: "Can you hide the wires?",
    a: "Yes. We can run cables inside the wall through an existing channel, or conceal them neatly behind a slim cover on the wall.",
  },
  {
    q: "Can you mount a TV above a fireplace?",
    a: "Absolutely. We mount TVs above fireplaces, and we also install mantel mounts that bring the TV down to a comfortable viewing height.",
  },
  {
    q: "Is the work guaranteed?",
    a: `Yes. Every installation is backed by a ${b.warrantyMonths}-month warranty, with optional one- and two-year extra care plans.`,
  },
  {
    q: "What's included in a standard installation?",
    a: `We mount and secure your TV, connect up to ${b.componentsIncluded} of your existing devices and test everything before we leave.`,
  },
  {
    q: "Do you offer same-day installation?",
    a: "Often, yes. Give us a call and we'll check today's availability.",
  },
  {
    q: "Is my booking confirmed when I send it?",
    a: "Your request reaches us straight away. We'll call or email to confirm your appointment time and final price.",
  },
];
