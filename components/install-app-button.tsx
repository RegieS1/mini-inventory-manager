"use client";

import { useEffect, useState } from "react";

type InstallPrompt = Event & { prompt: () => Promise<void> };

export function InstallAppButton() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);

  useEffect(() => {
    function onPrompt(event: Event) {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    }

    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!prompt) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => void prompt.prompt()}
      className="rounded-lg bg-copper px-4 py-2.5 text-sm font-semibold text-on-copper transition hover:brightness-110 active:translate-y-px active:brightness-90"
    >
      Install app
    </button>
  );
}
