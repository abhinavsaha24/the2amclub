import { vi } from "vitest";

// Mock Supabase
vi.mock("@/lib/supabase/server", () => ({
  createServiceRoleClient: vi.fn(() => ({
    from: vi.fn(),
    storage: {
      from: vi.fn(),
    },
  })),
}));

// Mock Next.js Headers/Cookies
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
  })),
}));

// Mock Vercel Functions
vi.mock("@vercel/functions", () => ({
  waitUntil: vi.fn((promise) => promise),
}));
