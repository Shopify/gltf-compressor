import { EXPORT_FOLDER_ORDER } from "@/constants";
import { useModelStore } from "@/stores/useModelStore";
import { exportDocument } from "@/utils/documentUtils";
import { button, useControls } from "leva";
import { useRef } from "react";

export function ExportPanel() {
  const useDracoCompressionRef = useRef(false);

  useControls(
    "Export",
    {
      "Use Draco Compression": {
        value: false,
        onChange: (value) => {
          useDracoCompressionRef.current = value;
        },
      },
      Export: button(async () => {
        const { modifiedDocument } = useModelStore.getState();
        if (!modifiedDocument) return;

        await exportDocument(modifiedDocument, useDracoCompressionRef.current);
      }),
    },
    { collapsed: false, order: EXPORT_FOLDER_ORDER }
  );

  return null;
}
