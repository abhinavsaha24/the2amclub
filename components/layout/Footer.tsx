import Link from "next/link";
import { Zap, Link2, AtSign, Code2 } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative border-t border-white/[0.06] bg-black/40 backdrop-blur-sm mt-auto">
      {/* Top subtle glow border */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

      <div className="container-app relative z-10 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 group">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition-colors">
                <Zap size={20} fill="currentColor" />
              </div>
              <span className="font-heading font-bold text-white text-lg">
                The <span className="gradient-text-purple-cyan">2AM</span> Club
              </span>
            </div>
            <p className="text-text-muted text-sm font-body leading-relaxed">
              Where Hunger Never Sleeps.
            </p>
            <p className="text-text-muted text-xs font-body">
              Premium food ordering — fast, simple, and reliable.
            </p>
          </div>

          {/* Links */}
          <div className="space-y-3">
            <h4 className="text-white font-heading font-semibold text-sm">
              Navigation
            </h4>
            <ul className="space-y-2 text-sm font-body">
              {[
                { href: "/", label: "Home" },
                { href: "/menu", label: "Menu" },
                { href: "/cart", label: "Cart" },
                { href: "/about", label: "About" },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-text-muted hover:text-purple-300 transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div className="space-y-3">
            <h4 className="text-white font-heading font-semibold text-sm">
              Contact
            </h4>
            <p className="text-text-muted text-sm font-body">
              Need help? Reach out to us.
            </p>
            <div className="flex items-center gap-4 pt-4">
              <a
                href="#"
                className="p-2 rounded-lg bg-white/5 text-text-muted hover:text-purple-400 hover:bg-purple-500/10 transition-all"
                aria-label="Social link"
              >
                <AtSign size={16} />
              </a>
              <a
                href="#"
                className="p-2 rounded-lg bg-white/5 text-text-muted hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
                aria-label="Link"
              >
                <Link2 size={16} />
              </a>
              <a
                href="#"
                className="p-2 rounded-lg bg-white/5 text-text-muted hover:text-white hover:bg-white/10 transition-all"
                aria-label="Code"
              >
                <Code2 size={16} />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-text-muted text-xs font-body">
            © {new Date().getFullYear()} The 2AM Club. All rights reserved.
          </p>
          <p className="text-text-muted text-xs font-body">
            Built for night owls, by night owls.{" "}
            <span className="text-purple-400">⚡</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
