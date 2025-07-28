import { Box, Github, Moon, Shield, Sun, Upload } from "lucide-react";
import { useDropzone } from "react-dropzone";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { importFiles } from "@/utils/fileIO";
import "../App.css";

import { useTheme } from "./ThemeProvider";

export function Dropzone() {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: importFiles,
    noClick: true,
    noKeyboard: true,
  });

  const { theme, setTheme } = useTheme();

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
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Compress Your{" "}
            <span className="bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              3D Models
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
                {isDragActive ? (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      Drop your files here
                    </p>
                    <p className="text-muted-foreground mt-2 mb-4">
                      Release to load files
                    </p>
                    {/* Hidden button to maintain spacing */}
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
                      We support .glb files and .gltf files with separate
                      binaries and textures
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
