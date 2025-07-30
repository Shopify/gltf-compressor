import { Box, Github, Moon, Shield, Sun, Upload } from "lucide-react";
import { useDropzone } from "react-dropzone";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { importFiles } from "@/utils/fileIO";
import "../App.css";

import { useViewportStore } from "@/stores/useViewportStore";
import { useTheme } from "./ThemeProvider";

export function Dropzone() {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: importFiles,
    noClick: true,
    noKeyboard: true,
  });

  const { theme, setTheme } = useTheme();

  const { loadingFiles } = useViewportStore();

  return (
    <div className="min-h-screen flex flex-col" {...getRootProps()}>
      {/* Header */}
      <header className="border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Box className="w-8 h-8 text-blue-600 " />
            <span className="text-xl font-bold text-foreground">
              glTF Compressor
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.open(
                  "https://github.com/Shopify/gltf-compressor",
                  "_blank"
                );
              }}
            >
              <Github className="w-4 h-4" />
              <span className="sr-only">GitHub</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section with Dropzone */}
      <section className="container mx-auto px-4 py-16 text-center flex-1 flex items-center">
        <div className="max-w-4xl mx-auto w-full">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight tracking-tight">
            Easily compress your{" "}
            <span className="relative whitespace-nowrap text-blue-600">
              <svg
                aria-hidden="true"
                viewBox="0 0 418 42"
                className="absolute top-2/3 left-0 h-[0.58em] w-full fill-blue-300/70 dark:fill-blue-400/50"
                preserveAspectRatio="none"
              >
                <path d="M203.371.916c-26.013-2.078-76.686 1.963-124.73 9.946L67.3 12.749C35.421 18.062 18.2 21.766 6.004 25.934 1.244 27.561.828 27.778.874 28.61c.07 1.214.828 1.121 9.595-1.176 9.072-2.377 17.15-3.92 39.246-7.496C123.565 7.986 157.869 4.492 195.942 5.046c7.461.108 19.25 1.696 19.17 2.582-.107 1.183-7.874 4.31-25.75 10.366-21.992 7.45-35.43 12.534-36.701 13.884-2.173 2.308-.202 4.407 4.442 4.734 2.654.187 3.263.157 15.593-.78 35.401-2.686 57.944-3.488 88.365-3.143 46.327.526 75.721 2.23 130.788 7.584 19.787 1.924 20.814 1.98 24.557 1.332l.066-.011c1.201-.203 1.53-1.825.399-2.335-2.911-1.31-4.893-1.604-22.048-3.261-57.509-5.556-87.871-7.36-132.059-7.842-23.239-.254-33.617-.116-50.627.674-11.629.54-42.371 2.494-46.696 2.967-2.359.259 8.133-3.625 26.504-9.81 23.239-7.825 27.934-10.149 28.304-14.005.417-4.348-3.529-6-16.878-7.066Z" />
              </svg>
              <span className="relative">glTF files</span>
            </span>
          </h1>

          {/* Main Dropzone Area */}
          <div className="max-w-2xl mx-auto mb-8">
            <div
              className={`
                relative border-2 border-dashed rounded-xl p-12 transition-all duration-300 cursor-pointer
                ${
                  isDragActive
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/50 scale-105"
                    : "border-border hover:border-blue-400 dark:hover:border-blue-500 hover:bg-muted/50"
                }
              `}
              tabIndex={0}
              role="button"
              aria-label="Upload files"
              onClick={() => {
                // Create a file input and trigger it when the dashed area is clicked
                const input = document.createElement("input");
                input.type = "file";
                input.multiple = true;
                input.onchange = (e) => {
                  const files = Array.from(
                    (e.target as HTMLInputElement).files || []
                  );
                  if (files.length > 0) {
                    importFiles(files);
                  }
                };
                input.click();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  const input = document.createElement("input");
                  input.type = "file";
                  input.multiple = true;
                  input.onchange = (e) => {
                    const files = Array.from(
                      (e.target as HTMLInputElement).files || []
                    );
                    if (files.length > 0) {
                      importFiles(files);
                    }
                  };
                  input.click();
                }
              }}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center space-y-4">
                <div
                  className={`
                  p-4 rounded-full transition-colors duration-300
                  ${
                    isDragActive
                      ? "bg-blue-600 text-white"
                      : "bg-muted text-muted-foreground"
                  }
                `}
                >
                  <Upload className="w-8 h-8" />
                </div>
                {loadingFiles ? (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground mb-2">
                      Loading
                    </p>
                    <p className="text-muted-foreground mb-4">
                      Please wait while your files are loaded
                    </p>
                    <div className="inline-flex items-center justify-center h-9 px-4 py-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:-0.2s]"></div>
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:-0.1s]"></div>
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-duration:0.6s]"></div>
                      </div>
                    </div>
                  </div>
                ) : isDragActive ? (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      Drop your files here
                    </p>
                    <p className="text-muted-foreground mt-2 mb-4">
                      Release to load files
                    </p>
                    <Button className="bg-blue-600 hover:enabled:bg-blue-500 text-white pointer-events-none">
                      Let&apos;s go!
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground mb-2">
                      Drag & drop your glTF files here
                    </p>
                    <p className="text-muted-foreground mb-4">
                      Upload a single .glb file or a single .gltf file with its
                      external binaries & textures
                    </p>
                    <Button className="bg-blue-600 hover:enabled:bg-blue-500 text-white">
                      <Upload className="w-4 h-4" />
                      Choose Files
                    </Button>
                  </div>
                )}
              </div>

              <div className="absolute top-4 right-4">
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/50"
                >
                  <Shield className="w-3 h-3 mr-1" />
                  100% Client-side
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-4 text-center">
        <a
          className="text-sm text-muted-foreground hover:underline"
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
      </footer>
    </div>
  );
}
