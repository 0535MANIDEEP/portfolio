interface Project {
  name: string;
  summary: string;
  stack: string[];
  live: string | null;
  github: string;
  features: string[];
  engineering: string[];
}

interface AdditionalWork {
  name: string;
  subtitle: string;
  description: string;
  github: string;
}

interface WorkProps {
  projects: {
    items: Project[];
    additionalWork: AdditionalWork;
  };
}

export function Work({ projects }: WorkProps) {
  return (
    <section id="work" className="py-16 sm:py-20 px-4 border-t border-[#e7e5e4]">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-2xl font-bold tracking-tight text-[#1c1917]">Selected work</h2>
        <p className="mt-2 text-sm text-[#78716c]">{projects.items.length} projects with source code available to review.</p>

        <div className="mt-8 space-y-8">
          {projects.items.map((project) => (
            <article key={project.name} className="rounded-lg border border-[#e7e5e4] p-5 sm:p-6">
              <h3 className="text-lg font-semibold text-[#1c1917]">{project.name}</h3>
              <p className="mt-2 text-sm text-[#78716c] leading-relaxed">{project.summary}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {project.stack.map((tech) => (
                  <span key={tech} className="inline-block rounded-md bg-[#f5f5f4] px-2 py-0.5 text-xs font-medium text-[#78716c]">
                    {tech}
                  </span>
                ))}
              </div>

              <div className="mt-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#78716c] mb-2">Key features</h4>
                <ul className="space-y-1">
                  {project.features.map((f) => (
                    <li key={f} className="text-sm text-[#1c1917] flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#a8a29e] shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#78716c] mb-2">Engineering decisions</h4>
                <ul className="space-y-1">
                  {project.engineering.map((e) => (
                    <li key={e} className="text-sm text-[#78716c] flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#d6d3d1] shrink-0" />
                      {e}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                {project.live && (
                  <a href={project.live} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-md bg-[#1c1917] px-3.5 py-1.5 text-sm font-medium text-[#fafaf9] hover:bg-[#44403c] transition-colors">
                    Live demo
                    <svg className="ml-1.5 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </a>
                )}
                {project.github && (
                  <a href={project.github} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-md border border-[#e7e5e4] px-3.5 py-1.5 text-sm font-medium text-[#1c1917] hover:bg-[#f5f5f4] transition-colors">
                    View source
                    <svg className="ml-1.5 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 rounded-lg border border-dashed border-[#d6d3d1] p-5">
          <h3 className="text-base font-semibold text-[#1c1917]">
            {projects.additionalWork.name}
            <span className="ml-2 text-sm font-normal text-[#78716c]">{projects.additionalWork.subtitle}</span>
          </h3>
          <p className="mt-2 text-sm text-[#78716c] leading-relaxed">{projects.additionalWork.description}</p>
          <div className="mt-4">
            <a href={projects.additionalWork.github} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-md border border-[#e7e5e4] px-3.5 py-1.5 text-sm font-medium text-[#1c1917] hover:bg-[#f5f5f4] transition-colors">
              View source
              <svg className="ml-1.5 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
