import { forwardRef } from "react";
import { FlaskConical, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { useContentValue } from "@/hooks/useSiteContent";

export const Footer = forwardRef<HTMLElement>(function Footer(_, ref) {
  const currentYear = new Date().getFullYear();
  const { value: googleScholar } = useContentValue("footer", "google_scholar_url", "https://scholar.google.com/");
  const { value: researchGate } = useContentValue("footer", "researchgate_url", "https://www.researchgate.net/");
  const { value: orcid } = useContentValue("footer", "orcid_url", "https://orcid.org/");
  const { value: linkedIn } = useContentValue("footer", "linkedin_url", "https://www.linkedin.com/");

  const socialLinks = [
    { label: "Google Scholar", href: googleScholar },
    { label: "ResearchGate", href: researchGate },
    { label: "ORCID", href: orcid },
    { label: "LinkedIn", href: linkedIn },
  ].filter((link) => Boolean(link.href?.trim()));

  return (
    <footer ref={ref} className="border-t border-border/60 py-8 mt-12">
      <div className="container flex flex-col gap-6">
        {/* Top row: brand + nav */}
        <div className="flex flex-col items-center gap-5 md:flex-row md:justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <FlaskConical className="h-4 w-4 text-primary transition-transform group-hover:rotate-12" />
            <span className="font-heading font-semibold tracking-tight text-sm">Shishir K. Talukder</span>
          </Link>

          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <Link to="/research" className="hover:text-primary transition-colors">Research</Link>
            <Link to="/publications" className="hover:text-primary transition-colors">Publications</Link>
            <Link to="/collaborations" className="hover:text-primary transition-colors">Collaborations</Link>
            <Link to="/blog" className="hover:text-primary transition-colors">Blog</Link>
            <Link to="/contact" className="hover:text-primary transition-colors">Contact</Link>
          </nav>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* Bottom row: socials + copyright + email */}
        <div className="flex flex-col items-center gap-3 text-xs text-muted-foreground md:flex-row md:justify-between">
          <span className="order-3 md:order-1">© {currentYear} Shishir Kumar Talukder. All rights reserved.</span>

          {socialLinks.length > 0 && (
            <div className="order-1 md:order-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  {s.label}
                </a>
              ))}
            </div>
          )}

          <a
            href="mailto:contact@shishirkumartalukder.com"
            className="order-2 md:order-3 inline-flex items-center gap-1.5 hover:text-primary transition-colors"
          >
            <Mail className="h-3 w-3" /> contact@shishirkumartalukder.com
          </a>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";
