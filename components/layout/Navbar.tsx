"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingCart, Menu, X, Zap, Moon, Sun, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useCartStore } from "@/store/cartStore";
import { useStoreStore } from "@/store/storeStore";
import { cn } from "@/lib/cn";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/about", label: "About" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const totalItems = useCartStore((s) => s.totalItems());
  const activeStore = useStoreStore((s) => s.activeStore);

  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Close mobile menu on route change
  useEffect(() => setMobileOpen(false), [pathname]);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container-app flex h-16 items-center justify-between">
        {/* Left: Logo & Store */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground group-hover:opacity-90 transition-opacity">
              <Zap size={16} />
            </div>
            <span className="font-heading font-bold text-lg hidden sm:inline-block tracking-tight">
              The 2AM Club
            </span>
          </Link>

          {activeStore && (
            <button
              onClick={() => router.push("/")}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-secondary text-secondary-foreground rounded-full hover:bg-secondary/80 transition-colors"
            >
              <MapPin size={14} />
              {activeStore.name}
            </button>
          )}
        </div>

        {/* Center: Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1 bg-secondary rounded-full p-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
                  isActive
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          )}

          {/* Cart */}
          <Link
            href="/cart"
            className="relative p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors group"
            aria-label={`Cart with ${totalItems} items`}
          >
            <ShoppingCart size={20} />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow-sm">
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-background">
          <div className="container-app py-4 flex flex-col gap-2">
            {activeStore && (
              <div className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground border-b pb-4 mb-2">
                <MapPin size={16} />
                Ordering from:{" "}
                <span className="text-foreground">{activeStore.name}</span>
              </div>
            )}

            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
