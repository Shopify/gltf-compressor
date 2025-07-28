import { easings, useSpring } from "@react-spring/web";
import { useThree } from "@react-three/fiber";
import {
  createContext,
  JSX,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { Box3, Group, Object3D, Vector3 } from "three";

export interface SizeProps {
  box: Box3;
  size: Vector3;
  center: Vector3;
  distance: number;
}

export interface BoundsApi {
  getSize: () => SizeProps;
  refresh(): BoundsApi;
  reset(): BoundsApi;
  fit(): BoundsApi;
  clip(): BoundsApi;
}

const context = createContext<BoundsApi | null>(null);

function Bounds({ children }: JSX.IntrinsicElements["group"]) {
  const ref = useRef<Group>(null);
  const camera = useThree((state) => state.camera);
  const controls = useThree((state) => state.controls);
  const origin = useRef({
    camPos: new Vector3(),
    camZoom: 1,
  });
  const goal = useRef<{
    camPos: Vector3 | undefined;
    camZoom: number | undefined;
    target: Vector3 | undefined;
  }>({
    camPos: undefined,
    camZoom: undefined,
    target: undefined,
  });
  const maxDistance = useRef(0);

  const [box] = useState(() => new Box3());

  const [cameraSpring, cameraSpringAPI] = useSpring(() => ({
    from: { progress: 0.0 },
    config: {
      easing: easings.easeOutCubic,
      duration: 1000,
    },
    onStart: () => {
      if (controls) {
        // @ts-ignore
        controls.enabled = false;
      }
    },
    onChange: () => {
      const currProgress = cameraSpring.progress.get();
      if (goal.current.camPos) {
        camera.position.lerpVectors(
          origin.current.camPos,
          goal.current.camPos,
          currProgress
        );
      }
      camera.lookAt(new Vector3(0, 0, 0));
      camera.updateMatrixWorld();
      camera.updateProjectionMatrix();
    },
    onRest: () => {
      if (goal.current.camPos) {
        camera.position.copy(goal.current.camPos);
      }
      camera.lookAt(new Vector3(0, 0, 0));
      camera.updateMatrixWorld();
      camera.updateProjectionMatrix();
      if (controls) {
        // @ts-ignore
        controls.enabled = true;
        // @ts-ignore
        controls.maxDistance = maxDistance.current;
        // @ts-ignore
        controls.update();
      }
    },
  }));

  const api = useMemo(() => {
    function getSize() {
      const boxSize = box.getSize(new Vector3());
      const center = box.getCenter(new Vector3());
      const maxSize = Math.max(boxSize.x, boxSize.y, boxSize.z);
      const fitHeightDistance =
        // @ts-ignore
        maxSize / (2 * Math.atan((Math.PI * camera.fov) / 360));
      // @ts-ignore
      const fitWidthDistance = fitHeightDistance / camera.aspect;
      const margin = 1.5;
      const distance = margin * Math.max(fitHeightDistance, fitWidthDistance);
      return {
        box,
        size: boxSize,
        center,
        distance,
      };
    }

    const apiObject = {
      getSize,
      refresh() {
        const target = ref.current;
        if (!target) return apiObject;
        target.traverse((object: Object3D) => {
          object.updateMatrixWorld(true);
        });
        target.updateWorldMatrix(true, true);
        box.setFromObject(target, true);
        if (box.isEmpty()) {
          const max = camera.position.length() || 10;
          box.setFromCenterAndSize(new Vector3(), new Vector3(max, max, max));
        }
        origin.current.camPos.copy(camera.position);
        goal.current.camPos = undefined;
        goal.current.camZoom = undefined;
        goal.current.target = undefined;
        return apiObject;
      },
      reset() {
        const { center, distance } = getSize();
        const direction = camera.position.clone().sub(center).normalize();
        goal.current.camPos = center
          .clone()
          .addScaledVector(direction, distance);
        goal.current.target = center.clone();
        maxDistance.current = distance * 10;
        cameraSpringAPI.start({
          from: { progress: 0.0 },
          to: { progress: 1.0 },
        });
        return apiObject;
      },
      fit() {
        return apiObject.reset();
      },
      clip() {
        const { distance } = getSize();
        camera.near = distance / 100;
        camera.far = distance * 100;
        camera.updateProjectionMatrix();
        return apiObject;
      },
    };

    return apiObject;
  }, [box, camera, cameraSpringAPI]);

  return (
    <group ref={ref}>
      <context.Provider value={api}>{children}</context.Provider>
    </group>
  );
}

function useBounds() {
  return useContext(context);
}

export { Bounds, useBounds };
