import { useFrame, useThree } from "@react-three/fiber";
import * as React from "react";
import * as THREE from "three";

var AnimationState = /*#__PURE__*/ (function (AnimationState) {
  AnimationState[(AnimationState["NONE"] = 0)] = "NONE";
  AnimationState[(AnimationState["START"] = 1)] = "START";
  AnimationState[(AnimationState["ACTIVE"] = 2)] = "ACTIVE";
  return AnimationState;
})(AnimationState || {});
const isOrthographic = (def) => def && def.isOrthographicCamera;
const isBox3 = (def) => def && def.isBox3;
const interpolateFuncDefault = (t) => {
  // Imitates the previously used THREE.MathUtils.damp
  return 1 - Math.exp(-5 * t) + 0.007 * t;
};
const context = /*#__PURE__*/ React.createContext(null);

function Bounds({
  children,
  maxDuration = 1.0,
  margin = 1.2,
  fit,
  clip,
  interpolateFunc = interpolateFuncDefault,
}) {
  const ref = React.useRef(null);
  const { camera } = useThree();
  const controls = useThree((state) => state.controls);
  const origin = React.useRef({
    camPos: new THREE.Vector3(),
    camRot: new THREE.Quaternion(),
    camZoom: 1,
  });
  const goal = React.useRef({
    camPos: undefined,
    camRot: undefined,
    camZoom: undefined,
    camUp: undefined,
    target: undefined,
  });
  const animationState = React.useRef(AnimationState.NONE);
  const t = React.useRef(0); // represent animation state from 0 to 1

  const [box] = React.useState(() => new THREE.Box3());

  const api = React.useMemo(() => {
    function getSize() {
      const boxSize = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const maxSize = Math.max(boxSize.x, boxSize.y, boxSize.z);
      const fitHeightDistance = isOrthographic(camera)
        ? maxSize * 4
        : maxSize / (2 * Math.atan((Math.PI * camera.fov) / 360));
      const fitWidthDistance = isOrthographic(camera)
        ? maxSize * 4
        : fitHeightDistance / camera.aspect;
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
      refresh(object) {
        if (isBox3(object)) box.copy(object);
        else {
          const target = object || ref.current;
          if (!target) return this;
          target.updateWorldMatrix(true, true);
          box.setFromObject(target);
        }
        if (box.isEmpty()) {
          const max = camera.position.length() || 10;
          box.setFromCenterAndSize(
            new THREE.Vector3(),
            new THREE.Vector3(max, max, max)
          );
        }
        origin.current.camPos.copy(camera.position);
        origin.current.camRot.copy(camera.quaternion);
        isOrthographic(camera) && (origin.current.camZoom = camera.zoom);
        goal.current.camPos = undefined;
        goal.current.camRot = undefined;
        goal.current.camZoom = undefined;
        goal.current.camUp = undefined;
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
        const mCamRot = new THREE.Matrix4().lookAt(
          goal.current.camPos,
          goal.current.target,
          camera.up
        );
        goal.current.camRot = new THREE.Quaternion().setFromRotationMatrix(
          mCamRot
        );
        animationState.current = AnimationState.START;
        t.current = 0;
        return this;
      },
      fit() {
        if (!isOrthographic(camera)) {
          // For non-orthographic cameras, fit should behave exactly like reset
          return this.reset();
        }

        // For orthographic cameras, fit should only modify the zoom value
        let maxHeight = 0,
          maxWidth = 0;
        const vertices = [
          new THREE.Vector3(box.min.x, box.min.y, box.min.z),
          new THREE.Vector3(box.min.x, box.max.y, box.min.z),
          new THREE.Vector3(box.min.x, box.min.y, box.max.z),
          new THREE.Vector3(box.min.x, box.max.y, box.max.z),
          new THREE.Vector3(box.max.x, box.max.y, box.max.z),
          new THREE.Vector3(box.max.x, box.max.y, box.min.z),
          new THREE.Vector3(box.max.x, box.min.y, box.max.z),
          new THREE.Vector3(box.max.x, box.min.y, box.min.z),
        ];

        // Transform the center and each corner to camera space
        const pos = goal.current.camPos || camera.position;
        const target =
          goal.current.target || (controls == null ? void 0 : controls.target);
        const up = goal.current.camUp || camera.up;
        const mCamWInv = target
          ? new THREE.Matrix4()
              .lookAt(pos, target, up)
              .setPosition(pos)
              .invert()
          : camera.matrixWorldInverse;
        for (const v of vertices) {
          v.applyMatrix4(mCamWInv);
          maxHeight = Math.max(maxHeight, Math.abs(v.y));
          maxWidth = Math.max(maxWidth, Math.abs(v.x));
        }
        maxHeight *= 2;
        maxWidth *= 2;
        const zoomForHeight = (camera.top - camera.bottom) / maxHeight;
        const zoomForWidth = (camera.right - camera.left) / maxWidth;
        goal.current.camZoom = Math.min(zoomForHeight, zoomForWidth) / margin;
        animationState.current = AnimationState.START;
        t.current = 0;
        return this;
      },
      clip() {
        const { distance } = getSize();
        camera.near = distance / 100;
        camera.far = distance * 100;
        camera.updateProjectionMatrix();
        if (controls) {
          controls.maxDistance = distance * 10;
          controls.update();
        }
        return this;
      },
    };
  }, [box, camera, controls, margin]);

  useFrame((state, delta) => {
    if (animationState.current === AnimationState.START) {
      animationState.current = AnimationState.ACTIVE;
    } else if (animationState.current === AnimationState.ACTIVE) {
      t.current += delta / maxDuration;
      if (t.current >= 1) {
        goal.current.camPos && camera.position.copy(goal.current.camPos);
        goal.current.camRot && camera.quaternion.copy(goal.current.camRot);
        goal.current.camUp && camera.up.copy(goal.current.camUp);
        goal.current.camZoom &&
          isOrthographic(camera) &&
          (camera.zoom = goal.current.camZoom);
        camera.lookAt(new THREE.Vector3(0, 0, 0));
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
        goal.current.camRot &&
          camera.quaternion.slerpQuaternions(
            origin.current.camRot,
            goal.current.camRot,
            k
          );
        goal.current.camUp &&
          camera.up.set(0, 1, 0).applyQuaternion(camera.quaternion);
        goal.current.camZoom &&
          isOrthographic(camera) &&
          (camera.zoom =
            (1 - k) * origin.current.camZoom + k * goal.current.camZoom);
        camera.lookAt(new THREE.Vector3(0, 0, 0));
        camera.updateMatrixWorld();
        camera.updateProjectionMatrix();
      }
    }
  });

  return /*#__PURE__*/ React.createElement(
    "group",
    {
      ref: ref,
    },
    /*#__PURE__*/ React.createElement(
      context.Provider,
      {
        value: api,
      },
      children
    )
  );
}
function useBounds() {
  return React.useContext(context);
}

export { Bounds, useBounds };
