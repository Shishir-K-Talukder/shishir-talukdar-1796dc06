import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

export function GoogleAnalytics() {
  const location = useLocation();

  const { data } = useQuery({
    queryKey: ["analytics-settings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("analytics_settings")
        .select("ga_measurement_id, gsc_verification, enabled")
        .maybeSingle();
      return data;
    },
    staleTime: 1000 * 60 * 10,
  });

  const measurementId = data?.enabled ? data?.ga_measurement_id?.trim() : "";
  const gscToken = data?.gsc_verification?.trim() || "";

  // Inject GA script + Search Console verification tag
  useEffect(() => {
    if (!measurementId) return;
    if (document.getElementById("ga4-src")) return;

    const s = document.createElement("script");
    s.id = "ga4-src";
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(s);

    const init = document.createElement("script");
    init.id = "ga4-init";
    init.innerHTML = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js', new Date());gtag('config','${measurementId}',{send_page_view:false});`;
    document.head.appendChild(init);
  }, [measurementId]);

  useEffect(() => {
    if (!gscToken) return;
    let tag = document.querySelector<HTMLMetaElement>('meta[name="google-site-verification"]');
    if (!tag) {
      tag = document.createElement("meta");
      tag.name = "google-site-verification";
      document.head.appendChild(tag);
    }
    tag.content = gscToken;
  }, [gscToken]);

  // Track page views on route change
  useEffect(() => {
    if (!measurementId || !window.gtag) return;
    window.gtag("event", "page_view", {
      page_path: location.pathname + location.search,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [location.pathname, location.search, measurementId]);

  return null;
}