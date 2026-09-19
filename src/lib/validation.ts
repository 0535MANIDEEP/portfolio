import { z } from "zod";

export const ProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  summary: z.string().min(1, "Summary is required"),
  stack: z.array(z.string()).min(1, "At least one technology required"),
  live: z.string().url("Must be a valid URL").nullable(),
  github: z.string().url("Must be a valid GitHub URL"),
  features: z.array(z.string()).min(1, "At least one feature required"),
  engineering: z.array(z.string()).min(1, "At least one engineering decision required"),
});

export const AdditionalWorkSchema = z.object({
  name: z.string().min(1),
  subtitle: z.string().min(1),
  description: z.string().min(1),
  github: z.string().url(),
});

export const ExperienceItemSchema = z.object({
  role: z.string().min(1),
  company: z.string().min(1),
  location: z.string().min(1),
  period: z.string().min(1),
  bullets: z.array(z.string()).min(1),
});

export const EducationSchema = z.object({
  degree: z.string().min(1),
  school: z.string().min(1),
  years: z.string().min(1),
  cgpa: z.string().min(1),
});

export const NavLinkSchema = z.object({
  href: z.string().min(1),
  label: z.string().min(1),
});

export const ProfileSchema = z.object({
  name: z.string().min(1),
  heroTitle: z.string().min(1),
  headline: z.string().min(1),
  supportingCopy: z.string().min(1),
  availability: z.string().min(1),
  location: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  linkedin: z.string().url(),
  github: z.string().url(),
  resumeLabel: z.string().min(1),
  resumeUrl: z.string().min(1),
  about: z.string().min(1),
  contactCopy: z.string().min(1),
});

export const ProjectsSchema = z.object({
  items: z.array(ProjectSchema),
  additionalWork: AdditionalWorkSchema,
});

export const ExperienceSchema = z.object({
  items: z.array(ExperienceItemSchema),
});

export const SkillsSchema = z.object({
  coreStack: z.string().min(1),
});

export const NavigationSchema = z.object({
  links: z.array(NavLinkSchema),
});

export const ContactSchema = z.object({
  heading: z.string().min(1),
  copy: z.string().min(1),
});

export const SectionSchemas = {
  profile: ProfileSchema,
  projects: ProjectsSchema,
  experience: ExperienceSchema,
  education: EducationSchema,
  skills: SkillsSchema,
  navigation: NavigationSchema,
  contact: ContactSchema,
};

export type Project = z.infer<typeof ProjectSchema>;
export type AdditionalWork = z.infer<typeof AdditionalWorkSchema>;
export type ExperienceItem = z.infer<typeof ExperienceItemSchema>;
export type Education = z.infer<typeof EducationSchema>;
export type NavLink = z.infer<typeof NavLinkSchema>;
export type Profile = z.infer<typeof ProfileSchema>;
export type Projects = z.infer<typeof ProjectsSchema>;
export type Experience = z.infer<typeof ExperienceSchema>;
export type Skills = z.infer<typeof SkillsSchema>;
export type Navigation = z.infer<typeof NavigationSchema>;
export type Contact = z.infer<typeof ContactSchema>;
