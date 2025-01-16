import { useState } from "react";

interface DropzoneProps {
  onDrop: (event: React.DragEvent) => void;
}

export function Dropzone({ onDrop }: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        onDrop(e);
        setIsDragging(false);
      }}
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "absolute",
        top: 0,
        left: 0,
        backgroundColor: isDragging ? "rgba(0, 0, 0, 0.1)" : "transparent",
        transition: "background-color 0.2s ease",
        zIndex: 10,
      }}
    >
      {isDragging && (
        <div
          style={{
            padding: "2rem",
            borderRadius: "1rem",
            backgroundColor: "white",
            boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
          }}
        >
          Drop your file here
        </div>
      )}
    </div>
  );
}
