"use client";

import { useEffect, useState, useCallback } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

const supabase = getSupabaseClient();

type SectionData = Record<string, unknown>;

interface PortfolioSections {
  [section: string]: SectionData;
}

export default function AdminDashboard() {
  const [portfolio, setPortfolio] = useState<PortfolioSections>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [activeTab, setActiveTab] = useState("profile");
  const router = useRouter();

  const fetchPortfolio = useCallback(async () => {
    const res = await fetch("/api/portfolio");
    if (!res.ok) {
      console.error("Failed to fetch portfolio data");
      setLoading(false);
      return;
    }
    const data = await res.json() as PortfolioSections;
    setPortfolio(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.push("/admin");
        return;
      }
      fetchPortfolio();
    });
  }, [router, fetchPortfolio]);

  async function saveSection(section: string) {
    setSaving(true);
    setSaveMsg("");
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token ?? "";
    const res = await fetch("/api/portfolio", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ section, data: portfolio[section] }),
    });
    const result = await res.json() as { ok?: boolean; error?: string };
    setSaving(false);
    setSaveMsg(result.ok ? "Saved!" : `Error: ${result.error ?? "unknown"}`);
    setTimeout(() => setSaveMsg(""), 3000);
  }

  function updateField(section: string, field: string, value: unknown) {
    setPortfolio((prev) => ({
      ...prev,
      [section]: { ...(prev[section] ?? {}), [field]: value },
    }));
  }

  function updateArrayItem(
    section: string,
    arrayField: string,
    index: number,
    field: string,
    value: unknown
  ) {
    const sectionData = portfolio[section] ?? {};
    const arr = [...((sectionData[arrayField] as SectionData[]) ?? [])];
    arr[index] = { ...arr[index], [field]: value };
    updateField(section, arrayField, arr);
  }

  function addArrayItem(
    section: string,
    arrayField: string,
    template: SectionData
  ) {
    const sectionData = portfolio[section] ?? {};
    const arr = [...((sectionData[arrayField] as SectionData[]) ?? []), template];
    updateField(section, arrayField, arr);
  }

  function removeArrayItem(section: string, arrayField: string, index: number) {
    const sectionData = portfolio[section] ?? {};
    const arr = ((sectionData[arrayField] as SectionData[]) ?? []).filter(
      (_, i) => i !== index
    );
    updateField(section, arrayField, arr);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/admin");
  }

  function getStr(section: string, field: string): string {
    const s = portfolio[section] ?? {};
    return typeof s[field] === "string" ? (s[field] as string) : "";
  }

  function getNestedStr(section: string, nested: string, field: string): string {
    const s = portfolio[section] ?? {};
    const n = (s[nested] ?? {}) as SectionData;
    return typeof n[field] === "string" ? (n[field] as string) : "";
  }

  function getItems(section: string, arrayField = "items"): SectionData[] {
    const s = portfolio[section] ?? {};
    return Array.isArray(s[arrayField]) ? (s[arrayField] as SectionData[]) : [];
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
        <p className="text-sm text-[#78716c]">Loading...</p>
      </div>
    );
  }

  const tabs = [
    { id: "profile", label: "Profile" },
    { id: "projects", label: "Projects" },
    { id: "experience", label: "Experience" },
    { id: "education", label: "Education" },
    { id: "skills", label: "Skills" },
    { id: "navigation", label: "Navigation" },
    { id: "contact", label: "Contact" },
  ];

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <header className="border-b border-[#e7e5e4] bg-white sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-sm font-semibold text-[#1c1917]">Portfolio Admin</h1>
          <div className="flex items-center gap-3">
            {saveMsg && (
              <span className="text-xs text-[#78716c]">{saveMsg}</span>
            )}
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#78716c] hover:text-[#1c1917] transition-colors"
            >
              View site
            </a>
            <button
              onClick={handleLogout}
              className="text-xs text-[#78716c] hover:text-[#1c1917] transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex gap-1 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "bg-[#1c1917] text-[#fafaf9]"
                  : "text-[#78716c] hover:bg-[#f5f5f4]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "profile" && (
          <Section title="Profile" onSave={() => saveSection("profile")} saving={saving}>
            <Field label="Name" value={getStr("profile", "name")} onChange={(v) => updateField("profile", "name", v)} />
            <Field label="Hero Title" value={getStr("profile", "heroTitle")} onChange={(v) => updateField("profile", "heroTitle", v)} />
            <Field label="Headline" value={getStr("profile", "headline")} onChange={(v) => updateField("profile", "headline", v)} textarea />
            <Field label="Supporting Copy" value={getStr("profile", "supportingCopy")} onChange={(v) => updateField("profile", "supportingCopy", v)} textarea />
            <Field label="Availability" value={getStr("profile", "availability")} onChange={(v) => updateField("profile", "availability", v)} />
            <Field label="Location" value={getStr("profile", "location")} onChange={(v) => updateField("profile", "location", v)} />
            <Field label="Email" value={getStr("profile", "email")} onChange={(v) => updateField("profile", "email", v)} />
            <Field label="Phone" value={getStr("profile", "phone")} onChange={(v) => updateField("profile", "phone", v)} />
            <Field label="LinkedIn URL" value={getStr("profile", "linkedin")} onChange={(v) => updateField("profile", "linkedin", v)} />
            <Field label="GitHub URL" value={getStr("profile", "github")} onChange={(v) => updateField("profile", "github", v)} />
            <Field label="Resume Label" value={getStr("profile", "resumeLabel")} onChange={(v) => updateField("profile", "resumeLabel", v)} />
            <Field label="Resume URL (mailto: or https://)" value={getStr("profile", "resumeUrl")} onChange={(v) => updateField("profile", "resumeUrl", v)} />
            <Field label="About" value={getStr("profile", "about")} onChange={(v) => updateField("profile", "about", v)} textarea />
            <Field label="Contact Message" value={getStr("profile", "contactCopy")} onChange={(v) => updateField("profile", "contactCopy", v)} textarea />
          </Section>
        )}

        {activeTab === "projects" && (
          <Section title="Projects" onSave={() => saveSection("projects")} saving={saving}>
            {getItems("projects").map((project, i) => (
              <div key={i} className="border border-[#e7e5e4] rounded-lg p-4 mb-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[#1c1917]">Project {i + 1}</h3>
                  <button
                    onClick={() => removeArrayItem("projects", "items", i)}
                    className="text-xs text-red-500 hover:text-red-700 transition-colors"
                  >
                    Remove
                  </button>
                </div>
                <Field label="Name" value={String(project.name ?? "")} onChange={(v) => updateArrayItem("projects", "items", i, "name", v)} />
                <Field label="Summary" value={String(project.summary ?? "")} onChange={(v) => updateArrayItem("projects", "items", i, "summary", v)} textarea />
                <Field
                  label="Stack (comma-separated)"
                  value={Array.isArray(project.stack) ? (project.stack as string[]).join(", ") : ""}
                  onChange={(v) => updateArrayItem("projects", "items", i, "stack", v.split(",").map((s) => s.trim()).filter(Boolean))}
                />
                <Field label="Live URL (leave empty if none)" value={String(project.live ?? "")} onChange={(v) => updateArrayItem("projects", "items", i, "live", v || null)} />
                <Field label="GitHub URL" value={String(project.github ?? "")} onChange={(v) => updateArrayItem("projects", "items", i, "github", v)} />
                <Field
                  label="Features (one per line)"
                  value={Array.isArray(project.features) ? (project.features as string[]).join("\n") : ""}
                  onChange={(v) => updateArrayItem("projects", "items", i, "features", v.split("\n").filter(Boolean))}
                  textarea
                />
                <Field
                  label="Engineering decisions (one per line)"
                  value={Array.isArray(project.engineering) ? (project.engineering as string[]).join("\n") : ""}
                  onChange={(v) => updateArrayItem("projects", "items", i, "engineering", v.split("\n").filter(Boolean))}
                  textarea
                />
              </div>
            ))}
            <button
              onClick={() =>
                addArrayItem("projects", "items", {
                  name: "New Project",
                  summary: "",
                  stack: [],
                  live: null,
                  github: "",
                  features: [],
                  engineering: [],
                })
              }
              className="text-xs text-[#78716c] hover:text-[#1c1917] border border-dashed border-[#d6d3d1] rounded-md px-3 py-2 w-full transition-colors"
            >
              + Add project
            </button>
            <div className="mt-6 border-t border-[#e7e5e4] pt-4">
              <h3 className="text-sm font-semibold text-[#1c1917] mb-3">Additional Work</h3>
              <Field label="Name" value={getNestedStr("projects", "additionalWork", "name")} onChange={(v) => { const aw = (portfolio.projects as SectionData)?.additionalWork as SectionData ?? {}; updateField("projects", "additionalWork", { ...aw, name: v }); }} />
              <Field label="Subtitle" value={getNestedStr("projects", "additionalWork", "subtitle")} onChange={(v) => { const aw = (portfolio.projects as SectionData)?.additionalWork as SectionData ?? {}; updateField("projects", "additionalWork", { ...aw, subtitle: v }); }} />
              <Field label="Description" value={getNestedStr("projects", "additionalWork", "description")} onChange={(v) => { const aw = (portfolio.projects as SectionData)?.additionalWork as SectionData ?? {}; updateField("projects", "additionalWork", { ...aw, description: v }); }} textarea />
              <Field label="GitHub URL" value={getNestedStr("projects", "additionalWork", "github")} onChange={(v) => { const aw = (portfolio.projects as SectionData)?.additionalWork as SectionData ?? {}; updateField("projects", "additionalWork", { ...aw, github: v }); }} />
            </div>
          </Section>
        )}

        {activeTab === "experience" && (
          <Section title="Experience" onSave={() => saveSection("experience")} saving={saving}>
            {getItems("experience").map((exp, i) => (
              <div key={i} className="border border-[#e7e5e4] rounded-lg p-4 mb-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[#1c1917]">Experience {i + 1}</h3>
                  <button
                    onClick={() => removeArrayItem("experience", "items", i)}
                    className="text-xs text-red-500 hover:text-red-700 transition-colors"
                  >
                    Remove
                  </button>
                </div>
                <Field label="Role" value={String(exp.role ?? "")} onChange={(v) => updateArrayItem("experience", "items", i, "role", v)} />
                <Field label="Company" value={String(exp.company ?? "")} onChange={(v) => updateArrayItem("experience", "items", i, "company", v)} />
                <Field label="Location" value={String(exp.location ?? "")} onChange={(v) => updateArrayItem("experience", "items", i, "location", v)} />
                <Field label="Period" value={String(exp.period ?? "")} onChange={(v) => updateArrayItem("experience", "items", i, "period", v)} />
                <Field
                  label="Bullets (one per line)"
                  value={Array.isArray(exp.bullets) ? (exp.bullets as string[]).join("\n") : ""}
                  onChange={(v) => updateArrayItem("experience", "items", i, "bullets", v.split("\n").filter(Boolean))}
                  textarea
                />
              </div>
            ))}
            <button
              onClick={() =>
                addArrayItem("experience", "items", {
                  role: "",
                  company: "",
                  location: "",
                  period: "",
                  bullets: [],
                })
              }
              className="text-xs text-[#78716c] hover:text-[#1c1917] border border-dashed border-[#d6d3d1] rounded-md px-3 py-2 w-full transition-colors"
            >
              + Add experience
            </button>
          </Section>
        )}

        {activeTab === "education" && (
          <Section title="Education" onSave={() => saveSection("education")} saving={saving}>
            <Field label="Degree" value={getStr("education", "degree")} onChange={(v) => updateField("education", "degree", v)} />
            <Field label="School" value={getStr("education", "school")} onChange={(v) => updateField("education", "school", v)} />
            <Field label="Years" value={getStr("education", "years")} onChange={(v) => updateField("education", "years", v)} />
            <Field label="CGPA" value={getStr("education", "cgpa")} onChange={(v) => updateField("education", "cgpa", v)} />
          </Section>
        )}

        {activeTab === "skills" && (
          <Section title="Skills" onSave={() => saveSection("skills")} saving={saving}>
            <Field
              label="Core Stack (dot-separated, e.g. TypeScript · React · Node.js)"
              value={getStr("skills", "coreStack")}
              onChange={(v) => updateField("skills", "coreStack", v)}
              textarea
            />
          </Section>
        )}

        {activeTab === "navigation" && (
          <Section title="Navigation Links" onSave={() => saveSection("navigation")} saving={saving}>
            {getItems("navigation", "links").map((link, i) => (
              <div key={i} className="flex gap-2 items-end mb-2">
                <div className="flex-1">
                  <Field label="Label" value={String(link.label ?? "")} onChange={(v) => updateArrayItem("navigation", "links", i, "label", v)} />
                </div>
                <div className="flex-1">
                  <Field label="Href" value={String(link.href ?? "")} onChange={(v) => updateArrayItem("navigation", "links", i, "href", v)} />
                </div>
                <button
                  onClick={() => removeArrayItem("navigation", "links", i)}
                  className="text-xs text-red-500 hover:text-red-700 pb-2 transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              onClick={() => addArrayItem("navigation", "links", { label: "New", href: "#" })}
              className="text-xs text-[#78716c] hover:text-[#1c1917] border border-dashed border-[#d6d3d1] rounded-md px-3 py-2 w-full transition-colors"
            >
              + Add link
            </button>
          </Section>
        )}

        {activeTab === "contact" && (
          <Section title="Contact & Footer" onSave={() => saveSection("contact")} saving={saving}>
            <Field label="Contact Heading" value={getStr("contact", "heading")} onChange={(v) => updateField("contact", "heading", v)} />
            <Field label="Contact Copy" value={getStr("contact", "copy")} onChange={(v) => updateField("contact", "copy", v)} textarea />
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  children,
  onSave,
  saving,
}: {
  title: string;
  children: ReactNode;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <div className="bg-white rounded-lg border border-[#e7e5e4] p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[#1c1917]">{title}</h2>
        <button
          onClick={onSave}
          disabled={saving}
          className="rounded-md bg-[#1c1917] px-4 py-1.5 text-xs font-medium text-[#fafaf9] hover:bg-[#44403c] disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#78716c] mb-1">
        {label}
      </label>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-[#e7e5e4] bg-white px-3 py-2 text-sm text-[#1c1917] focus:outline-none focus:ring-2 focus:ring-[#a8a29e] resize-y"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-[#e7e5e4] bg-white px-3 py-2 text-sm text-[#1c1917] focus:outline-none focus:ring-2 focus:ring-[#a8a29e]"
        />
      )}
    </div>
  );
}
