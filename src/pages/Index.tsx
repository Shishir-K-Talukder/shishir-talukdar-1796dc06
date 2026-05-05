import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Users, FlaskConical, Microscope, Bug, Leaf, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BentoCard } from "@/components/BentoCard";
import { CountUp } from "@/components/CountUp";
import { FloatingMicrobes } from "@/components/FloatingMicrobes";
import { useProfile } from "@/hooks/useProfile";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import profileFallback from "@/assets/profile-placeholder.jpg";
import labHeroImg from "@/assets/lab-hero.jpg";
import researchAmrImg from "@/assets/research-amr.jpg";
import researchEcoImg from "@/assets/research-ecology.jpg";

export default function Index() {
  const profile = useProfile();
  const profileImg = profile.profileImage || profileFallback;

  const { data: counts, refetch } = useQuery({
    queryKey: ["home-counts"],
    queryFn: async () => {
      const [research, publications, collaborations] = await Promise.all([
        supabase.from("research_projects").select("*", { count: "exact", head: true }),
        supabase.from("publications").select("*", { count: "exact", head: true }),
        supabase.from("collaborations").select("*", { count: "exact", head: true }),
      ]);
      return {
        research: research.count ?? 0,
        publications: publications.count ?? 0,
        collaborations: collaborations.count ?? 0,
      };
    },
  });

  // Subscribe to realtime changes so the homepage updates instantly
  useEffect(() => {
    const channel = supabase
      .channel("home-counts-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "research_projects" }, () => refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "publications" }, () => refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "collaborations" }, () => refetch())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const stats = [
    { value: counts?.research ?? 0, label: "Research Projects", icon: FlaskConical },
    { value: counts?.publications ?? 0, label: "Publications", icon: BookOpen },
    { value: counts?.collaborations ?? 0, label: "Collaborations", icon: Users },
    { value: 2, label: "Years Research", icon: GraduationCap },
  ];

  return (
    <div className="container py-12 md:py-20">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Hero — spans 2 cols + 2 rows */}
        <BentoCard className="md:col-span-2 lg:col-span-2 lg:row-span-2 flex min-h-[28rem] flex-col justify-between gap-6 relative overflow-hidden" delay={0}>
          {/* Background lab image */}
          <div className="absolute inset-0 z-0">
            <img src={labHeroImg} alt="" className="h-full w-full object-cover opacity-10" width={800} height={800} />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/90 to-card/60" />
          </div>

          <div className="relative z-10 flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
            {/* Profile photo — large, highlighted */}
            <div className="group relative shrink-0 order-1 sm:order-2">
              {/* Floating microorganisms around the photo */}
              <div className="pointer-events-none absolute -inset-10 sm:-inset-12 lg:-inset-16 -z-10">
                <FloatingMicrobes count={9} />
              </div>
              {/* Glow halo */}
              <div
                aria-hidden
                className="absolute inset-0 -z-10 rounded-full bg-primary/40 blur-3xl opacity-70 group-hover:opacity-100 transition-opacity duration-500"
              />
              {/* Gradient ring frame */}
              <div className="rounded-full bg-gradient-to-br from-primary via-accent to-primary p-[3px] shadow-[0_10px_40px_-10px_hsl(var(--primary)/0.55)] transition-transform duration-500 group-hover:scale-105">
                <div className="rounded-full bg-card p-1">
                  <img
                    src={profileImg}
                    alt={`${profile.name} — ${profile.title}`}
                    className="h-44 w-44 sm:h-56 sm:w-56 lg:h-72 lg:w-72 xl:h-80 xl:w-80 rounded-full object-cover object-center"
                    width={512}
                    height={512}
                    loading="eager"
                    {...({ fetchpriority: "high" } as any)}
                  />
                </div>
              </div>
            </div>

            {/* Text */}
            <div className="order-2 sm:order-1 text-center sm:text-left">
              <p className="text-sm font-mono font-medium text-primary mb-3">{profile.name}</p>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-heading leading-tight mb-4">
                Advancing the Future of{" "}
                <span className="text-gradient">Microbial Science</span>
              </h1>
              <p className="text-muted-foreground leading-relaxed max-w-lg mx-auto sm:mx-0">
                Pioneering research and innovative solutions in microbial science for a healthier tomorrow.
              </p>
              <div className="mt-4">
                <p className="font-semibold">{profile.title}</p>
                <p className="text-sm text-muted-foreground">{profile.subtitle}</p>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex flex-wrap justify-center sm:justify-start gap-3">
            <Button asChild>
              <Link to="/contact">Request Collaboration</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/research">View Research <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
        </BentoCard>

        {/* Stats */}
        {stats.map((s, i) => (
          <BentoCard key={s.label} className="text-center flex flex-col items-center justify-center gap-2" delay={0.1 + i * 0.05}>
            <s.icon className="h-5 w-5 text-primary/60" />
            <CountUp to={s.value} className="text-3xl md:text-4xl font-bold font-mono text-primary" />
            <span className="text-sm text-muted-foreground">{s.label}</span>
          </BentoCard>
        ))}

        {/* About */}
        <BentoCard className="md:col-span-2" delay={0.3}>
          <h2 className="text-xl font-bold font-heading mb-3">Welcome to My Lab</h2>
          <p className="text-muted-foreground leading-relaxed text-sm mb-4">
            {profile.bio || `I'm ${profile.name}, a ${profile.title.toLowerCase()} dedicated to understanding and harnessing the power of microorganisms. With experience in antimicrobial resistance and bacterial pathogenesis, I combine cutting-edge techniques with innovative approaches to address global health challenges.`}
          </p>
          <Link to="/about" className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1">
            Read more <ArrowRight className="h-3 w-3" />
          </Link>
        </BentoCard>

        {/* Featured Research 1 — with image */}
        <BentoCard delay={0.35} className="overflow-hidden">
          <img src={researchAmrImg} alt="Antibiotic resistance research — petri dish analysis" className="w-full h-32 object-cover rounded-xl mb-3 -mt-1" loading="lazy" width={800} height={544} />
          <div className="flex items-center gap-2 mb-2">
            <Microscope className="h-4 w-4 text-primary" />
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Featured</span>
          </div>
          <h3 className="font-bold font-heading mb-2">Novel Antibiotic Resistance Mechanisms</h3>
          <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
            Investigating emerging patterns of antimicrobial resistance in clinical settings using advanced genomic approaches.
          </p>
          <Link to="/research" className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1">
            Learn More <ArrowRight className="h-3 w-3" />
          </Link>
        </BentoCard>

        {/* Featured Research 2 — with image */}
        <BentoCard delay={0.4} className="overflow-hidden">
          <img src={researchEcoImg} alt="Microbial ecology dynamics — environmental samples" className="w-full h-32 object-cover rounded-xl mb-3 -mt-1" loading="lazy" width={800} height={544} />
          <div className="flex items-center gap-2 mb-2">
            <Leaf className="h-4 w-4 text-accent" />
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Featured</span>
          </div>
          <h3 className="font-bold font-heading mb-2">Microbial Ecology Dynamics</h3>
          <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
            Exploring the complex interactions within microbial communities in extreme environments.
          </p>
          <Link to="/research" className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1">
            Learn More <ArrowRight className="h-3 w-3" />
          </Link>
        </BentoCard>

        {/* Expertise */}
        <BentoCard className="md:col-span-2" delay={0.45}>
          <h2 className="text-xl font-bold font-heading mb-4">Core Expertise</h2>
          <div className="flex flex-wrap gap-3">
            {[
              { icon: Bug, label: "Antimicrobial Resistance" },
              { icon: Microscope, label: "Bacterial Pathogenesis" },
              { icon: Leaf, label: "Microbial Ecology" },
            ].map((e) => (
              <div key={e.label} className="flex items-center gap-2 rounded-full border bg-secondary/50 px-4 py-2 text-sm">
                <e.icon className="h-4 w-4 text-primary" />
                <span>{e.label}</span>
              </div>
            ))}
          </div>
        </BentoCard>

        {/* Quick Links */}
        <BentoCard className="md:col-span-2 grid gap-4 sm:grid-cols-2" delay={0.5}>
          <Link to="/publications" className="flex min-h-[9rem] flex-col items-center justify-center gap-2 rounded-2xl border bg-secondary/30 p-5 text-center hover:border-primary/30 transition-colors">
            <BookOpen className="h-6 w-6 text-primary" />
            <CountUp to={counts?.publications ?? 0} className="text-2xl font-bold font-mono" />
            <span className="text-sm text-muted-foreground">Publications</span>
          </Link>
          <Link to="/collaborations" className="flex min-h-[9rem] flex-col items-center justify-center gap-2 rounded-2xl border bg-secondary/30 p-5 text-center hover:border-primary/30 transition-colors">
            <Users className="h-6 w-6 text-accent" />
            <CountUp to={counts?.collaborations ?? 0} className="text-2xl font-bold font-mono" />
            <span className="text-sm text-muted-foreground">Collaborations</span>
          </Link>
        </BentoCard>
      </div>
    </div>
  );
}
