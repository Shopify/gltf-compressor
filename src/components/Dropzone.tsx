import type { DropEvent, FileRejection } from "react-dropzone";
import { useDropzone } from "react-dropzone";

interface DropzoneProps {
  onDrop: <T extends File>(
    acceptedFiles: T[],
    fileRejections: FileRejection[],
    event: DropEvent
  ) => void;
}

export function Dropzone({ onDrop }: DropzoneProps) {
  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
    });

  return (
    <div
      className="h-full w-screen flex flex-col items-center justify-center text-center"
      {...getRootProps()}
    >
      <input {...getInputProps()} />

      {isDragActive ? (
        <p className="text-4xl font-bold text-blue-600">
          Drop the files here...
        </p>
      ) : (
        <p className="text-4xl font-bold">
          Drag {"'"}n{"'"} drop your GLTF file{" "}
          <button className="text-blue-600">here</button>
        </p>
      )}
      {fileRejections.length ? (
        <p className="block text-center text-xl pt-4 text-red-300">
          Only .gltf or .glb files are accepted
        </p>
      ) : null}
    </div>
  );
}
