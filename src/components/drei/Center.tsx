import { forwardRef, JSX, useEffect, useImperativeHandle, useRef } from "react";
import { Box3, Group, Sphere, Vector3 } from "three";

export interface OnCenterCallbackProps {
  width: number;
  height: number;
  depth: number;
  radius: number;
  center: Vector3;
}

export type CenterProps = JSX.IntrinsicElements["group"] & {
  onCentered?: (props: OnCenterCallbackProps) => void;
};

const Center = forwardRef(function Center(
  { children, onCentered, ...props }: CenterProps,
  fRef
) {
  const ref = useRef<Group>(null);
  const outer = useRef<Group>(null);
  const inner = useRef<Group>(null);
  const isCentered = useRef(false);

  useEffect(() => {
    if (!ref.current || !outer.current || !inner.current || isCentered.current)
      return;

    isCentered.current = true;
    outer.current.matrixWorld.identity();
    ref.current.traverse((object) => {
      object.updateMatrixWorld(true);
    });
    const box3 = new Box3().setFromObject(inner.current, true);
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
        width,
        height,
        depth,
        radius: sphere.radius,
        center,
      });
    }
  }, [onCentered]);

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
