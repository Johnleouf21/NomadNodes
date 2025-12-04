import { Hero } from "@/components/home/hero";
import { HowItWorks } from "@/components/home/how-it-works";
import { WhyNomadNodes } from "@/components/home/why-nomadnodes";

export default function Home() {
  return (
    <div>
      <Hero />
      <HowItWorks />
      <WhyNomadNodes />
    </div>
  );
}
