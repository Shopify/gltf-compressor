import { useModelStore } from "@/stores/useModelStore";
import { useViewportStore } from "@/stores/useViewportStore";
import { ThreeElements, useFrame, useThree } from '@react-three/fiber';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { Color, ColorRepresentation, CubeTexture, DoubleSide, Group, Material, Mesh, MeshDepthMaterial, OrthographicCamera, PlaneGeometry, ShaderMaterial, Texture, WebGLRenderTarget } from 'three';
import { HorizontalBlurShader, VerticalBlurShader } from 'three-stdlib';

export type ContactShadowsProps = Omit<ThreeElements['group'], 'ref' | 'scale'> & {
  opacity?: number;
  width?: number;
  height?: number;
  blur?: number;
  near?: number;
  far?: number;
  smooth?: boolean;
  resolution?: number;
  frames?: number;
  scale?: number | [x: number, y: number];
  color?: ColorRepresentation;
  depthWrite?: boolean;
};

export const ContactShadows = forwardRef<Group, ContactShadowsProps>(
  (
    {
      scale = 10,
      frames = Infinity,
      opacity = 1,
      width = 1,
      height = 1,
      blur = 1,
      near = 0,
      far = 10,
      resolution = 512,
      smooth = true,
      color = '#000000',
      depthWrite = false,
      renderOrder,
      ...props
    },
    fref
  ) => {
    const ref = useRef<Group>(null);
    const shadowPlaneRef = useRef<Mesh>(null);
    const scene = useThree((state) => state.scene);
    const gl = useThree((state) => state.gl);
    const shadowCamera = useRef<OrthographicCamera>(null);
    width = width * (Array.isArray(scale) ? scale[0] : scale || 1);
    height = height * (Array.isArray(scale) ? scale[1] : scale || 1);

    const [
      renderTarget,
      planeGeometry,
      depthMaterial,
      blurPlane,
      horizontalBlurMaterial,
      verticalBlurMaterial,
      renderTargetBlur,
    ] = useMemo(() => {
      const renderTarget = new WebGLRenderTarget(resolution, resolution);
      const renderTargetBlur = new WebGLRenderTarget(resolution, resolution);
      renderTargetBlur.texture.generateMipmaps = renderTarget.texture.generateMipmaps = false;
      const planeGeometry = new PlaneGeometry(width, height).rotateX(Math.PI / 2);
      const blurPlane = new Mesh(planeGeometry);
      const depthMaterial = new MeshDepthMaterial({ side: DoubleSide });
      depthMaterial.depthTest = depthMaterial.depthWrite = false;
      depthMaterial.onBeforeCompile = (shader) => {
        shader.uniforms = {
          ...shader.uniforms,
          ucolor: {
            value: new Color(color),
          },
        };

        shader.fragmentShader = shader.fragmentShader.replace(
          `void main() {`,
          //
          `uniform vec3 ucolor;
           void main() {
          `
        );

        shader.fragmentShader = shader.fragmentShader.replace(
          'vec4( vec3( 1.0 - fragCoordZ ), opacity );',
          // Colorize the shadow, multiply by the falloff so that the center can remain darker
          'vec4( ucolor * fragCoordZ * 2.0, ( 1.0 - fragCoordZ ) * 1.0 );'
        );
      };
      const horizontalBlurMaterial = new ShaderMaterial(HorizontalBlurShader);
      const verticalBlurMaterial = new ShaderMaterial(VerticalBlurShader);
      verticalBlurMaterial.depthTest = horizontalBlurMaterial.depthTest = false;
      return [
        renderTarget,
        planeGeometry,
        depthMaterial,
        blurPlane,
        horizontalBlurMaterial,
        verticalBlurMaterial,
        renderTargetBlur,
      ];
    }, [resolution, width, height, color]);

    const blurShadows = (blur: number) => {
      blurPlane.visible = true;
      blurPlane.material = horizontalBlurMaterial;
      horizontalBlurMaterial.uniforms.tDiffuse.value = renderTarget.texture;
      horizontalBlurMaterial.uniforms.h.value = (blur * 1) / 256;
      gl.setRenderTarget(renderTargetBlur);
      gl.render(blurPlane, shadowCamera.current!);
      blurPlane.material = verticalBlurMaterial;
      verticalBlurMaterial.uniforms.tDiffuse.value = renderTargetBlur.texture;
      verticalBlurMaterial.uniforms.v.value = (blur * 1) / 256;
      gl.setRenderTarget(renderTarget);
      gl.render(blurPlane, shadowCamera.current!);
      blurPlane.visible = false;
    };

    let count = 0;
    let initialBackground: Color | Texture | CubeTexture | null;
    let initialOverrideMaterial: Material | null;

    useFrame(() => {
      if (shadowCamera.current && (frames === Infinity || count < frames)) {
        count++;
        initialBackground = scene.background;
        initialOverrideMaterial = scene.overrideMaterial;
        ref.current!.visible = false;
        scene.background = null;
        scene.overrideMaterial = depthMaterial;
        const modifiedScene = useModelStore.getState().modifiedScene;
        const modifiedSceneVisibility = modifiedScene?.visible ?? false;
        if (modifiedScene) {
          modifiedScene.visible = true;
        }
        gl.setRenderTarget(renderTarget);
        gl.render(scene, shadowCamera.current);
        if (modifiedScene) {
          modifiedScene.visible = modifiedSceneVisibility;
        }
        blurShadows(blur);
        if (smooth) blurShadows(blur * 0.4);
        gl.setRenderTarget(null);
        ref.current!.visible = true;
        scene.overrideMaterial = initialOverrideMaterial;
        scene.background = initialBackground;
      }
    });

    useImperativeHandle(fref, () => ref.current!, []);

    useEffect(() => {
      if (shadowPlaneRef.current) {
        useViewportStore.setState({ shadowPlane: shadowPlaneRef.current });
      }
    }, []);

    useEffect(() => {
      const unsubscribe = useViewportStore.subscribe(
        (state) => state.showContactShadows,
        (showContactShadows) => {
          if (shadowPlaneRef.current) {
            shadowPlaneRef.current.visible = showContactShadows;
          }
        }
      );

      return () => {
        unsubscribe();
      };
    }, []);

    return (
      <group rotation-x={Math.PI / 2} {...props} ref={ref}>
        <mesh
          ref={shadowPlaneRef}
          renderOrder={renderOrder}
          geometry={planeGeometry}
          scale={[1, -1, 1]}
          rotation={[-Math.PI / 2, 0, 0]}
          visible={false}
        >
          <meshBasicMaterial
            transparent
            map={renderTarget.texture}
            opacity={opacity}
            depthWrite={depthWrite}
          />
        </mesh>
        <orthographicCamera
          ref={shadowCamera}
          args={[-width / 2, width / 2, height / 2, -height / 2, near, far]}
        />
      </group>
    );
  }
);

ContactShadows.displayName = 'ContactShadows';
