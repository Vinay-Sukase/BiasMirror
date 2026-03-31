import { motion } from "framer-motion";
import { BrainCircuit, History, Home, LayoutDashboard, ShieldCheck, UserCog } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const baseNavItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/assessment", label: "Assessment", icon: BrainCircuit },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/history", label: "History", icon: History },
  { to: "/profile", label: "Profile", icon: UserCog }
];

export function AppShell() {
  const { auth, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const navItems = isAdmin
    ? [...baseNavItems, { to: "/admin", label: "Admin", icon: ShieldCheck }]
    : baseNavItems;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(154,124,255,0.28),_transparent_36%),linear-gradient(180deg,_#160f29_0%,_#0e0a1a_100%)] text-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 lg:px-10">
        <header className="mb-8 flex flex-col gap-4 rounded-[32px] border border-white/10 bg-white/6 px-6 py-5 backdrop-blur-xl md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-gradient-to-br from-plum to-iris text-white shadow-glow">
              <BrainCircuit className="h-7 w-7" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-haze/80">BiasMirror</p>
              <h1 className="text-2xl font-semibold">Cognitive bias intelligence for reflective decisions</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {auth ? <Badge>{auth.user.role === "admin" ? `${auth.user.name} · Admin` : auth.user.name}</Badge> : null}
            {auth ? (
              <Button
                variant="ghost"
                onClick={async () => {
                  await logout();
                  navigate("/auth");
                }}
              >
                Sign out
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => navigate("/auth")}>
                Sign in
              </Button>
            )}
          </div>
        </header>

        <div className="grid flex-1 gap-6 lg:grid-cols-[240px_1fr]">
          <nav className="rounded-[32px] border border-white/10 bg-white/8 p-4 backdrop-blur-xl">
            <div className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-[24px] px-4 py-3 text-sm font-medium transition",
                        isActive ? "bg-white/14 text-white" : "text-haze hover:bg-white/8 hover:text-white"
                      )
                    }
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                );
              })}
            </div>
          </nav>

          <motion.main
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="space-y-8"
          >
            <Outlet />
          </motion.main>
        </div>
      </div>
    </div>
  );
}
