import { useEffect, useRef } from "react";

const MODAL_FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "a[href]",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export function useModalDialog(onClose, initialFocusRef) {
  const dialogRef = useRef(null);
  const closeRef = useRef(onClose);

  closeRef.current = onClose;

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return undefined;
    }

    const previouslyFocusedElement = document.activeElement;
    const backdrop = dialog.closest(".modal-backdrop");
    const shell = dialog.closest(".app-shell");
    const inertedSiblings = [];
    const previousBodyOverflow = document.body.style.overflow;

    shell?.querySelectorAll(":scope > *").forEach((element) => {
      if (element !== backdrop && !element.hasAttribute("inert")) {
        element.setAttribute("inert", "");
        inertedSiblings.push(element);
      }
    });

    document.body.style.overflow = "hidden";

    const initialFocusTarget =
      initialFocusRef?.current ??
      dialog.querySelector("[data-initial-focus]") ??
      dialog.querySelector(MODAL_FOCUSABLE_SELECTOR);

    (initialFocusTarget ?? dialog).focus();

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = [
        ...dialog.querySelectorAll(MODAL_FOCUSABLE_SELECTOR),
      ].filter(
        (element) =>
          !element.hasAttribute("hidden") &&
          element.getAttribute("aria-hidden") !== "true" &&
          element.getClientRects().length > 0,
      );

      if (focusableElements.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements.at(-1);

      if (
        event.shiftKey &&
        (document.activeElement === firstElement ||
          !dialog.contains(document.activeElement))
      ) {
        event.preventDefault();
        lastElement.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === lastElement ||
          !dialog.contains(document.activeElement))
      ) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    dialog.addEventListener("keydown", handleKeyDown);

    return () => {
      dialog.removeEventListener("keydown", handleKeyDown);
      inertedSiblings.forEach((element) => element.removeAttribute("inert"));
      document.body.style.overflow = previousBodyOverflow;

      if (previouslyFocusedElement?.isConnected) {
        previouslyFocusedElement.focus();
      } else {
        document.querySelector("#main-content")?.focus();
      }
    };
  }, [initialFocusRef]);

  return dialogRef;
}
