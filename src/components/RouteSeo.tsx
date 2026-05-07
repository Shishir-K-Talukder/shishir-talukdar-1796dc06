import { Helmet } from "react-helmet-async";
import { matchPath, useLocation } from "react-router-dom";

const SITE_NAME = "Shishir Kumar Talukder";
const DEFAULT_OG_IMAGE = "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/afbb8afb-37a5-4b10-a36d-9be4f853de0d";
const DEFAULT_ROBOTS = "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

type SeoConfig = {
  title: string;
  description: string;
  keywords: string;
  type?: "website" | "profile" | "article";
  path: string;
  noindex?: boolean;
  schema?: Record<string, unknown> | Array<Record<string, unknown>>;
};

const routeSeo: Record<string, SeoConfig> = {
  "/": {
    title: "Shishir Kumar Talukder | Microbiologist",
    description:
      "Research microbiologist focused on antimicrobial resistance, bacterial pathogenesis, microbial ecology, publications, and global collaborations.",
    keywords:
      "Shishir Kumar Talukder, microbiologist, microbiology researcher, antimicrobial resistance, bacterial pathogenesis, microbial ecology, AMR researcher, academic microbiology",
    type: "profile",
    path: "/",
    schema: [
      {
        "@context": "https://schema.org",
        "@type": "Person",
        name: SITE_NAME,
        jobTitle: "Research Microbiologist",
        description:
          "Research microbiologist specializing in antimicrobial resistance, bacterial pathogenesis, and microbial ecology.",
        url: "__SITE_URL__",
        knowsAbout: ["Antimicrobial Resistance", "Bacterial Pathogenesis", "Microbial Ecology", "Microbiology"],
      },
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: SITE_NAME,
        url: "__SITE_URL__",
      },
    ],
  },
  "/research": {
    title: "Research Projects | Shishir Kumar Talukder",
    description:
      "Explore microbiology research projects on antimicrobial resistance, bacterial pathogenesis, and microbial ecology.",
    keywords:
      "microbiology research projects, antimicrobial resistance research, bacterial pathogenesis, microbial ecology, microbiology portfolio, infectious disease research",
    path: "/research",
    schema: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Research Projects",
      description:
        "Research portfolio covering antimicrobial resistance, bacterial pathogenesis, and microbial ecology.",
      url: "__SITE_URL__/research",
    },
  },
  "/publications": {
    title: "Publications | Shishir Kumar Talukder",
    description:
      "Browse peer-reviewed microbiology publications, abstracts, journal details, and DOI references by Shishir Kumar Talukder.",
    keywords:
      "microbiology publications, research papers, peer reviewed journals, DOI, Shishir Kumar Talukder publications, scientific articles, journal papers",
    path: "/publications",
    schema: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Publications",
      description: "Peer-reviewed microbiology publications and research outputs.",
      url: "__SITE_URL__/publications",
    },
  },
  "/collaborations": {
    title: "Collaborations | Shishir Kumar Talukder",
    description:
      "See academic and research collaborations with institutions working on microbial science and public health challenges.",
    keywords:
      "research collaborations, academic collaborations, microbiology partnerships, global institutions, scientific collaboration, public health research",
    path: "/collaborations",
    schema: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Collaborations",
      description: "Academic and institutional collaborations in microbial science.",
      url: "__SITE_URL__/collaborations",
    },
  },
  "/blog": {
    title: "Microbiology Blog | Shishir Kumar Talukder",
    description:
      "Read microbiology articles, lab insights, and research updates on antimicrobial resistance and microbial science.",
    keywords:
      "microbiology blog, antimicrobial resistance blog, research updates, microbial science articles, lab insights, bacterial pathogenesis articles, microbial ecology news",
    path: "/blog",
    schema: {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: "Microbiology Blog",
      description: "Research insights and articles on microbiology and antimicrobial resistance.",
      url: "__SITE_URL__/blog",
    },
  },
  "/about": {
    title: "About Shishir Kumar Talukder | Microbiologist",
    description:
      "Learn about Shishir Kumar Talukder's background, research philosophy, technical skills, and experience in microbiology.",
    keywords:
      "about Shishir Kumar Talukder, microbiologist biography, research microbiologist, technical skills microbiology, scientific background, researcher profile",
    path: "/about",
    schema: {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      name: "About Shishir Kumar Talukder",
      description: "Biography, education, technical skills, and microbiology research focus.",
      url: "__SITE_URL__/about",
    },
  },
  "/contact": {
    title: "Contact Shishir Kumar Talukder | Collaboration Requests",
    description:
      "Contact Shishir Kumar Talukder for microbiology research collaboration, academic partnerships, and professional inquiries.",
    keywords:
      "contact microbiologist, research collaboration, academic partnership, microbiology inquiry, collaboration request, professional inquiry",
    path: "/contact",
    schema: {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      name: "Contact Shishir Kumar Talukder",
      description: "Contact page for research collaboration and professional inquiries.",
      url: "__SITE_URL__/contact",
    },
  },
};

export function RouteSeo() {
  const location = useLocation();
  const { pathname } = location;
  const origin = typeof window !== "undefined" ? window.location.origin : "https://shishir-talukdar.lovable.app";
  const basePath = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  const siteUrl = `${origin}${basePath}`;

  if (matchPath("/blog/:slug", pathname)) {
    return null;
  }

  const fallbackConfig: SeoConfig = {
    title: "Page Not Found | Shishir Kumar Talukder",
    description: "The page you requested could not be found.",
    keywords: "404, page not found",
    path: pathname,
    noindex: true,
  };

  const config = routeSeo[pathname] ?? fallbackConfig;
  const canonicalUrl = `${siteUrl}${config.path === "/" ? "/" : config.path}`;
  const robots = config.noindex ? "noindex, nofollow" : DEFAULT_ROBOTS;
  const schemaList = config.schema
    ? (Array.isArray(config.schema) ? config.schema : [config.schema]).map((entry) =>
        JSON.parse(JSON.stringify(entry).split("__SITE_URL__").join(siteUrl)),
      )
    : [];

  return (
    <Helmet prioritizeSeoTags>
      <title>{config.title}</title>
      <meta name="description" content={config.description} />
      <meta name="keywords" content={config.keywords} />
      <meta name="author" content={SITE_NAME} />
      <meta name="robots" content={robots} />
      <meta name="twitter:site" content={SITE_NAME} />
      <meta property="og:type" content={config.type ?? "website"} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_US" />
      <meta property="og:title" content={config.title} />
      <meta property="og:description" content={config.description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={DEFAULT_OG_IMAGE} />
      <meta property="og:image:alt" content={`${config.title} preview image`} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={config.title} />
      <meta name="twitter:description" content={config.description} />
      <meta name="twitter:image" content={DEFAULT_OG_IMAGE} />
      <meta name="twitter:image:alt" content={`${config.title} preview image`} />
      <link rel="canonical" href={canonicalUrl} />
      {schemaList.map((schema, index) => (
        <script key={`${config.path}-${index}`} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}