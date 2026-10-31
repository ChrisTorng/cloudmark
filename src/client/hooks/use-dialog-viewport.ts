import { useEffect, useState, type CSSProperties } from "react";

/** Keep modal actions inside the visible viewport, including the soft keyboard. */
export function useDialogViewport(open: boolean): CSSProperties {
  const [style, setStyle] = useState<CSSProperties>({});
  useEffect(() => {
    if (!open) return;
    const viewport = window.visualViewport;
    const update = () => setStyle({
      "--bookmark-viewport-height": `${viewport?.height ?? window.innerHeight}px`,
      "--bookmark-viewport-top": `${viewport?.offsetTop ?? 0}px`,
    } as CSSProperties);
    update();
    viewport?.addEventListener("resize", update);
    viewport?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    return () => {
      viewport?.removeEventListener("resize", update);
      viewport?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [open]);
  return style;
}
