import { NextResponse } from "next/server";

export function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://manideep-portfolio-navy.vercel.app";
  
  const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml`;

  return new NextResponse(robotsTxt, {
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
