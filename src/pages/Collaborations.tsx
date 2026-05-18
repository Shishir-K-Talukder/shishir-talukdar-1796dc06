import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BentoCard } from "@/components/BentoCard";
import { Building2, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Collaborations() {
  const { data: collaborations = [], isLoading } = useQuery({
    queryKey: ["collaborations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("collaborations").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="container py-12 md:py-20">
      <div className="mb-12">
        <h1 className="text-3xl md:text-4xl font-bold font-heading mb-3">Collaborations</h1>
        <p className="text-muted-foreground max-w-2xl">Working with global institutions to advance microbial science and address public health challenges.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {collaborations.map((c, i) => (
            <BentoCard key={c.id} delay={i * 0.06} className="flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="h-12 w-12 rounded-xl bg-secondary border border-border flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xs font-mono text-muted-foreground">{c.country}</span>
              </div>
              <div className="flex-1">
                <h2 className="font-bold font-heading mb-1 text-base">{c.institution}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{c.description}</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono rounded-full border bg-secondary/50 px-3 py-1 text-primary">{c.focus}</span>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </div>
            </BentoCard>
          ))}
        </div>
      )}
    </div>
  );
}
