import { useEffect, useMemo, useState } from "react";
import { Download, Smartphone } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "@/hooks/use-toast";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function isStandaloneDisplayMode(): boolean {
  if (typeof window === "undefined") return false;

  // Chromium / most browsers
  if (window.matchMedia?.("(display-mode: standalone)")?.matches) return true;

  // iOS Safari
  const nav = navigator as unknown as { standalone?: boolean };
  if (nav?.standalone) return true;

  return false;
}

function isProbablyMobileDevice(): boolean {
  if (typeof window === "undefined") return false;

  const nav = navigator as unknown as {
    userAgentData?: { mobile?: boolean };
    userAgent?: string;
    maxTouchPoints?: number;
  };

  if (typeof nav.userAgentData?.mobile === "boolean") return nav.userAgentData.mobile;

  const ua = nav.userAgent ?? "";
  if (/Android|iPhone|iPad|iPod/i.test(ua)) return true;

  // Fallback: touch device + small viewport (helps some Android browsers)
  const touch = (nav.maxTouchPoints ?? 0) > 0;
  const small = typeof window !== "undefined" ? window.innerWidth < 768 : false;
  return touch && small;
}

function isIOS(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent ?? "";
  return /iPhone|iPad|iPod/i.test(ua);
}

async function hasInstalledRelatedApp(): Promise<boolean> {
  // Optional API (Chrome/Edge on some platforms)
  const nav = navigator as unknown as {
    getInstalledRelatedApps?: () => Promise<Array<unknown>>;
  };

  if (!nav.getInstalledRelatedApps) return false;

  try {
    const related = await nav.getInstalledRelatedApps();
    return Array.isArray(related) && related.length > 0;
  } catch {
    return false;
  }
}

export function PwaInstallBanner() {
  const isMobileViewport = useIsMobile();
  const [installed, setInstalled] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    let mounted = true;

    const updateInstalled = async () => {
      const standalone = isStandaloneDisplayMode();
      const related = standalone ? false : await hasInstalledRelatedApp();
      if (!mounted) return;
      setInstalled(standalone || related);
    };

    void updateInstalled();

    const onAppInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    const onBeforeInstallPrompt = (e: Event) => {
      // We want to control when to show the prompt (button click)
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("appinstalled", onAppInstalled);
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    const mql = window.matchMedia?.("(display-mode: standalone)");
    const onMqlChange = () => void updateInstalled();

    if (mql?.addEventListener) mql.addEventListener("change", onMqlChange);

    return () => {
      mounted = false;
      window.removeEventListener("appinstalled", onAppInstalled);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      if (mql?.removeEventListener) mql.removeEventListener("change", onMqlChange);
    };
  }, []);

  const canPromptInstall = useMemo(() => !!deferredPrompt, [deferredPrompt]);
  const shouldShowOnThisDevice = useMemo(() => isProbablyMobileDevice() || isMobileViewport, [isMobileViewport]);

  if (installed) return null;
  if (!shouldShowOnThisDevice) return null;

  return (
    <Alert className="mb-4 bg-muted/40">
      <Smartphone className="h-4 w-4" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <AlertTitle>Cài SmartCanteen như ứng dụng</AlertTitle>
          <AlertDescription>
            <p>
              Cài để nhận thông báo khi đơn hoàn thành, kể cả khi bạn đóng tab/trình duyệt.
            </p>
          </AlertDescription>
        </div>

        <Button
          type="button"
          size="sm"
          className="shrink-0"
          onClick={async () => {
            const p = deferredPrompt;

            if (p) {
              try {
                await p.prompt();
                const choice = await p.userChoice;
                setDeferredPrompt(null);
                if (choice?.outcome === "accepted") setInstalled(true);
              } catch {
                // ignore
              }
              return;
            }

            toast({
              title: "Cách cài đặt",
              description: isIOS()
                ? "Safari: bấm nút Share → Add to Home Screen."
                : "Chrome/Cốc Cốc: mở menu ⋮ → Install app / Add to Home screen.",
            });
          }}
        >
          <Download className="h-4 w-4" />
          Cài đặt
        </Button>
      </div>
    </Alert>
  );
}
