import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { BentoCard } from "@/components/BentoCard";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, ArrowRight, TrendingUp, Sparkles, Flame, Eye, Bug, Leaf, Microscope, FlaskConical, Dna, Droplets, Beaker, Pill, Atom, HeartPulse, Syringe, TestTube } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";


const categoryIconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Bug, Leaf, Microscope, FlaskConical, Dna, Droplets, Sparkles, Eye, Flame, Beaker, Pill, Atom, HeartPulse, Syringe, TestTube,
};
import { AdSenseLoader } from "@/components/AdSenseLoader";
import { useContentValue } from "@/hooks/useSiteContent";

declare global {
  interface Window { adsbygoogle: unknown[] }
}

function AdUnit({ adClient, adSlot, className }: { adClient: string; adSlot: string; className?: string }) {
  useEffect(() => {
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch {}
  }, []);
  if (!adClient || !adSlot) return null;
  return (
    <ins className={`adsbygoogle ${className || ""}`} style={{ display: "block" }}
      data-ad-client={adClient} data-ad-slot={adSlot} data-ad-format="auto" data-full-width-responsive="true" />
  );
}

export default function Blog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("category") || "all";
  const { value: globalPubId } = useContentValue("ads", "adsense_publisher_id", "");

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("published", true)
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["blog-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_categories")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: ads = [] } = useQuery({
    queryKey: ["ad-placements"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ad_placements").select("*").eq("enabled", true);
      if (error) throw error;
      return data;
    },
  });

  const filteredPosts = activeCategory === "all"
    ? posts
    : posts.filter(p => p.category_id === activeCategory);

  const sidebarAd = ads.find(a => a.position === "sidebar");
  const bottomAd = ads.find(a => a.position === "bottom");
  const trendingPost = posts[0];
  const secondPost = posts[1];

  return (
    <div className="min-w-0">
      <AdSenseLoader />
      <BlogJsonLd posts={filteredPosts} />
      {/* Hero Section - Trending Style */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/8 via-background to-background">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,hsl(var(--primary)/0.12),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,hsl(var(--accent)/0.08),transparent_50%)]" />

        <div className="container pt-16 pb-10 md:pt-24 md:pb-14 relative">
          <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 mb-3">
              <Flame className="h-4 w-4 text-orange-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-orange-400">Trending Now</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold font-heading leading-tight mb-2">
              Research <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Blog</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-base max-w-lg">
              Latest discoveries and insights from microbiology research.
            </p>
          </div>

          {/* Trending cards */}
          <div className="grid gap-4 md:grid-cols-2">
            {trendingPost && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: "150ms" }}>
                <Link to={`/blog/${trendingPost.slug}`} className="group block h-full">
                  <div className="relative rounded-2xl overflow-hidden border border-primary/20 bg-card/60 backdrop-blur-sm h-full hover:border-primary/40 transition-all">
                    {trendingPost.cover_image_url && (
                      <div className="relative h-48 overflow-hidden">
                        <img src={trendingPost.cover_image_url} alt={trendingPost.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-orange-500/90 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                          <TrendingUp className="h-3 w-3" /> Featured
                        </div>
                      </div>
                    )}
                    <div className="p-5">
                      <h2 className="text-lg md:text-xl font-heading font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {trendingPost.title}
                      </h2>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{trendingPost.excerpt}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {trendingPost.published_at && new Date(trendingPost.published_at).toLocaleDateString()}
                        </span>
                        <ArrowRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            )}

            {secondPost && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: "250ms" }}>
                <Link to={`/blog/${secondPost.slug}`} className="group block h-full">
                  <div className="relative rounded-2xl overflow-hidden border border-border/40 bg-card/40 backdrop-blur-sm h-full hover:border-primary/30 transition-all">
                    {secondPost.cover_image_url && (
                      <div className="relative h-48 overflow-hidden">
                        <img src={secondPost.cover_image_url} alt={secondPost.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                      </div>
                    )}
                    <div className="p-5">
                      <h2 className="text-lg font-heading font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {secondPost.title}
                      </h2>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{secondPost.excerpt}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {secondPost.published_at && new Date(secondPost.published_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="border-b border-border/30 bg-card/30">
        <div className="container py-8">
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="font-heading font-bold text-sm uppercase tracking-wider text-muted-foreground">Explore Topics</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            <button
              onClick={() => setSearchParams({})}
              className={cn(
                "rounded-xl border px-4 py-4 text-center transition-all hover:shadow-md",
                activeCategory === "all"
                  ? "bg-primary/15 border-primary/30 text-primary shadow-sm"
                  : "bg-card/60 border-border/40 text-muted-foreground hover:text-foreground hover:border-primary/20"
              )}
            >
              <Eye className="h-5 w-5 mx-auto mb-2" />
              <span className="text-sm font-medium block">All Posts</span>
              <span className="text-xs text-muted-foreground">{posts.length}</span>
            </button>
            {categories.map(cat => {
              const count = posts.filter(p => p.category_id === cat.id).length;
              const CatIcon = categoryIconMap[cat.icon_name] || Sparkles;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSearchParams({ category: cat.id })}
                  className={cn(
                    "rounded-xl border px-4 py-4 text-center transition-all hover:shadow-md",
                    activeCategory === cat.id
                      ? "shadow-sm"
                      : "bg-card/60 border-border/40 text-muted-foreground hover:text-foreground hover:border-primary/20"
                  )}
                  style={activeCategory === cat.id ? {
                    backgroundColor: cat.color + "18",
                    borderColor: cat.color + "40",
                    color: cat.color,
                  } : undefined}
                >
                  <CatIcon className="h-5 w-5 mx-auto mb-2" style={activeCategory === cat.id ? { color: cat.color } : undefined} />
                  <span className="text-sm font-medium block">{cat.name}</span>
                  <span className="text-xs opacity-70">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          <div className="space-y-5">
            {isLoading ? (
              [1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)
            ) : filteredPosts.length === 0 ? (
              <BentoCard className="p-8 text-center text-muted-foreground">
                {activeCategory === "all" ? "No blog posts yet." : "No posts in this category."}
              </BentoCard>
            ) : (
              filteredPosts.map((post, i) => {
                const postCategory = categories.find(c => c.id === post.category_id);
                return (
                  <div
                    key={post.id}
                    className="animate-in fade-in slide-in-from-bottom-3 duration-300"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <Link to={`/blog/${post.slug}`}>
                      <BentoCard className="group overflow-hidden hover:border-primary/40 transition-all">
                        <div className="flex flex-col md:flex-row gap-4 p-5">
                          {post.cover_image_url && (
                            <img src={post.cover_image_url} alt={post.title}
                              className="w-full md:w-44 h-32 object-cover rounded-xl shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            {postCategory && (
                              <span
                                className="inline-block text-[11px] font-semibold uppercase tracking-wider mb-2 px-2 py-0.5 rounded-md"
                                style={{ backgroundColor: postCategory.color + "20", color: postCategory.color }}
                              >
                                {postCategory.name}
                              </span>
                            )}
                            <h2 className="text-lg font-heading font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                              {post.title}
                            </h2>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{post.excerpt}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              {post.published_at && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(post.published_at).toLocaleDateString()}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {Math.max(1, Math.ceil((post.content?.length || 0) / 1000))} min read
                              </span>
                            </div>
                            {post.tags?.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-3">
                                {post.tags.slice(0, 4).map(t => (
                                  <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 self-center hidden md:block" />
                        </div>
                      </BentoCard>
                    </Link>
                    {i === 0 && ads.find(a => a.position === "inline") && (
                      <div className="my-4">
                        <AdUnit adClient={ads.find(a => a.position === "inline")!.ad_client || globalPubId} adSlot={ads.find(a => a.position === "inline")!.ad_slot} />
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {bottomAd && (
              <div className="mt-8">
                <AdUnit adClient={bottomAd.ad_client || globalPubId} adSlot={bottomAd.ad_slot} />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:block space-y-6">
            {sidebarAd && (
              <BentoCard className="p-4">
                <AdUnit adClient={sidebarAd.ad_client || globalPubId} adSlot={sidebarAd.ad_slot} />
              </BentoCard>
            )}

            <BentoCard className="p-5">
              <h3 className="font-heading font-bold text-sm mb-3 flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-primary" />
                Popular Tags
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {[...new Set(posts.flatMap(p => p.tags || []))].slice(0, 10).map(t => (
                  <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                ))}
              </div>
            </BentoCard>
          </aside>
        </div>
      </div>
    </div>
  );
}
