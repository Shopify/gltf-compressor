import {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from "react";
import { Box3, Group, Object3D, Sphere, Vector3 } from "three";

export type OnCenterCallbackProps = {
  parent: Object3D;
  container: Object3D;
  width: number;
  height: number;
  depth: number;
  boundingBox: Box3;
  boundingSphere: Sphere;
  center: Vector3;
};

export type CenterProps = JSX.IntrinsicElements["group"] & {
  precise?: boolean;
  onCentered?: (props: OnCenterCallbackProps) => void;
  cacheKey?: any;
};

const Center = forwardRef(function Center(
  { children, onCentered, precise = true, cacheKey = 0, ...props }: CenterProps,
  fRef
) {
  const ref = useRef<Group>(null);
  const outer = useRef<Group>(null);
  const inner = useRef<Group>(null);
  useLayoutEffect(() => {
    if (!ref.current || !outer.current || !inner.current) return;

    outer.current.matrixWorld.identity();
    ref.current.traverse((object) => {
      object.updateMatrixWorld(true);
    });
    const box3 = new Box3().setFromObject(inner.current, precise);
    const center = new Vector3();
    const sphere = new Sphere();
    const width = box3.max.x - box3.min.x;
    const height = box3.max.y - box3.min.y;
    const depth = box3.max.z - box3.min.z;
    box3.getCenter(center);
    box3.getBoundingSphere(sphere);
    outer.current.position.set(-center.x, -center.y, -center.z);

    // Only fire onCentered if the bounding box has changed
    if (typeof onCentered !== "undefined" && ref.current.parent) {
      onCentered({
        parent: ref.current.parent,
        container: ref.current,
        width,
        height,
        depth,
        boundingBox: box3,
        boundingSphere: sphere,
        center: center,
      });
    }
  }, [cacheKey, onCentered, precise]);
  useImperativeHandle(fRef, () => ref.current, []);
  return (
    <group ref={ref} {...props}>
      <group ref={outer}>
        <group ref={inner}>{children}</group>
      </group>
    </group>
  );
});

export { Center };
