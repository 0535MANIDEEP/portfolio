/**
 * JsonLd — renders a JSON-LD <script> tag for structured data.
 * Use in server components to inject SEO schema into the page.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
