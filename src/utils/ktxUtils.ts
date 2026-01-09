import { WebGLRenderer } from "three";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";

let ktx2Loader: KTX2Loader | null = null;

export function getKTX2Loader(): KTX2Loader {
  if (!ktx2Loader) {
    const renderer = new WebGLRenderer();
    ktx2Loader = new KTX2Loader();
    ktx2Loader.setTranscoderPath("/basis/");
    ktx2Loader.detectSupport(renderer);
    renderer.dispose();
  }
  return ktx2Loader;
}
