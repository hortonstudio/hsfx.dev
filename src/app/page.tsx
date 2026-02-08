import Navbar from "@/components/layout/Navbar";
import {
  GridBackground,
  FloatingNodes,
  CodeRain,
  PageTransition,
  CursorGlow,
} from "@/components/ui";
import { Hero, Footer } from "@/components/sections";

export default function Home() {
  return (
    <PageTransition>
      <GridBackground />
      <FloatingNodes />
      <CodeRain />
      <CursorGlow />
      <Navbar />
      <main>
        <Hero />
      </main>
      <Footer />
    </PageTransition>
  );
}
