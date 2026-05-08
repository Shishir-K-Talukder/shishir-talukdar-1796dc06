import { Link, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { Menu, X, ChevronDown, Home, FlaskConical, BookOpen, Users, Rss, User, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { SktLogo } from "@/components/SktLogo";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const navLinks = [
  { to: "/", label: "Home", icon: Home },
  { to: "/research", label: "Research", icon: FlaskConical },
  { to: "/publications", label: "Publications", icon: BookOpen },
  { to: "/collaborations", label: "Collabs", icon: Users },
  { to: "/blog", label: "Blog", icon: Rss, hasDropdown: true },
  { to: "/about", label: "About", icon: User },
  { to: "/contact", label: "Contact", icon: Mail },
];

const mobileBottomLinks = [
  { to: "/", label: "Home", icon: Home },
  { to: "/research", label: "Research", icon: FlaskConical },
  { to: "/blog", label: "Blog", icon: Rss },
  { to: "/publications", label: "Pubs", icon: BookOpen },
  { to: "/about", label: "About", icon: User },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [blogDropdown, setBlogDropdown] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownTimeout = useRef<ReturnType<typeof setTimeout>>();
  const { pathname } = useLocation();

  const { data: categories = [] } = useQuery({
    queryKey: ["blog-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("blog_categories").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setBlogDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    setMoreMenuOpen(false);
  }, [pathname]);

  const handleDropdownEnter = () => {
    clearTimeout(dropdownTimeout.current);
    setBlogDropdown(true);
  };

  const handleDropdownLeave = () => {
    dropdownTimeout.current = setTimeout(() => setBlogDropdown(false), 200);
  };

  const isActive = (to: string, hasDropdown?: boolean) => {
    if (hasDropdown) return pathname.startsWith("/blog");
    return pathname === to;
  };

  return (
    <>
      {/* ─── Desktop Top Navbar ─── */}
      <nav
        aria-label="Main navigation"
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
          scrolled
            ? "h-14 bg-background/95 backdrop-blur-xl border-border/50 shadow-[0_2px_20px_-4px_hsl(var(--primary)/0.1)]"
            : "h-16 bg-background/70 backdrop-blur-md border-transparent"
        )}
      >
        <div className="container flex h-full items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <SktLogo className="h-8 w-8 shrink-0 transition-transform group-hover:scale-105" />
            <div className="flex flex-col leading-none">
              <span className="font-heading text-sm font-bold tracking-tight text-foreground">
                Shishir K. Talukder
              </span>
              <span className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">
                Microbiologist
              </span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((l) =>
              l.hasDropdown ? (
                <div
                  key={l.to}
                  className="relative"
                  ref={dropdownRef}
                  onMouseEnter={handleDropdownEnter}
                  onMouseLeave={handleDropdownLeave}
                >
                  <Link
                    to={l.to}
                    className={cn(
                      "relative px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1 rounded-md",
                      isActive(l.to, true) ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {isActive(l.to, true) && (
                      <span className="absolute inset-x-1 -bottom-[13px] h-0.5 rounded-full bg-primary" />
                    )}
                    {l.label}
                    <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", blogDropdown && "rotate-180")} />
                  </Link>
                  {blogDropdown && categories.length > 0 && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-56 rounded-xl border border-border/60 bg-popover backdrop-blur-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="p-1.5">
                        <Link to="/blog" onClick={() => setBlogDropdown(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted/60 transition-colors">
                          <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                          All Posts
                        </Link>
                        <div className="h-px bg-border/30 mx-2 my-1" />
                        {categories.map((cat) => (
                          <Link key={cat.id} to={`/blog?category=${cat.id}`} onClick={() => setBlogDropdown(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
                            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                            <span className="truncate">{cat.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={l.to}
                  to={l.to}
                  className={cn(
                    "relative px-3 py-2 text-sm font-medium transition-colors rounded-md",
                    isActive(l.to) ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {isActive(l.to) && (
                    <span className="absolute inset-x-1 -bottom-[13px] h-0.5 rounded-full bg-primary" />
                  )}
                  {l.label}
                </Link>
              )
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link to="/contact" className="hidden lg:inline-flex items-center px-4 py-1.5 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              Collaborate
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Mobile Floating Bottom Pill Nav ─── */}
      <div className="fixed bottom-4 left-4 right-4 z-50 lg:hidden">
        {/* More menu popup */}
        {moreMenuOpen && (
          <>
            <div
              className="fixed inset-0 bg-background/50 backdrop-blur-sm z-40 animate-in fade-in duration-200"
              onClick={() => setMoreMenuOpen(false)}
            />
            <div className="absolute bottom-full left-0 right-0 mb-3 z-50 rounded-2xl border border-border/40 bg-card/95 backdrop-blur-2xl shadow-[0_8px_40px_-8px_hsl(var(--primary)/0.2)] p-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
              {navLinks
                .filter((l) => !mobileBottomLinks.some((b) => b.to === l.to))
                .map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setMoreMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                      isActive(l.to) ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    )}
                  >
                    <l.icon className="h-5 w-5" />
                    {l.label}
                  </Link>
                ))}
            </div>
          </>
        )}

        {/* Floating pill bar */}
        <div className="rounded-full bg-card/90 backdrop-blur-2xl border border-border/30 shadow-[0_4px_30px_-4px_hsl(var(--background)/0.8),0_0_0_1px_hsl(var(--border)/0.1)] px-2 py-2">
          <div className="flex items-center justify-around">
            {mobileBottomLinks.map((l) => {
              const active = isActive(l.to, l.to === "/blog");
              const Icon = l.icon;
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  aria-label={l.label}
                  className="relative flex items-center justify-center"
                >
                  {active ? (
                    <div className="flex items-center gap-1.5 bg-primary rounded-full px-3.5 py-2">
                      <Icon className="h-4 w-4 text-primary-foreground" />
                      <span className="text-xs font-semibold text-primary-foreground whitespace-nowrap">
                        {l.label}
                      </span>
                    </div>
                  ) : (
                    <div className="p-2 rounded-full">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </Link>
              );
            })}

            {/* More */}
            <button
              onClick={() => setMoreMenuOpen(!moreMenuOpen)}
              className="relative flex items-center justify-center"
              aria-label={moreMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={moreMenuOpen}
            >
              <div className={cn("p-2 rounded-full transition-colors", moreMenuOpen ? "text-primary" : "text-muted-foreground")}>
                {moreMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </div>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
