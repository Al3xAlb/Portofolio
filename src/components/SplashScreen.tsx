import { useEffect, useState } from "react";

const NAME = "Alex Alb";
const STORAGE_KEY = "splash-seen";

const SplashScreen = () => {
  const [phase, setPhase] = useState<"in" | "out" | "done">(() => {
    if (typeof window === "undefined") return "done";
    return sessionStorage.getItem(STORAGE_KEY) ? "done" : "in";
  });

  useEffect(() => {
    if (phase === "done") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const outTimer = setTimeout(() => setPhase("out"), reduce ? 600 : 2000);
    const doneTimer = setTimeout(() => {
      setPhase("done");
      sessionStorage.setItem(STORAGE_KEY, "1");
    }, reduce ? 900 : 2800);
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(outTimer);
      clearTimeout(doneTimer);
      document.body.style.overflow = "";
    };
  }, [phase === "done"]);

  if (phase === "done") return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background transition-transform duration-700 ease-[cubic-bezier(0.76,0,0.24,1)] ${
        phase === "out" ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <h1 className="flex overflow-hidden font-display text-5xl sm:text-7xl md:text-8xl font-semibold tracking-tight text-foreground">
        {NAME.split("").map((char, i) => (
          <span
            key={i}
            className="splash-letter inline-block"
            style={{ animationDelay: `${150 + i * 70}ms` }}
          >
            {char === " " ? "\u00A0" : char}
          </span>
        ))}
      </h1>
      <div className="mt-6 h-px w-40 overflow-hidden bg-border">
        <div className="splash-line h-full bg-accent" />
      </div>
      <p className="splash-tagline mt-4 text-xs uppercase tracking-[0.3em] text-muted-foreground">
        Portfolio
      </p>
    </div>
  );
};

export default SplashScreen;
