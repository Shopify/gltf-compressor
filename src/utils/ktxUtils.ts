import { read as readKTX2 } from "ktx-parse";
import {
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
} from "three";
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

export interface KTX2RenderResult {
  canvas: HTMLCanvasElement;
  renderer: WebGLRenderer;
  blobUrl: string;
}

export function renderKTX2Image(
  ktx2Data: Uint8Array,
  width: number,
  height: number
): Promise<KTX2RenderResult> {
  return new Promise((resolve, reject) => {
    const glCanvas = document.createElement("canvas");
    glCanvas.width = width;
    glCanvas.height = height;
    const renderer = new WebGLRenderer({
      canvas: glCanvas,
    });

    const blob = new Blob([ktx2Data as BlobPart], { type: "image/ktx2" });
    const blobUrl = URL.createObjectURL(blob);

    getKTX2Loader().load(
      blobUrl,
      (texture) => {
        texture.colorSpace = SRGBColorSpace;
        const scene = new Scene();
        const aspectRatio = width / height;
        const camera = new OrthographicCamera(
          -1 * aspectRatio,
          aspectRatio,
          1,
          -1,
          0,
          1
        );
        const geometry = new PlaneGeometry(2 * aspectRatio, 2);
        const material = new MeshBasicMaterial({ map: texture });
        const mesh = new Mesh(geometry, material);
        scene.add(mesh);
        renderer.render(scene, camera);

        resolve({ canvas: glCanvas, renderer, blobUrl });
      },
      undefined,
      (error) => {
        renderer.dispose();
        URL.revokeObjectURL(blobUrl);
        reject(error);
      }
    );
  });
}

export interface KTX2Info {
  isHDR: boolean;
  mipLevels: number;
  width: number;
  height: number;
}

const KHR_DF_SAMPLE_DATATYPE_FLOAT = 128;
const KHR_DF_TRANSFER_LINEAR = 1;

export function getKTX2Info(ktx2Data: Uint8Array): KTX2Info {
  const container = readKTX2(ktx2Data);

  let isHDR = false;
  if (container.dataFormatDescriptor?.length > 0) {
    const dfd = container.dataFormatDescriptor[0];
    if (
      dfd.transferFunction === KHR_DF_TRANSFER_LINEAR &&
      dfd.samples?.length > 0
    ) {
      for (const sample of dfd.samples) {
        if ((sample.channelType & KHR_DF_SAMPLE_DATATYPE_FLOAT) !== 0) {
          isHDR = true;
          break;
        }
      }
    }
  }

  return {
    isHDR,
    mipLevels: container.levels.length,
    width: container.pixelWidth,
    height: container.pixelHeight,
  };
}

export function decodeKTX2ToPNG(
  ktx2Data: Uint8Array,
  width: number,
  height: number
): Promise<Uint8Array> {
  return renderKTX2Image(ktx2Data, width, height).then(
    ({ canvas: glCanvas, renderer, blobUrl }) => {
      return new Promise<Uint8Array>((resolve, reject) => {
        // Flip the image vertically (WebGL origin is bottom-left, PNG is top-left)
        const outputCanvas = document.createElement("canvas");
        outputCanvas.width = width;
        outputCanvas.height = height;
        const ctx = outputCanvas.getContext("2d")!;
        ctx.scale(1, -1);
        ctx.drawImage(glCanvas, 0, -height);

        outputCanvas.toBlob(
          (pngBlob) => {
            renderer.dispose();
            URL.revokeObjectURL(blobUrl);

            if (!pngBlob) {
              reject(new Error("Failed to convert KTX2 to PNG"));
              return;
            }

            pngBlob.arrayBuffer().then((buffer) => {
              resolve(new Uint8Array(buffer));
            });
          },
          "image/png",
          1.0
        );
      });
    }
  );
}
