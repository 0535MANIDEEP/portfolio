import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Gokul Saraswat — Backend Engineer',
    short_name: 'Gokul Saraswat',
    description:
      'Backend Engineer architecting high-availability microservices for enterprise banking. Specializing in Java, Spring Boot, and distributed systems.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#0a0a0a',
    orientation: 'portrait-primary',
    categories: ['portfolio', 'developer', 'technology'],
    icons: [
      {
        src: '/logo.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  }
}
