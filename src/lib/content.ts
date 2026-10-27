import type { IconName } from "@/components/Icon";
import { site } from "./site";

// Photography is TV Install Pro's own, taken from tvinstallpro.ca (logos excluded), then graded,
// upscaled and lightly sharpened into /public/images. Laser TV is the site's product render.

export type Service = {
  slug: string;
  title: string;
  /** one line, used in lists */
  short: string;
  /** paraphrased from the service's live booking page */
  body: string;
  icon: IconName;
  image: string;
  /** TV mounting has an itemised estimator; everything else is quoted on request */
  estimator?: boolean;
  /** old WordPress booking URL, redirected to /book?service=<slug> */
  legacyPath: string;
};

export const services: Service[] = [
  {
    slug: "tv-mounting",
    title: "TV Installation & Mounting",
    short: "Your TV on the wall, levelled, secured and wired cleanly.",
    body: "We mount your TV on the wall or wherever you choose, on drywall, brick, concrete, tile or stone, with fixed, tilting or full-motion mounts and optional cable concealment.",
    icon: "tv",
    image: "/images/tv-marble-wall.jpg",
    estimator: true,
    legacyPath: "/tv-installation-and-mounting-service",
  },
  {
    slug: "mantel-mount",
    title: "Mantel Mount Installation",
    short: "TVs mounted above the fireplace, at the height you'll actually watch.",
    body: "Mantel mounts fixed above your fireplace for better viewing angles and more floor space, with no TV stand needed. Installed securely by our technicians.",
    icon: "fireplace",
    image: "/images/mantel-mount-fireplace.jpg",
    legacyPath: "/mantel-mount-installation-service",
  },
  {
    slug: "laser-tv",
    title: "Laser TV Installation",
    short: "Placed for the room's light, then calibrated for picture.",
    body: "We review the room's lighting and layout, place the laser TV away from windows at a comfortable viewing distance and height, then calibrate brightness, contrast and colour.",
    icon: "projector",
    image: "/images/laser-tv.jpg",
    legacyPath: "/laser-tv-installation-service",
  },
  {
    slug: "samsung-frame",
    title: "Samsung Frame Installation",
    short: "Flush, gallery-style mounting for The Frame.",
    body: "Precise, secure mounting and positioning for Samsung's Frame TV, so its art mode and bezels look the way they were designed to.",
    icon: "frame",
    image: "/images/samsung-frame.jpg",
    legacyPath: "/samsung-frame-tv-installation-service",
  },
  {
    slug: "appliances",
    title: "Home Appliances",
    short: "Dishwashers, refrigerators, stoves and ovens, installed and tested.",
    body: "From dishwashers and refrigerators to stoves and ovens, installed according to how each appliance works and tailored to your home.",
    icon: "appliance",
    image: "/images/microwave-install.jpg",
    legacyPath: "/home-appliances-installation",
  },
  {
    slug: "blinds-curtains",
    title: "Blinds & Curtains",
    short: "Traditional, modern and custom window treatments.",
    body: "Blinds and curtains in traditional, modern and custom styles and materials, installed for Canadian climates.",
    icon: "blinds",
    image: "/images/blinds-dining-room.jpg",
    legacyPath: "/blinds-and-curtains-installation",
  },
  {
    slug: "garage-shelving",
    title: "Garage Shelf Organization",
    short: "Cluttered garages turned into organized, functional space.",
    body: "Customized garage storage and firmly installed shelving that turns a cluttered garage into an organized, functional space.",
    icon: "shelf",
    image: "/images/garage-shelving.jpg",
    legacyPath: "/garage-shelves-organization",
  },
  {
    slug: "gazebos-sheds",
    title: "Gazebos & Sheds",
    short: "Durable outdoor structures, installed to your design.",
    body: "Gazebo and shed installation with durable structures and personalized design.",
    icon: "gazebo",
    image: "/images/gazebo-assembly.jpg",
    legacyPath: "/gazebos-and-sheds-installation",
  },
  {
    slug: "wallpaper",
    title: "Wallpaper Works",
    short: "Feature and textured walls, from prep to final panel.",
    body: "Bold feature walls or subtle textures, with the full job handled: cleaning, priming and sizing the wall, then hanging.",
    icon: "wallpaper",
    image: "/images/wallpaper-bedroom.jpg",
    legacyPath: "/wallpaper-works",
  },
];

export const serviceBySlug = (slug?: string | null) => services.find((s) => s.slug === slug);

// Listed under "other services" on the live Services & Pricing page.
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
  { title: "Book a service", text: "Book online, call or message us with what you need installed." },
  { title: "Meet our experts", text: "A technician visits at a time that's convenient for you." },
  { title: "Work starts", text: "We install everything with as little disruption to your home as possible." },
  { title: "Testing", text: "A final check of every connection and mount before we leave." },
];

export const images = {
  craft: { src: "/images/technician-at-work.jpg", alt: "TV Install Pro technician at work on an installation" },
  detail: { src: "/images/mount-on-brick.jpg", alt: "Full-motion TV mount fixed to a brick wall, ready for the TV" },
};

// Job photos from the live site. "focus" is the object-position that keeps the subject in crop. Captions only describe what is in the frame: no places, dates or clients.
export const work = [
  { src: "/images/tv-marble-wall.jpg", caption: "TV on a marble feature wall" },
  { src: "/images/mount-on-brick.jpg", caption: "Full-motion mount on brick, before the TV goes up" },
  { src: "/images/tv-panelled-wall.jpg", caption: "TV set into a panelled wall" },
  { src: "/images/mantel-mount-fireplace.jpg", caption: "Mantel mount above a fireplace", focus: "50% 22%" },
  { src: "/images/wallpaper-install.jpg", caption: "Feature wallpaper going up", focus: "30% 40%" },
  { src: "/images/tv-living-room.jpg", caption: "Living-room install, being set up" },
];

// FAQs answered only with information published on the live site.
export const faqs = [
  {
    q: "How much does TV mounting cost?",
    a: "Mounting starts at $60.99 for TVs up to 31″ and goes up by TV size. Mounts, wall type, cable concealment and extras are itemised in our instant estimate on the booking page. The technician confirms the final price.",
  },
  {
    q: "What kinds of walls can you mount on?",
    a: "Drywall and wood, drywall with metal studs, plaster, concrete, brick, tile and stone. Harder surfaces carry a small surcharge, shown in the estimate.",
  },
  {
    q: "Can you hide the wires?",
    a: "Yes. We can feed wires through an existing channel in the wall or conceal them neatly on the outside of the wall.",
  },
  {
    q: "Can you mount a TV above a fireplace?",
    a: "Yes. Above-fireplace installs are a standard option in the estimate, and we also install mantel mounts.",
  },
  {
    q: "Is the work guaranteed?",
    a: `Installation work is covered by a ${site.warrantyMonths}-month warranty, and extended maintenance plans of one or two years are available.`,
  },
  {
    q: "What's included in a standard installation?",
    a: `Mounting and securing your TV, connecting up to ${site.componentsIncluded} existing components, and testing everything before we leave.`,
  },
  {
    q: "Do you offer same-day installation?",
    a: "Same-day installation is often available. Call us to check today's availability.",
  },
  {
    q: "Is my booking confirmed when I submit the form?",
    a: "Submitting sends us your request and estimate. We'll contact you to confirm the appointment time and final price.",
  },
];
