import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { Layout } from "./components/Layout";
import { lazy, Suspense } from "react";
import { PageViewTracker } from "./components/PageViewTracker";
import { SecurityHeaders } from "./components/SecurityHeaders";
import { RouteSeo } from "./components/RouteSeo";
import { GoogleAnalytics } from "./components/GoogleAnalytics";
import { HomeSkeleton } from "./components/skeletons/HomeSkeleton";
import { ResearchSkeleton } from "./components/skeletons/ResearchSkeleton";
import { PublicationsSkeleton } from "./components/skeletons/PublicationsSkeleton";
import { CollaborationsSkeleton } from "./components/skeletons/CollaborationsSkeleton";
import { BlogSkeleton } from "./components/skeletons/BlogSkeleton";
import { BlogPostSkeleton } from "./components/skeletons/BlogPostSkeleton";
import { AboutSkeleton } from "./components/skeletons/AboutSkeleton";
import { ContactSkeleton } from "./components/skeletons/ContactSkeleton";
import { PageSkeleton } from "./components/PageSkeleton";

const Index = lazy(() => import("./pages/Index"));
const Research = lazy(() => import("./pages/Research"));
const Publications = lazy(() => import("./pages/Publications"));
const Collaborations = lazy(() => import("./pages/Collaborations"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminPage = lazy(() => import("./pages/admin/AdminPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <SecurityHeaders />
        <Toaster />
        <Sonner />
        <BrowserRouter basename={import.meta.env.BASE_URL} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <PageViewTracker />
          <RouteSeo />
          <GoogleAnalytics />
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Suspense fallback={<HomeSkeleton />}><Index /></Suspense>} />
              <Route path="/research" element={<Suspense fallback={<ResearchSkeleton />}><Research /></Suspense>} />
              <Route path="/publications" element={<Suspense fallback={<PublicationsSkeleton />}><Publications /></Suspense>} />
              <Route path="/collaborations" element={<Suspense fallback={<CollaborationsSkeleton />}><Collaborations /></Suspense>} />
              <Route path="/blog" element={<Suspense fallback={<BlogSkeleton />}><Blog /></Suspense>} />
              <Route path="/blog/:slug" element={<Suspense fallback={<BlogPostSkeleton />}><BlogPost /></Suspense>} />
              <Route path="/about" element={<Suspense fallback={<AboutSkeleton />}><About /></Suspense>} />
              <Route path="/contact" element={<Suspense fallback={<ContactSkeleton />}><Contact /></Suspense>} />
            </Route>
            <Route path="/SKT-admin" element={<Suspense fallback={<PageSkeleton />}><AdminPage /></Suspense>} />
            <Route path="*" element={<Suspense fallback={<PageSkeleton />}><NotFound /></Suspense>} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
