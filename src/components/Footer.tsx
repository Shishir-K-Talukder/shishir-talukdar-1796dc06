import { forwardRef } from "react";
import { FlaskConical, Mail, ExternalLink } from "lucide-react";
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
    <footer ref={ref} className="border-t py-10">
      <div className="container">
        <div className="grid gap-8 md:grid-cols-3 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FlaskConical className="h-4 w-4 text-primary" />
              <span className="font-heading font-bold">Shishir K. Talukder</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Research Microbiologist specializing in antimicrobial resistance and microbial ecology.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-semibold text-sm mb-3">Quick Links</h4>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link to="/research" className="hover:text-primary transition-colors">Research</Link>
              <Link to="/publications" className="hover:text-primary transition-colors">Publications</Link>
              <Link to="/collaborations" className="hover:text-primary transition-colors">Collaborations</Link>
              <Link to="/contact" className="hover:text-primary transition-colors">Contact</Link>
            </div>
          </div>

          {/* Academic Profiles */}
          <div>
            <h4 className="font-heading font-semibold text-sm mb-3">Academic Profiles</h4>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              {socialLinks.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors inline-flex items-center gap-1">
                  {s.label} <ExternalLink className="h-3 w-3" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t pt-6 flex flex-col items-center gap-2 text-center text-xs text-muted-foreground md:flex-row md:justify-between md:text-left">
          <span>© {currentYear} Shishir Kumar Talukder. All rights reserved.</span>
          <a href="mailto:contact@shishirkumartalukder.com" className="inline-flex items-center gap-1 hover:text-primary transition-colors">
            <Mail className="h-3 w-3" /> contact@shishirkumartalukder.com
          </a>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";
