import { getPortfolio } from "@/lib/portfolio-data";
import { Header } from "@/components/portfolio/header";
import { Hero } from "@/components/portfolio/hero";
import { Work } from "@/components/portfolio/work";
import { Experience } from "@/components/portfolio/experience";
import { About } from "@/components/portfolio/about";
import { Contact } from "@/components/portfolio/contact";
import { Footer } from "@/components/portfolio/footer";
import { ViewTracker } from "@/components/portfolio/view-tracker";

export const revalidate = 60;

export default async function Home() {
  const portfolio = await getPortfolio();

  return (
    <>
      <ViewTracker />
      <Header
        name={portfolio.profile.name}
        navLinks={portfolio.navigation.links}
        resumeLabel={portfolio.profile.resumeLabel}
        resumeUrl={portfolio.profile.resumeUrl}
      />
      <main id="main-content">
        <Hero profile={portfolio.profile} />
        <Work projects={portfolio.projects} />
        <Experience items={portfolio.experience.items} />
        <About
          about={portfolio.profile.about}
          coreStack={portfolio.skills.coreStack}
          education={portfolio.education}
        />
        <Contact
          heading={portfolio.contact.heading}
          copy={portfolio.contact.copy}
          email={portfolio.profile.email}
          linkedin={portfolio.profile.linkedin}
          github={portfolio.profile.github}
        />
      </main>
      <Footer
        name={portfolio.profile.name}
        email={portfolio.profile.email}
        linkedin={portfolio.profile.linkedin}
        github={portfolio.profile.github}
      />
    </>
  );
}
