"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Settings,
  LogOut,
  Zap,
  Menu,
  X,
  ChevronRight,
  Building2,
  ChevronDown,
} from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";
import { getUserStores, clearStoreSession } from "@/lib/storeAuth";
import { useAdminStore } from "@/store/adminStore";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { href: "/admin/products", label: "Products", icon: <Package size={18} /> },
  { href: "/admin/orders", label: "Orders", icon: <ShoppingBag size={18} /> },
  { href: "/admin/settings", label: "Settings", icon: <Settings size={18} /> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [storeSwitcherOpen, setStoreSwitcherOpen] = useState(false);

  const { activeStoreId, activeStoreName, availableStores, setAvailableStores, setActiveStore } =
    useAdminStore();

  useEffect(() => {
    if (pathname === "/admin/login" || pathname === "/admin/register") {
      setChecking(false);
      return;
    }

    const bootstrap = async () => {
      try {
        const stores = await getUserStores();

        if (stores.length === 0) {
          router.replace("/admin/login");
          return;
        }

        setAvailableStores(stores);
        setChecking(false);
      } catch {
        router.replace("/admin/login");
      }
    };

    bootstrap();
  }, [router, pathname, setAvailableStores]);

  const handleLogout = async () => {
    useAdminStore.getState().clearAdminStore();
    await clearStoreSession();
    router.replace("/admin/login");
  };

  const handleStoreSwitch = (storeId: string) => {
    setActiveStore(storeId);
    setStoreSwitcherOpen(false);
    // Force re-render of the current page by navigating to the same route
    router.refresh();
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner size="xl" />
      </div>
    );
  }

  if (pathname === "/admin/login" || pathname === "/admin/register") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 bg-card border-r border-border flex flex-col transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo & Store Switcher */}
        <div className="p-6 border-b border-border space-y-3">
          <div className="flex items-center gap-2">
            <Zap size={20} className="text-primary" fill="currentColor" />
            <div>
              <p className="font-heading font-bold text-foreground text-sm">The 2AM Club</p>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                Admin Portal
              </p>
            </div>
          </div>

          {/* Store Switcher */}
          {activeStoreName && (
            <div className="relative">
              <button
                onClick={() => setStoreSwitcherOpen((v) => !v)}
                className="w-full flex items-center justify-between gap-1.5 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-lg text-xs font-semibold hover:bg-secondary/80 transition-colors"
                aria-expanded={storeSwitcherOpen}
                aria-haspopup="listbox"
              >
                <span className="flex items-center gap-1.5 truncate">
                  <Building2 size={12} className="shrink-0" />
                  <span className="truncate">{activeStoreName}</span>
                </span>
                {availableStores.length > 1 && (
                  <ChevronDown
                    size={12}
                    className={cn(
                      "shrink-0 transition-transform",
                      storeSwitcherOpen && "rotate-180"
                    )}
                  />
                )}
              </button>

              {storeSwitcherOpen && availableStores.length > 1 && (
                <div
                  role="listbox"
                  className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden"
                >
                  {availableStores.map((store) => (
                    <button
                      key={store.id}
                      role="option"
                      aria-selected={store.id === activeStoreId}
                      onClick={() => handleStoreSwitch(store.id)}
                      className={cn(
                        "w-full text-left px-3 py-2 text-xs font-medium transition-colors flex items-center gap-2",
                        store.id === activeStoreId
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-secondary"
                      )}
                    >
                      <Building2 size={11} />
                      {store.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <div className="flex items-center gap-3">
                  <span>{item.icon}</span>
                  {item.label}
                </div>
                {isActive && <ChevronRight size={14} />}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all w-full"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen relative">
        {/* Top bar */}
        <div className="sticky top-0 z-10 h-14 bg-background/80 backdrop-blur-xl border-b border-border flex items-center px-4 gap-4">
          <button
            className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="font-heading font-semibold text-foreground text-sm">
            {navItems.find((i) => pathname.startsWith(i.href))?.label ?? "Admin"}
          </span>
        </div>

        {/* Page Content */}
        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex-1 p-6"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
