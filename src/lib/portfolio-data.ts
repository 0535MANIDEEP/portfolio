import { getSupabaseAdmin } from "@/lib/supabase";
import { portfolioFallback } from "@/data/portfolio";

export interface Project {
  name: string;
  summary: string;
  stack: string[];
  live: string | null;
  github: string;
  features: string[];
  engineering: string[];
}

export interface AdditionalWork {
  name: string;
  subtitle: string;
  description: string;
  github: string;
}

export interface ExperienceItem {
  role: string;
  company: string;
  location: string;
  period: string;
  bullets: string[];
}

export interface Education {
  degree: string;
  school: string;
  years: string;
  cgpa: string;
}

export interface NavLink {
  href: string;
  label: string;
}

export interface PortfolioData {
  profile: {
    name: string;
    heroTitle: string;
    headline: string;
    supportingCopy: string;
    availability: string;
    location: string;
    email: string;
    phone: string;
    linkedin: string;
    github: string;
    resumeLabel: string;
    resumeUrl: string;
    about: string;
    contactCopy: string;
  };
  projects: {
    items: Project[];
    additionalWork: AdditionalWork;
  };
  experience: {
    items: ExperienceItem[];
  };
  education: Education;
  skills: {
    coreStack: string;
  };
  navigation: {
    links: NavLink[];
  };
  contact: {
    heading: string;
    copy: string;
  };
}

type SectionRow = { section: string; data: unknown };

function assertString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function buildPortfolioData(rows: SectionRow[]): PortfolioData {
  const map: Record<string, unknown> = {};
  for (const row of rows) {
    map[row.section] = row.data;
  }

  const fb = portfolioFallback;
  const profile = (map.profile ?? {}) as Record<string, unknown>;
  const projects = (map.projects ?? {}) as Record<string, unknown>;
  const experience = (map.experience ?? {}) as Record<string, unknown>;
  const education = (map.education ?? {}) as Record<string, unknown>;
  const skills = (map.skills ?? {}) as Record<string, unknown>;
  const navigation = (map.navigation ?? {}) as Record<string, unknown>;
  const contact = (map.contact ?? {}) as Record<string, unknown>;

  return {
    profile: {
      name: assertString(profile.name, fb.profile.name),
      heroTitle: assertString(profile.heroTitle, fb.profile.heroTitle),
      headline: assertString(profile.headline, fb.profile.headline),
      supportingCopy: assertString(profile.supportingCopy, fb.profile.supportingCopy),
      availability: assertString(profile.availability, fb.profile.availability),
      location: assertString(profile.location, fb.profile.location),
      email: assertString(profile.email, fb.profile.email),
      phone: assertString(profile.phone, fb.profile.phone),
      linkedin: assertString(profile.linkedin, fb.profile.linkedin),
      github: assertString(profile.github, fb.profile.github),
      resumeLabel: assertString(profile.resumeLabel, fb.profile.resumeLabel),
      resumeUrl: assertString(profile.resumeUrl, fb.profile.resumeUrl),
      about: assertString(profile.about, fb.profile.about),
      contactCopy: assertString(profile.contactCopy, fb.profile.contactCopy),
    },
    projects: {
      items: Array.isArray(projects.items)
        ? (projects.items as unknown as Project[])
        : (fb.projects.items as Project[]),
      additionalWork: (projects.additionalWork as AdditionalWork) ?? fb.projects.additionalWork,
    },
    experience: {
      items: Array.isArray(experience.items)
        ? (experience.items as unknown as ExperienceItem[])
        : (fb.experience.items as ExperienceItem[]),
    },
    education: {
      degree: assertString(education.degree, fb.education.degree),
      school: assertString(education.school, fb.education.school),
      years: assertString(education.years, fb.education.years),
      cgpa: assertString(education.cgpa, fb.education.cgpa),
    },
    skills: {
      coreStack: assertString(skills.coreStack, fb.skills.coreStack),
    },
    navigation: {
      links: Array.isArray(navigation.links)
        ? (navigation.links as unknown as NavLink[])
        : (fb.navigation.links as NavLink[]),
    },
    contact: {
      heading: assertString(contact.heading, fb.contact.heading),
      copy: assertString(contact.copy, fb.contact.copy),
    },
  };
}

export async function getPortfolio(): Promise<PortfolioData> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("portfolio_sections")
      .select("section, data");

    if (error) {
      console.error("[portfolio-data] Supabase error:", error.message);
      return buildPortfolioData([]);
    }

    return buildPortfolioData((data as SectionRow[]) ?? []);
  } catch (err) {
    console.error("[portfolio-data] Failed to fetch portfolio data:", err);
    return buildPortfolioData([]);
  }
}
