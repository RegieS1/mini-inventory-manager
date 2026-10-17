"use client";

import { useEffect, useState } from "react";

type InstallPrompt = Event & { prompt: () => Promise<void> };

function savedPrompt() {
  return (window as Window & { __kugiInstall?: InstallPrompt }).__kugiInstall ?? null;
}

export function InstallAppButton() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [help, setHelp] = useState<"ios" | "android" | null>(null);

  useEffect(() => {
    setPrompt(savedPrompt());

    function onPrompt(event: Event) {
      event.preventDefault();
      const install = event as InstallPrompt;
      (window as Window & { __kugiInstall?: InstallPrompt }).__kugiInstall = install;
      setPrompt(install);
    }

    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          if (prompt) {
            void prompt.prompt().catch(() => setHelp("android"));
            return;
          }

          const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
          setHelp(ios ? "ios" : "android");
        }}
        className="rounded-lg bg-copper px-4 py-2.5 text-sm font-semibold text-on-copper transition hover:brightness-110 active:translate-y-px active:brightness-90"
      >
        Install app
      </button>
      <p className={`mt-3 text-sm leading-6 ${help === "ios" ? "font-semibold text-ink" : "text-muted"}`}>
        iPhone: pindota ang Share, unya Add to Home Screen.
      </p>
      <p className={`mt-1 text-sm leading-6 ${help === "android" ? "font-semibold text-ink" : "text-muted"}`}>
        Samsung: ayaw pilia ang Install app. Pili ang Add to Home screen. Ang Install app dili mo-install sa Samsung browser.
      </p>
    </div>
  );
}
