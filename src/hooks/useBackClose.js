import { useEffect, useRef } from "react";

/**
 * Makes an open/close boolean (typically driving a full-screen form or modal)
 * participate in browser/native history, so the Android hardware back button
 * (or browser back) closes it instead of leaving the page or exiting the app.
 */
export default function useBackClose(isOpen, onClose) {
  const pushedRef = useRef(false);
  const ignoreNextPopRef = useRef(false);

  useEffect(() => {
    if (isOpen && !pushedRef.current) {
      window.history.pushState({ __modal: true }, "");
      pushedRef.current = true;
    } else if (!isOpen && pushedRef.current) {
      pushedRef.current = false;
      ignoreNextPopRef.current = true;
      window.history.back();
    }
  }, [isOpen]);

  useEffect(() => {
    const handlePopState = () => {
      if (ignoreNextPopRef.current) {
        ignoreNextPopRef.current = false;
        return;
      }
      if (pushedRef.current) {
        pushedRef.current = false;
        onClose();
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [onClose]);
}