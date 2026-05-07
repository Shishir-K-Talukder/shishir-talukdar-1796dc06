import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  LogOut, Image, Lock, Microscope, BookOpen, Menu,
  Building2, PenSquare, Megaphone, BarChart3, PanelLeftClose, PanelLeft, Tag, Shield, Mail, UserCircle, Github, Link2, Sparkles, ShieldAlert,
} from "lucide-react";
import ImageManager from "./ImageManager";
import ChangePassword from "./ChangePassword";
import ResearchEditor from "./ResearchEditor";
import PublicationsEditor from "./PublicationsEditor";
import CollaborationsEditor from "./CollaborationsEditor";
import BlogEditor from "./BlogEditor";
import AdsEditor from "./AdsEditor";
import AnalyticsDashboard from "./AnalyticsDashboard";
import CategoriesEditor from "./CategoriesEditor";
import RoleManager from "./RoleManager";
import SmtpSettings from "./SmtpSettings";
import ProfileEditor from "./ProfileEditor";
import GithubSettings from "./GithubSettings";
import FooterProfilesEditor from "./FooterProfilesEditor";
import AiSettingsEditor from "./AiSettingsEditor";
import PlagiarismSettingsEditor from "./PlagiarismSettingsEditor";
import { SktLogo } from "@/components/SktLogo";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";

const navItems = [
  { id: "profile", label: "Profile", icon: UserCircle },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "blog", label: "Blog", icon: PenSquare },
  { id: "categories", label: "Categories", icon: Tag },
  { id: "research", label: "Research", icon: Microscope },
  { id: "publications", label: "Publications", icon: BookOpen },
  { id: "collaborations", label: "Collaborations", icon: Building2 },
  { id: "images", label: "Media", icon: Image },
  { id: "footer-links", label: "Footer Links", icon: Link2 },
  { id: "github", label: "GitHub", icon: Github },
  { id: "ai", label: "AI Assistant", icon: Sparkles },
  { id: "plagiarism", label: "Plagiarism", icon: ShieldAlert },
  { id: "ads", label: "Ads", icon: Megaphone },
  { id: "smtp", label: "Email / SMTP", icon: Mail },
  { id: "roles", label: "Roles", icon: Shield },
  { id: "settings", label: "Security", icon: Lock },
];

const panels: Record<string, React.FC> = {
  profile: ProfileEditor,
  analytics: AnalyticsDashboard,
  blog: BlogEditor,
  categories: CategoriesEditor,
  research: ResearchEditor,
  publications: PublicationsEditor,
  collaborations: CollaborationsEditor,
  images: ImageManager,
  "footer-links": FooterProfilesEditor,
  github: GithubSettings,
  ai: AiSettingsEditor,
  plagiarism: PlagiarismSettingsEditor,
  ads: AdsEditor,
  smtp: SmtpSettings,
  roles: RoleManager,
  settings: ChangePassword,
};

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const [active, setActive] = useState("profile");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const ActivePanel = panels[active] || AnalyticsDashboard;

  const SidebarBody = ({ inSheet = false }: { inSheet?: boolean }) => (
    <>
      <div className={cn("flex items-center gap-2.5 px-4 h-14 border-b border-border/40 shrink-0", !inSheet && collapsed && "justify-center px-0")}>
        <SktLogo className="h-7 w-7 shrink-0" />
        {(inSheet || !collapsed) && <span className="font-heading font-bold text-sm tracking-tight">Admin Panel</span>}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { setActive(item.id); if (inSheet) setMobileOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                "hover:bg-muted/60",
                isActive
                  ? "bg-primary/10 text-primary shadow-sm border border-primary/20"
                  : "text-muted-foreground hover:text-foreground border border-transparent",
                !inSheet && collapsed && "justify-center px-0 gap-0"
              )}
              title={!inSheet && collapsed ? item.label : undefined}
            >
              <item.icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
              {(inSheet || !collapsed) && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className={cn("border-t border-border/40 p-3 space-y-2 shrink-0", !inSheet && collapsed && "px-1.5")}>
        {!inSheet && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            {!collapsed && <span>Collapse</span>}
          </button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className={cn("w-full text-xs text-muted-foreground hover:text-destructive", !inSheet && collapsed && "px-0")}
        >
          <LogOut className="h-3.5 w-3.5" />
          {(inSheet || !collapsed) && <span className="ml-1.5">Logout</span>}
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex fixed inset-y-0 left-0 z-40 flex-col border-r border-border/50 bg-card/95 backdrop-blur-xl transition-all duration-300",
          collapsed ? "w-[60px]" : "w-[220px]"
        )}
      >
        <SidebarBody />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-[260px] flex flex-col">
          <SidebarBody inSheet />
        </SheetContent>
      </Sheet>

      <div className={cn("flex-1 transition-all duration-300", "md:" + (collapsed ? "ml-[60px]" : "ml-[220px]"), collapsed ? "md:ml-[60px]" : "md:ml-[220px]")}>
        <header className="sticky top-0 z-30 h-14 flex items-center justify-between px-4 sm:px-6 border-b border-border/40 bg-background/80 backdrop-blur-md">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 -ml-1" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse shrink-0" />
            <h1 className="font-heading font-bold text-base capitalize truncate">{navItems.find(n => n.id === active)?.label}</h1>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:block truncate max-w-[40%]">{user?.email}</span>
        </header>

        <main className="p-3 sm:p-6">
          <ActivePanel />
        </main>
      </div>
    </div>
  );
}
