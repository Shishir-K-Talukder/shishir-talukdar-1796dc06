import { BentoCard } from "@/components/BentoCard";
import { GraduationCap, Bug, Microscope, Leaf, Heart, Globe, BookOpen } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { FloatingMicrobes } from "@/components/FloatingMicrobes";
import profileFallback from "@/assets/profile-placeholder.webp";
import labHeroImg from "@/assets/lab-hero.webp";

// Responsive Supabase image URL via the render endpoint.
function supaImg(url: string, w: number, q = 75) {
  if (!url || !url.includes("/storage/v1/object/public/")) return url;
  const rendered = url.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/");
  return `${rendered}?width=${w}&height=${w}&quality=${q}&resize=cover`;
}

const timeline = [
  { year: "2024 – Present", title: "Research Microbiologist ", desc: "Leading independent research on antimicrobial resistance, microbial ecology, Forensic Science, Agricultural microbiology." },
  { year: "2021 – 2024", title: "BSc In Microbiology", desc: "International Institute of Applied Science and Technology, Rangpur, Bangladesh." },
  { year: "2016 – 2020", title: "Diploma In Medical Assistant", desc: "State Medical Faculty, Dhaka, Bangladesh." },
  { year: "2006 – 2016", title: "Secondary School Certificate", desc: "Siddique Memorial School & College, Rangpur, Bangladesh." },
];

const skills = [
  "PCR & qPCR", "Gel Electrophoresis", "Cell Culture", "Bioinformatics",
  "Metagenomics", "Microscopy", "Antimicrobial Susceptibility Testing", "Statistical Analysis",
];

export default function About() {
  const profile = useProfile();
  const profileImg = profile.profileImage || profileFallback;
  const isRemoteProfile = !!profile.profileImage;
  const profileSrc = isRemoteProfile ? supaImg(profileImg, 320) : profileImg;
  const profileSrcSet = isRemoteProfile
    ? `${supaImg(profileImg, 224)} 224w, ${supaImg(profileImg, 320)} 320w, ${supaImg(profileImg, 416)} 416w, ${supaImg(profileImg, 576)} 576w`
    : undefined;
  return (
    <div className="container py-12 md:py-20">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Bio — spans 2 cols */}
        <BentoCard className="md:col-span-2 flex flex-col gap-6" delay={0}>
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
            <div className="group relative shrink-0">
              <div className="pointer-events-none absolute -inset-8 sm:-inset-10 lg:-inset-12 -z-10">
                <FloatingMicrobes count={8} />
              </div>
              <div aria-hidden className="absolute inset-0 -z-10 rounded-full bg-primary/40 blur-3xl opacity-70 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="rounded-full bg-gradient-to-br from-primary via-accent to-primary p-[3px] shadow-[0_10px_40px_-10px_hsl(var(--primary)/0.55)] transition-transform duration-500 group-hover:scale-105">
                <div className="overflow-hidden rounded-full bg-card p-1">
                  <img
                    src={profileSrc}
                    srcSet={profileSrcSet}
                    sizes="(min-width: 1280px) 288px, (min-width: 1024px) 256px, (min-width: 640px) 208px, 160px"
                    alt={profile.name}
                    className="h-40 w-40 sm:h-52 sm:w-52 lg:h-56 lg:w-56 xl:h-64 xl:w-64 rounded-full object-cover object-center bg-card"
                    width={320}
                    height={320}
                    loading="eager"
                    decoding="async"
                    {...({ fetchpriority: "high" } as any)}
                  />
                </div>
              </div>
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold font-heading">{profile.name}</h1>
              <p className="text-muted-foreground">{profile.title}</p>
            </div>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            {profile.bio || "I'm a research microbiologist dedicated to understanding and harnessing the power of microorganisms. With experience in antimicrobial resistance and bacterial pathogenesis, I combine cutting-edge techniques with innovative approaches to address global health challenges. My work bridges fundamental research with practical applications, aiming to develop solutions that improve human health and environmental sustainability."}
          </p>
        </BentoCard>

        {/* Research philosophy */}
        <BentoCard delay={0.1}>
          <Heart className="h-6 w-6 text-primary mb-3" />
          <h2 className="text-lg font-bold font-heading mb-2">Research Philosophy</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            I believe in open, collaborative science that transcends borders. By combining rigorous methodology with creative problem-solving, we can unlock the vast potential of microbial systems to benefit humanity.
          </p>
        </BentoCard>

        {/* Lab image card */}
        <BentoCard className="md:col-span-2 overflow-hidden p-0" delay={0.15}>
          <img
            src={labHeroImg}
            alt="Microbiology research laboratory with petri dishes and microscopes"
            className="w-full h-48 md:h-64 object-cover"
            loading="lazy"
            width={1280}
            height={720}
          />
        </BentoCard>

        {/* Mission */}
        <BentoCard delay={0.2}>
          <Globe className="h-6 w-6 text-accent mb-3" />
          <h2 className="text-lg font-bold font-heading mb-2">Mission</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            To advance scientific understanding of microbial systems and translate discoveries into tangible solutions for global health and sustainability challenges.
          </p>
        </BentoCard>

        {/* Timeline — spans full width */}
        <BentoCard className="md:col-span-2 lg:col-span-3" delay={0.25}>
          <div className="flex items-center gap-2 mb-6">
            <GraduationCap className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold font-heading">Education & Experience</h2>
          </div>
          <div className="space-y-6">
            {timeline.map((t, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="h-3 w-3 rounded-full bg-primary" />
                  {i < timeline.length - 1 && <div className="w-px flex-1 bg-border" />}
                </div>
                <div className="pb-6">
                  <span className="text-xs font-mono text-primary">{t.year}</span>
                  <h3 className="font-bold font-heading">{t.title}</h3>
                  <p className="text-sm text-muted-foreground">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </BentoCard>

        {/* Expertise grid */}
        {[
          { icon: Bug, label: "Antimicrobial Resistance", desc: "Identifying and characterizing resistance mechanisms in clinical and environmental bacteria." },
          { icon: Microscope, label: "Bacterial Pathogenesis", desc: "Understanding virulence factors and host-pathogen interactions at the molecular level." },
          { icon: Leaf, label: "Microbial Ecology", desc: "Studying microbial community dynamics, biofilms, and interactions in diverse ecosystems." },
        ].map((e, i) => (
          <BentoCard key={e.label} delay={0.3 + i * 0.08}>
            <e.icon className="h-6 w-6 text-primary mb-3" />
            <h3 className="font-bold font-heading mb-2">{e.label}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{e.desc}</p>
          </BentoCard>
        ))}

        {/* Technical Skills */}
        <BentoCard className="md:col-span-2 lg:col-span-3" delay={0.55}>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold font-heading">Technical Skills</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {skills.map((s) => (
              <span key={s} className="text-xs font-mono rounded-full border bg-secondary/50 px-3 py-1.5 text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors">
                {s}
              </span>
            ))}
          </div>
        </BentoCard>
      </div>
    </div>
  );
}
