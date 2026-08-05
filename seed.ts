import { db } from './src/lib/db'

async function seed() {
  console.log('Seeding database...')

  // ── Admin user (default: admin / admin123) ──────────────────────────
  await db.adminUser.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      totpSecret: '',
      totpEnabled: false,
      permissions: '',
    },
  })
  console.log('Admin user created (admin / admin123)')

  // ── Profile ─────────────────────────────────────────────────────────
  await db.profile.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      name: 'Gokul Saraswat',
      shortname: 'Gokul',
      avatar: '/avatar.jpeg',
      occupation: 'Backend Engineer',
      company: 'Oracle Financial Services Software',
      email: 'gokulsaraswat07@gmail.com',
      phone: '+91-9829086012',
      location: 'Bangalore, India',
      bio: `Backend Engineer with three years of experience architecting high-availability microservices for enterprise banking. Proficient in Java 8/17, Spring Boot, and SQL with expertise in Core Banking Systems (CBS), EOD/payment migrations. Proven track record of minimizing transaction latency, optimizing system performance, and building real-time financial services.

Experienced in building reporting services and handling complex regulatory compliance integrations that helped stakeholders improve smoother operations and real business impact. Owns the end-to-end SDLC from API design to production deployments and RCA, delivering scalable solutions that drive data-driven decision-making.`,
      tagline: 'Backend Engineer architecting high-availability microservices for enterprise banking — specializing in Java, Spring Boot, and distributed systems that drive real business impact.',
      resumeUrl: '/Gokul_Saraswat.pdf',
      twitter: 'https://twitter.com/gokulsaraswat',
      linkedin: 'https://www.linkedin.com/in/gokulsaraswat',
      github: 'https://github.com/gokulsaraswat',
      website: 'https://gokulsaraswat.com',
      codeReviewPhilosophy: 'I believe in constructive, empathetic code reviews. I focus on maintaining consistency with project style guides, keeping PRs small and manageable, and treating reviews as a collaborative learning opportunity rather than a gatekeeping exercise. Every review should leave the codebase better than it was found.',
      agileExperience: 'Experienced in Sprint Planning, backlog grooming, and breaking down monolithic business requirements into technical Jira tickets. I thrive in iterative environments where feedback loops are short and collaboration drives quality outcomes.',
      skills: JSON.stringify([
        { category: 'Languages', items: ['Java 8/17', 'SQL', 'PL/SQL', 'C++', 'Python', 'JavaScript', 'TypeScript'] },
        { category: 'Frameworks', items: ['Spring Boot', 'Oracle JET', 'Knockout.js', 'JUnit', 'Mockito', 'React', 'Next.js'] },
        { category: 'Cloud & DevOps', items: ['Kubernetes', 'Docker', 'AWS', 'GCP', 'OCI', 'Terraform', 'Grafana', 'Prometheus'] },
        { category: 'APIs & Architecture', items: ['RESTful APIs', 'SOAP', 'Microservices', 'JWT', 'OAuth 2.0', 'GraphQL'] },
        { category: 'Tools', items: ['Git', 'Linux', 'Postman', 'Flyway', 'Weblogic', 'Flexcube', 'Oracle BIP'] },
      ]),
      certifications: JSON.stringify(['Oracle Java 8', 'Oracle DB/SQL', 'GDSC Cloud Track']),
      siteSettings: JSON.stringify({ enableCustomCursor: true, enableChatBot: false }),
    },
  })
  console.log('Profile created')

  // ── Blogs ───────────────────────────────────────────────────────────
  const blogs = [
    {
      title: 'Dockerize Your Go Applications',
      slug: 'dockerize-go',
      excerpt: 'Learn how to containerize your Go applications using Docker for consistent development and deployment.',
      content: `# Dockerize Your Go Applications\n\nDocker has revolutionized the way we build, ship, and run applications. In this guide, we explore how to effectively containerize Go applications.\n\n## Why Docker for Go?\n\nGo compiles to a single binary, making it an excellent candidate for containerization.\n\n## Multi-Stage Builds\n\n\`\`\`dockerfile\nFROM golang:1.21-alpine AS builder\nWORKDIR /app\nCOPY go.mod go.sum ./\nRUN go mod download\nCOPY . .\nRUN CGO_ENABLED=0 go build -o server .\n\nFROM alpine:latest\nCOPY --from=builder /app/server /server\nEXPOSE 8080\nCMD ["/server"]\n\`\`\``,
      tags: 'docker,go,devops',
      type: 'article',
      published: true,
      category: 'DevOps',
      resourceLinks: JSON.stringify([
        { label: 'Docker Official Docs', url: 'https://docs.docker.com', description: 'Official Docker documentation' },
        { label: 'Go by Example', url: 'https://gobyexample.com', description: 'Hands-on Go examples' },
      ]),
    },
    {
      title: 'Getting Started with NATS',
      slug: 'getting-started-nats',
      excerpt: 'An introduction to NATS, the high-performance messaging system for distributed systems.',
      content: `# Getting Started with NATS\n\nNATS is a lightweight, high-performance messaging system for cloud-native applications and microservices.\n\n## Core Concepts\n\n### Subjects\nSubjects use hierarchical naming: \`orders.new\`, \`orders.*\`, \`orders.>\`\n\n### Publish/Subscribe\n\n\`\`\`go\nnc.Publish("orders.new", []byte(orderJSON))\nnc.Subscribe("orders.new", func(msg *nats.Msg) {\n    fmt.Printf("Received: %s\\n", string(msg.Data))\n})\n\`\`\``,
      tags: 'nats,messaging,distributed',
      type: 'article',
      published: true,
      category: 'Architecture',
    },
    {
      title: 'Introduction to IaC with Terraform',
      slug: 'introduction-iac-terraform',
      excerpt: 'Learn Infrastructure as Code fundamentals with Terraform for managing cloud resources declaratively.',
      content: `# Infrastructure as Code with Terraform\n\nIaC is the practice of managing infrastructure through machine-readable configuration files.\n\n## Example: AWS EC2\n\n\`\`\`hcl\nprovider "aws" { region = "us-east-1" }\n\nresource "aws_instance" "web" {\n  ami           = "ami-0c55b159cbfafe1f0"\n  instance_type = "t3.micro"\n  tags = { Name = "WebServer" }\n}\n\`\`\``,
      tags: 'terraform,iac,aws,devops',
      type: 'article',
      published: true,
      category: 'DevOps',
    },
    {
      title: 'Vite is Too Fast',
      slug: 'vite-is-too-fast',
      excerpt: 'Why Vite has become the go-to build tool for modern web development with lightning-fast HMR.',
      content: `# Vite is Too Fast\n\nVite leverages native ES modules for development and esbuild for production builds.\n\n## Build Times\n\n| Tool | Cold Start | HMR |\n|------|-----------|-----|\n| Webpack | 30-60s | 1-3s |\n| Vite | <1s | <50ms |`,
      tags: 'vite,frontend,javascript',
      type: 'article',
      published: true,
      category: 'Frontend',
      embeds: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    },
    {
      title: 'System Design Fundamentals',
      slug: 'system-design-fundamentals',
      excerpt: 'Comprehensive course covering system design from networking basics to designing scalable distributed systems.',
      content: `# System Design - The Complete Course\n\nLearn networking fundamentals, load balancing, caching, databases, microservices, and real-world system designs.`,
      tags: 'system-design,architecture,scalability',
      type: 'article',
      published: true,
      category: 'Architecture',
    },
  ]

  for (const blog of blogs) {
    await db.blogPost.upsert({ where: { slug: blog.slug }, update: {}, create: blog })
  }
  console.log(`${blogs.length} blogs created`)

  // ── Blog Ideas (Feature #19) ────────────────────────────────────────
  const ideas = [
    { title: 'Comparing message queues: Kafka vs NATS vs RabbitMQ', description: 'Deep dive into throughput, latency, and operational tradeoffs.', tags: 'messaging,kafka,nats', status: 'idea', priority: 'high', source: 'work' },
    { title: 'Caching strategies for banking APIs', description: 'Write-through, write-behind, and TTL patterns for financial data.', tags: 'caching,redis,performance', status: 'drafting', priority: 'medium', source: 'work' },
    { title: 'Why I love Flyway for DB migrations', description: 'Version-controlled schema evolution with examples.', tags: 'flyway,sql,migrations', status: 'idea', priority: 'low', source: 'personal' },
  ]
  for (const idea of ideas) {
    const exists = await db.blogIdea.findFirst({ where: { title: idea.title } })
    if (!exists) await db.blogIdea.create({ data: idea })
  }
  console.log(`${ideas.length} blog ideas created`)

  // ── Project (with architecture diagrams - Feature) ──────────────────
  await db.project.upsert({
    where: { slug: 'banking-microservices' },
    update: {},
    create: {
      title: 'Banking Microservices Platform',
      slug: 'banking-microservices',
      description: 'Designed and implemented a Report Microservice to aggregate complex transactional and audit data from Oracle BIP using optimized SQL. Engineered end-to-end backend integrations and WebLogic server optimizations. Formulated 30+ RESTful APIs using standardized microservices configuration. Delivered Tier-3 production support maintaining 98% system uptime.',
      shortDesc: 'Enterprise banking microservices with 30% API latency reduction and 98% uptime',
      website: 'https://www.oracle.com',
      stack: JSON.stringify(['Java', 'Spring Boot', 'SQL', 'REST APIs', 'WebLogic', 'Docker', 'Kubernetes', 'Grafana']),
      featured: true,
      complexity: 3,
      role: 'Associate Consultant - Backend Engineer',
      process: '1. Requirement gathering with stakeholders\n2. API contract design (OpenAPI)\n3. Microservice scaffolding with Spring Boot\n4. Optimized SQL & indexing strategy\n5. CI/CD pipeline setup\n6. Blue-green deployment on WebLogic + K8s\n7. Observability with Grafana/Prometheus',
      results: 'Reduced API transaction latency by 30% across multiple global banking rollouts. Resolved 100+ critical production bottlenecks maintaining 98% system uptime. Managed EOD batch processing with 99.9% data integrity.',
      performanceMetrics: 'API latency reduced from ~200ms to ~140ms (30% reduction). 98% system uptime maintained over 3 years. 99.9% data integrity across 1 year of historical transaction migration.',
      securityImplementation: 'OAuth 2.0 for service authentication, role-based access control, encrypted data transmission, HIPAA and GDPR compliance measures.',
      adrContent: '# ADR-001: Use Spring Boot for Microservices\n\n## Context\nWe need a framework that supports rapid microservice development with strong ecosystem support.\n\n## Decision\nAdopt Spring Boot 2.7 with Java 17.\n\n## Consequences\n- Mature dependency injection\n- Excellent observability integrations\n- Large talent pool',
      cicdSnippet: 'name: CI\non: [push]\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - name: Set up JDK 17\n        uses: actions/setup-java@v4\n        with:\n          java-version: "17"\n      - name: Build with Maven\n        run: mvn -B package --file pom.xml',
      iacSnippet: 'resource "aws_ecs_cluster" "banking" {\n  name = "banking-prod"\n}\n\nresource "aws_ecs_service" "report" {\n  name            = "report-svc"\n  cluster         = aws_ecs_cluster.banking.id\n  desired_count   = 3\n}',
      architectureDiagrams: JSON.stringify([
        { title: 'High-Level Architecture', url: 'https://arch.icepanel.app/sample.svg', description: 'System context and microservices communication', type: 'hld' },
        { title: 'Data Flow Diagram', url: 'https://arch.icepanel.app/dfd.svg', description: 'Transaction data flow from API to BIP', type: 'dfd' },
      ]),
    },
  })
  console.log('Project created')

  // ── Courses + Chapters ──────────────────────────────────────────────
  const goCourse = await db.course.upsert({
    where: { slug: 'go' },
    update: {},
    create: { title: 'Learn Go', slug: 'go', description: 'Master Go from fundamentals to advanced concurrency patterns.' },
  })

  const sdCourse = await db.course.upsert({
    where: { slug: 'system-design' },
    update: {},
    create: { title: 'System Design', slug: 'system-design', description: 'A complete system design course — from networking to scalable distributed architectures.' },
  })

  // Go course chapters
  const goChapters = [
    { title: 'Introduction to Go', slug: 'intro-go', content: '# Introduction to Go\n\nGo is a statically typed, compiled language designed at Google.', order: 0, sectionName: 'Basics', chapterType: 'content' },
    { title: 'Variables and Types', slug: 'variables-types', content: '# Variables and Types\n\nGo has a concise variable declaration syntax.', order: 1, sectionName: 'Basics', chapterType: 'content' },
    { title: 'Concurrency with Goroutines', slug: 'goroutines', content: '# Goroutines\n\nA goroutine is a lightweight thread managed by the Go runtime.', order: 2, sectionName: 'Concurrency', chapterType: 'code' },
    { title: 'Channels', slug: 'channels', content: '# Channels\n\nChannels are the pipes that connect concurrent goroutines.', order: 3, sectionName: 'Concurrency', chapterType: 'code' },
  ]
  for (const ch of goChapters) {
    const exists = await db.courseChapter.findFirst({ where: { courseId: goCourse.id, slug: ch.slug } })
    if (!exists) await db.courseChapter.create({ data: { ...ch, courseId: goCourse.id } })
  }

  // System Design course chapters
  const sdChapters = [
    { title: 'Networking Fundamentals', slug: 'networking-fundamentals', content: '# Networking Fundamentals\n\nUnderstand TCP/IP, DNS, HTTP, and the OSI model.', order: 0, sectionName: 'Foundations', chapterType: 'content' },
    { title: 'Load Balancing', slug: 'load-balancing', content: '# Load Balancing\n\nDistribute traffic across multiple servers.', order: 1, sectionName: 'Foundations', chapterType: 'content' },
    { title: 'Caching Strategies', slug: 'caching-strategies', content: '# Caching\n\nCache-aside, read-through, write-through, write-behind.', order: 2, sectionName: 'Scaling', chapterType: 'content' },
    { title: 'Database Sharding', slug: 'database-sharding', content: '# Database Sharding\n\nHorizontal partitioning of data.', order: 3, sectionName: 'Scaling', chapterType: 'content' },
    { title: 'High-Level Design: URL Shortener', slug: 'hld-url-shortener', content: '# HLD: URL Shortener\n\nDesign a scalable URL shortening service.', order: 4, sectionName: 'Design Problems', chapterType: 'hld' },
    { title: 'LLD: URL Shortener', slug: 'lld-url-shortener', content: '# LLD: URL Shortener\n\nClass diagram and API design.', order: 5, sectionName: 'Design Problems', chapterType: 'lld' },
    { title: 'API Design: URL Shortener', slug: 'api-url-shortener', content: '# API Design\n\nREST endpoints for the URL shortener.', order: 6, sectionName: 'Design Problems', chapterType: 'api-design' },
  ]
  for (const ch of sdChapters) {
    const exists = await db.courseChapter.findFirst({ where: { courseId: sdCourse.id, slug: ch.slug } })
    if (!exists) await db.courseChapter.create({ data: { ...ch, courseId: sdCourse.id } })
  }
  console.log('2 courses + chapters created')

  // ── Code Snippets ───────────────────────────────────────────────────
  const snippets = [
    {
      title: 'Java Stream API Cheat Sheet',
      slug: 'java-stream-cheatsheet',
      description: 'Common Java Stream operations with examples.',
      type: 'code',
      language: 'java',
      tags: 'java,streams,functional',
      content: 'List<Integer> nums = List.of(1,2,3,4,5);\nint sum = nums.stream().filter(n -> n % 2 == 0).mapToInt(Integer::intValue).sum();',
      published: true,
    },
    {
      title: 'Spring Boot REST Controller',
      slug: 'spring-rest-controller',
      description: 'A minimal Spring Boot REST controller example.',
      type: 'code',
      language: 'java',
      tags: 'spring,rest,java',
      content: '@RestController\n@RequestMapping("/api/users")\npublic class UserController {\n  @GetMapping("/{id}")\n  public User get(@PathVariable Long id) { return svc.get(id); }\n}',
      published: true,
    },
  ]
  for (const s of snippets) {
    await db.codeSnippet.upsert({ where: { slug: s.slug }, update: {}, create: s })
  }
  console.log(`${snippets.length} snippets created`)

  // ── Contact Messages ────────────────────────────────────────────────
  const msgs = [
    { name: 'Priya Sharma', email: 'priya@example.com', subject: 'Collaboration opportunity', message: 'Hi Gokul, I came across your portfolio and would love to discuss a backend role on our team.' },
    { name: 'Rahul Verma', email: 'rahul@example.com', subject: 'Question about your banking platform', message: 'Could you share how you handled EOD batch processing at scale?' },
  ]
  for (const m of msgs) {
    const exists = await db.contactMessage.findFirst({ where: { email: m.email, subject: m.subject } })
    if (!exists) await db.contactMessage.create({ data: m })
  }
  console.log(`${msgs.length} messages created`)

  // ── Sample Todo items ───────────────────────────────────────────────
  const todos = [
    { title: 'Add project screenshots', description: 'Upload high-res screenshots for Banking Microservices Platform', status: 'draft', priority: 'high', entityType: 'project' },
    { title: 'Add architecture diagram', description: 'Create architecture diagram showing microservices communication', status: 'completed', priority: 'high', entityType: 'project' },
    { title: 'Write ADR: Why Spring Boot', description: 'Architectural Decision Record explaining the choice of Spring Boot', status: 'in-progress', priority: 'medium', entityType: 'project' },
    { title: 'Migrate remaining blog posts', description: 'Import all 40+ MDX blog posts from the old portfolio into the new CMS', status: 'draft', priority: 'high', entityType: 'blog' },
  ]
  for (const todo of todos) {
    const exists = await db.todo.findFirst({ where: { title: todo.title } })
    if (!exists) await db.todo.create({ data: todo })
  }
  console.log(`${todos.length} todo items created`)

  console.log('Seeding complete!')
}

seed().catch(e => { console.error(e); process.exit(1) }).finally(() => db.$disconnect())
