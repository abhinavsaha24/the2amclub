"use client";

import { motion } from "framer-motion";
import { Zap, ShieldCheck, Clock, Smartphone } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

const features = [
  {
    icon: <Zap size={24} className="text-primary" />,
    title: "Lightning Fast",
    description:
      "Order in under 30 seconds. No sign-up, no clutter. Just scan and eat.",
  },
  {
    icon: <Clock size={24} className="text-primary" />,
    title: "Always Open",
    description:
      "Live from 10 PM to 4 AM. Because hunger doesn't follow a schedule.",
  },
  {
    icon: <ShieldCheck size={24} className="text-primary" />,
    title: "100% Secure",
    description:
      "Bank-grade encryption on all transactions. Your data is never sold.",
  },
  {
    icon: <Smartphone size={24} className="text-primary" />,
    title: "Mobile First",
    description:
      "Built for students on the move. Works on any device, any browser.",
  },
];

const steps = [
  {
    title: "Select Store",
    desc: "Choose your hostel block or campus cafe from the home page.",
  },
  {
    title: "Browse the Live Menu",
    desc: "See what's available in real-time. Stock updates instantly after every order.",
  },
  {
    title: "Add to Cart",
    desc: "Pick your items. Adjust quantities. Your cart saves automatically.",
  },
  {
    title: "Enter Your Details",
    desc: "Just your name and phone number. No account needed.",
  },
  {
    title: "Pay Securely",
    desc: "Scan the UPI QR code from any app. Fast, direct, and zero fees.",
  },
  {
    title: "Get Your Order Number",
    desc: "A unique order ID is generated. Show it at the counter.",
  },
  {
    title: "Collect Your Food",
    desc: "Walk up when you hear your number (or check the order tracker).",
  },
];

export default function AboutPage() {
  return (
    <div className="container-app py-16 md:py-24 max-w-4xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16 space-y-4"
      >
        <h1 className="font-heading text-5xl md:text-6xl font-bold tracking-tight text-foreground">
          About The 2AM Club
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          We started with a simple idea: hungry engineering students shouldn't
          have to fumble with cash at midnight. So we built something better.
        </p>
      </motion.div>

      {/* Features Grid */}
      <div className="mb-24">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <svg
                key={i}
                className="w-5 h-5 text-yellow-500 fill-current"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <h2 className="font-heading text-3xl font-bold text-foreground">
            Our Mission
          </h2>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
            To be the premium digital layer for hostel food — making every
            late-night craving faster, smarter, and more satisfying. We believe
            that a great ordering experience should be as good as the food
            itself.
          </p>
        </div>

        <h3 className="font-heading text-2xl font-bold text-center mb-8 text-foreground">
          Why Students Love Us
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card border border-border p-6 rounded-2xl flex flex-col gap-3 hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center">
                {f.icon}
              </div>
              <h4 className="font-heading text-xl font-semibold text-foreground">
                {f.title}
              </h4>
              <p className="text-muted-foreground">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Steps List */}
      <div className="mb-24">
        <h3 className="font-heading text-3xl font-bold text-center mb-12 text-foreground">
          The Full Flow
        </h3>
        <div className="max-w-2xl mx-auto space-y-8 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-background bg-secondary text-foreground font-bold shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm relative z-10">
                {i + 1}
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] bg-card border border-border p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <h4 className="font-heading text-lg font-bold text-foreground mb-1">
                  {step.title}
                </h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="text-center bg-secondary/50 border border-border p-12 rounded-3xl"
      >
        <h2 className="font-heading text-4xl font-bold text-foreground mb-4">
          Ready to order?
        </h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          The kitchen is open. Your food is waiting. Select your location and
          get started.
        </p>
        <Link href="/">
          <Button variant="default" size="lg" className="rounded-full px-8">
            Start Ordering
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
