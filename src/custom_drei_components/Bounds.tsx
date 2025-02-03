import { useFrame, useThree } from "@react-three/fiber";
import { createContext, useContext, useMemo, useRef, useState } from "react";
import { Box3, Object3D, Vector3 } from "three";

export type SizeProps = {
  box: Box3;
  size: Vector3;
  center: Vector3;
  distance: number;
};

export type BoundsApi = {
  getSize: () => SizeProps;
  refresh(object?: Object3D | Box3): BoundsApi;
  reset(): BoundsApi;
  fit(): BoundsApi;
  clip(): BoundsApi;
};

export type BoundsProps = JSX.IntrinsicElements["group"] & {
  maxDuration?: number;
  margin?: number;
  observe?: boolean;
  fit?: boolean;
  clip?: boolean;
  interpolateFunc?: (t: number) => number;
  onFit?: (data: SizeProps) => void;
};

enum AnimationStateEnum {
  NONE = 0,
  START = 1,
  ACTIVE = 2,
}

const AnimationState = (function (AnimationState: { [key: string]: any }) {
  AnimationState[AnimationState.NONE] = "NONE";
  AnimationState[AnimationState.START] = "START";
  AnimationState[AnimationState.ACTIVE] = "ACTIVE";
  return AnimationState;
})(AnimationStateEnum || {});
const isBox3 = (def: any) => def && def.isBox3;
const interpolateFuncDefault = (t: number) => {
  // Imitates the previously used MathUtils.damp
  return 1 - Math.exp(-5 * t) + 0.007 * t;
};
const context = createContext<BoundsApi | null>(null);

function Bounds({
  children,
  maxDuration = 1.0,
  margin = 1.2,
  interpolateFunc = interpolateFuncDefault,
}: BoundsProps) {
  const ref = useRef(null);
  const { camera } = useThree();
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
  const animationState = useRef(AnimationState.NONE);
  const t = useRef(0); // represent animation state from 0 to 1

  const [box] = useState(() => new Box3());

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
      const distance = margin * Math.max(fitHeightDistance, fitWidthDistance);
      return {
        box,
        size: boxSize,
        center,
        distance,
      };
    }

    return {
      getSize,
      refresh(object: any) {
        if (isBox3(object)) box.copy(object);
        else {
          const target = object || ref.current;
          if (!target) return this;
          target.traverse((obj: Object3D) => {
            obj.updateMatrixWorld(true);
          });
          target.updateWorldMatrix(true, true);
          box.setFromObject(target);
        }
        if (box.isEmpty()) {
          const max = camera.position.length() || 10;
          box.setFromCenterAndSize(new Vector3(), new Vector3(max, max, max));
        }
        origin.current.camPos.copy(camera.position);
        goal.current.camPos = undefined;
        goal.current.camZoom = undefined;
        goal.current.target = undefined;
        return this;
      },
      reset() {
        const { center, distance } = getSize();
        const direction = camera.position.clone().sub(center).normalize();
        goal.current.camPos = center
          .clone()
          .addScaledVector(direction, distance);
        goal.current.target = center.clone();
        animationState.current = AnimationState.START;
        t.current = 0;
        return this;
      },
      fit() {
        return this.reset();
      },
      clip() {
        const { distance } = getSize();
        camera.near = distance / 100;
        camera.far = distance * 100;
        camera.updateProjectionMatrix();
        if (controls) {
          // @ts-ignore
          controls.maxDistance = distance * 10;
          // @ts-ignore
          controls.update();
        }
        return this;
      },
    };
  }, [box, camera, controls, margin]);

  useFrame((_state, delta) => {
    if (animationState.current === AnimationState.START) {
      animationState.current = AnimationState.ACTIVE;
    } else if (animationState.current === AnimationState.ACTIVE) {
      t.current += delta / maxDuration;
      if (t.current >= 1) {
        goal.current.camPos && camera.position.copy(goal.current.camPos);
        camera.lookAt(new Vector3(0, 0, 0));
        camera.updateMatrixWorld();
        camera.updateProjectionMatrix();
        animationState.current = AnimationState.NONE;
      } else {
        const k = interpolateFunc(t.current);
        goal.current.camPos &&
          camera.position.lerpVectors(
            origin.current.camPos,
            goal.current.camPos,
            k
          );
        camera.lookAt(new Vector3(0, 0, 0));
        camera.updateMatrixWorld();
        camera.updateProjectionMatrix();
      }
    }
  });

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
