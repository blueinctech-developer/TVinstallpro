import { BookingCta } from "@/components/home/BookingCta";
import { Faq } from "@/components/home/Faq";
import { Figures } from "@/components/home/Figures";
import { Hero } from "@/components/home/Hero";
import { Journey } from "@/components/home/Journey";
import { Precision } from "@/components/home/Precision";
import { ServicesFan } from "@/components/home/ServicesFan";
import { Work } from "@/components/home/Work";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Precision />
      <Figures />
      <ServicesFan />
      <Work />
      <Journey />
      <Faq />
      <BookingCta />
    </>
  );
}
