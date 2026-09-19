interface AboutProps {
  about: string;
  coreStack: string;
  education: {
    degree: string;
    school: string;
    years: string;
    cgpa: string;
  };
}

export function About({ about, coreStack, education }: AboutProps) {
  const stackItems = coreStack.split(/[·•]/).map(s => s.trim()).filter(Boolean);

  return (
    <section id="about" className="py-16 sm:py-20 px-4 border-t border-[#e7e5e4]">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-2xl font-bold tracking-tight text-[#1c1917]">About</h2>
        <p className="mt-4 text-sm text-[#1c1917] leading-relaxed max-w-2xl">{about}</p>
        <div className="mt-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#78716c] mb-3">Core stack</h3>
          <div className="flex flex-wrap gap-2">
            {stackItems.map((item) => (
              <span key={item} className="inline-block rounded-md bg-[#f5f5f4] px-2.5 py-1 text-xs font-medium text-[#78716c]">
                {item}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-6 text-sm text-[#78716c]">
          <p>{education.degree} — {education.school} · CGPA {education.cgpa}</p>
          <p className="mt-0.5">{education.years}</p>
        </div>
      </div>
    </section>
  );
}
