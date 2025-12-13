import { Hero } from "@/components/home/hero";
import { HowItWorks } from "@/components/home/how-it-works";
import { PlatformStats } from "@/components/home/platform-stats";
import { WhyNomadNodes } from "@/components/home/why-nomadnodes";
import { Testimonials } from "@/components/home/testimonials";

export default function Home() {
  return (
    <div>
      <Hero />
      <HowItWorks />
      <PlatformStats />
      <Testimonials />
      <WhyNomadNodes />
    </div>
  );
}
