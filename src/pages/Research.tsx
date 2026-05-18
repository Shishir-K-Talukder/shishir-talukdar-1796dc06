import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BentoCard } from "@/components/BentoCard";
import { Badge } from "@/components/ui/badge";
import { Microscope, Leaf, FlaskConical, Bug, Dna, Droplets } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Bug, Leaf, Microscope, Droplets, Dna, FlaskConical,
};

const statusColor: Record<string, string> = {
  Ongoing: "bg-primary/20 text-primary border-primary/30",
  Completed: "bg-accent/20 text-accent border-accent/30",
  Planning: "bg-muted text-muted-foreground border-border",
};

export default function Research() {
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["research-projects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("research_projects").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="container py-12 md:py-20">
      <div className="mb-12">
        <h1 className="text-3xl md:text-4xl font-bold font-heading mb-3">Research Projects</h1>
        <p className="text-muted-foreground max-w-2xl">Exploring the frontiers of microbial science through innovative methodologies and interdisciplinary collaboration.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p, i) => {
            const Icon = iconMap[p.icon_name] || FlaskConical;
            return (
              <BentoCard key={p.id} delay={i * 0.08} className="flex min-h-[24rem] flex-col gap-4 overflow-hidden">
                {p.image_url && (
                  <img src={p.image_url} alt={p.title} className="w-full h-36 object-cover rounded-xl -mt-1" loading="lazy" />
                )}
                <div className="flex items-start justify-between">
                  <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <Badge variant="outline" className={statusColor[p.status]}>{p.status}</Badge>
                </div>
                <div className="flex-1">
                  <h2 className="font-bold font-heading mb-2 text-base">{p.title}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.description}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(p.tags as string[]).map((t) => (
                    <span key={t} className="text-xs font-mono rounded-full border bg-secondary/50 px-3 py-1 text-muted-foreground">{t}</span>
                  ))}
                </div>
              </BentoCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
