import { useEffect, useRef, useState } from "react";

export function useTimerFullscreen() {
  const timerPanelRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSmallScreenDevice, setIsSmallScreenDevice] = useState(false);
  const [fullscreenMessage, setFullscreenMessage] = useState("");
  const fullscreenIsAvailable =
    typeof document !== "undefined" &&
    document.fullscreenEnabled &&
    typeof Element !== "undefined" &&
    typeof Element.prototype.requestFullscreen === "function";

  useEffect(() => {
    const smallScreenQuery = window.matchMedia("(max-width: 1024px)");

    function updateSmallScreenDevice() {
      setIsSmallScreenDevice(
        smallScreenQuery.matches &&
          (navigator.maxTouchPoints > 0 ||
            window.matchMedia("(pointer: coarse)").matches),
      );
    }

    updateSmallScreenDevice();
    smallScreenQuery.addEventListener("change", updateSmallScreenDevice);

    return () =>
      smallScreenQuery.removeEventListener("change", updateSmallScreenDevice);
  }, []);

  useEffect(() => {
    function handleFullscreenChange() {
      const timerIsFullscreen =
        document.fullscreenElement === timerPanelRef.current;

      setIsFullscreen(timerIsFullscreen);

      if (
        !timerIsFullscreen &&
        isSmallScreenDevice &&
        typeof screen.orientation?.unlock === "function"
      ) {
        try {
          screen.orientation.unlock();
        } catch {
          // Exiting fullscreen remains safe when orientation unlock is rejected.
        }
      }

      setFullscreenMessage(
        timerIsFullscreen
          ? isSmallScreenDevice
            ? "Timer entered full screen. Keep your device in portrait orientation."
            : "Timer entered full screen. Press Escape to exit."
          : "",
      );
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [isSmallScreenDevice]);

  async function toggleTimerFullscreen() {
    const timerPanel = timerPanelRef.current;

    if (!timerPanel || !fullscreenIsAvailable) {
      setFullscreenMessage("Full screen is not available in this browser.");
      return;
    }

    try {
      if (document.fullscreenElement === timerPanel) {
        await document.exitFullscreen();
      } else {
        await timerPanel.requestFullscreen();

        if (
          isSmallScreenDevice &&
          typeof screen.orientation?.lock === "function"
        ) {
          try {
            await screen.orientation.lock("portrait");
          } catch {
            setFullscreenMessage(
              "Portrait lock is unavailable. Rotate your device upright to use the full-screen timer.",
            );
          }
        }
      }
    } catch {
      setFullscreenMessage(
        "The timer could not enter full screen. Try the control again.",
      );
    }
  }

  return {
    fullscreenIsAvailable,
    fullscreenMessage,
    isFullscreen,
    isSmallScreenDevice,
    timerPanelRef,
    toggleTimerFullscreen,
  };
}
