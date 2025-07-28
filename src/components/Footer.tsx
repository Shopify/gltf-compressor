import { useCallback, useEffect, useRef } from "react";

import { useViewportStore } from "@/stores/useViewportStore";

export default function Footer() {
  const footerLinksRef = useRef<HTMLDivElement>(null);
  const toggleMessageRef = useRef<HTMLDivElement>(null);

  const updateFooter = useCallback(() => {
    const { modelViewPanelSize, showModifiedDocument } =
      useViewportStore.getState();

    // ModelView + TextureView occupy 80% of window width
    const modelAndTextureViewsWidth = window.innerWidth * 0.8;
    const modelViewWidth =
      (modelAndTextureViewsWidth * modelViewPanelSize) / 100;
    const centerOfModelView = modelViewWidth / 2;

    // This is the width of this text: "Made with 💚 by Shopify | GitHub"
    const footerLinksWidth = 222.3;
    // This is the width of this text: "Hold C to Show Original" or "Release C to Show Compressed"
    const toggleModelMessageWidth = showModifiedDocument ? 166.17 : 202.3;
    const padding = 32;

    // Check if toggle model message would overlap footer links and hide the footer links if it does
    const positionOfLeftEdgeOfToggleModelMessage =
      centerOfModelView - toggleModelMessageWidth / 2;
    const positionOfRightEdgeOfFooterLinks = padding + footerLinksWidth;
    const shouldHideFooterLinks =
      positionOfLeftEdgeOfToggleModelMessage < positionOfRightEdgeOfFooterLinks;

    // Also hide the toggle model message if it's too close to the left edge of the window
    // This prevents it from overlapping the transform gizmo
    const shouldHideToggleMessage =
      positionOfLeftEdgeOfToggleModelMessage < 112;

    if (footerLinksRef.current) {
      footerLinksRef.current.style.opacity = shouldHideFooterLinks ? "0" : "1";
    }

    if (toggleMessageRef.current) {
      toggleMessageRef.current.style.opacity = shouldHideToggleMessage
        ? "0"
        : "1";
      toggleMessageRef.current.style.left = `${centerOfModelView}px`;

      if (showModifiedDocument) {
        toggleMessageRef.current.innerHTML =
          'Hold C to Show<span class="text-blue-400"> Original</span>';
      } else {
        toggleMessageRef.current.innerHTML =
          'Release C to Show<span class="text-green-400"> Compressed</span>';
      }
    }
  }, []);

  useEffect(() => {
    updateFooter();

    // React to changes in the size of the window
    window.addEventListener("resize", updateFooter);

    // React to changes in the size of the ModelView panel
    const unsubscribeModelViewPanelSize = useViewportStore.subscribe(
      (state) => state.modelViewPanelSize,
      () => {
        updateFooter();
      }
    );

    // React to changes in the document being shown
    const unsubscribeShowModifiedDocument = useViewportStore.subscribe(
      (state) => state.showModifiedDocument,
      () => {
        updateFooter();
      }
    );

    return () => {
      window.removeEventListener("resize", updateFooter);
      unsubscribeModelViewPanelSize();
      unsubscribeShowModifiedDocument();
    };
  }, [updateFooter]);

  return (
    <footer className="absolute bottom-4 left-4 right-4 flex justify-between items-center text-white font-mono text-xs pointer-events-none">
      <div
        ref={footerLinksRef}
        className="pointer-events-auto transition-opacity duration-200"
      >
        <a
          className="hover:underline"
          target="_blank"
          rel="noopener noreferrer"
          href="https://shopify.com"
        >
          Made with{" "}
          <span role="img" aria-label="Green heart">
            💚
          </span>{" "}
          by Shopify
        </a>
        <span className="mx-1" aria-hidden="true">
          |
        </span>
        <a
          className="hover:underline"
          target="_blank"
          rel="noopener noreferrer"
          href="https://github.com/Shopify/gltf-compressor"
        >
          GitHub
        </a>
      </div>

      <div
        ref={toggleMessageRef}
        className="absolute transform -translate-x-1/2 transition-opacity duration-200"
      />
    </footer>
  );
}
