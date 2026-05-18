import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BentoCard } from "@/components/BentoCard";
import { Input } from "@/components/ui/input";
import { BookOpen, Search, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Publications() {
  const [search, setSearch] = useState("");

  const { data: publications = [], isLoading } = useQuery({
    queryKey: ["publications"],
    queryFn: async () => {
      const { data, error } = await supabase.from("publications").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const filtered = publications.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.journal.toLowerCase().includes(search.toLowerCase()) ||
      (p.topics as string[]).some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="container py-12 md:py-20">
      <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-heading mb-3">Publications</h1>
          <p className="text-muted-foreground max-w-xl">Contributing to the global body of scientific knowledge through peer-reviewed research.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search publications..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((p, i) => (
            <BentoCard key={p.id} delay={i * 0.08} className="flex flex-col gap-3 md:flex-row md:gap-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="font-bold font-heading mb-1 text-base">{p.title}</h2>
                <p className="text-sm text-muted-foreground mb-2">{p.abstract}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{p.journal}</span>
                  <span className="font-mono">{p.year}</span>
                  {p.doi && (
                    <a href={`https://doi.org/${p.doi}`} target="_blank" rel="noopener noreferrer" className="font-mono text-primary hover:underline inline-flex items-center gap-1">
                      DOI <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {(p.topics as string[]).map((t) => (
                    <span key={t} className="rounded-full border bg-secondary/50 px-2 py-0.5">{t}</span>
                  ))}
                </div>
              </div>
            </BentoCard>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-12">No publications found matching your search.</p>
          )}
        </div>
      )}
    </div>
  );
}
