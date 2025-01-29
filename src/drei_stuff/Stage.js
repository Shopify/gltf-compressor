import _extends from "@babel/runtime/helpers/esm/extends";
import { Center, Environment } from "@react-three/drei";
import * as React from "react";
import { Bounds, useBounds } from "./Bounds.js";

const presets = {
  rembrandt: {
    main: [1, 2, 1],
    fill: [-2, -0.5, -2],
  },
  portrait: {
    main: [-1, 2, 0.5],
    fill: [-1, 0.5, -1.5],
  },
  upfront: {
    main: [0, 2, 1],
    fill: [-1, 0.5, -1.5],
  },
  soft: {
    main: [-2, 4, 4],
    fill: [-1, 0.5, -1.5],
  },
};
function Refit({ radius, adjustCamera }) {
  const api = useBounds();
  React.useEffect(() => {
    if (adjustCamera) api.refresh().clip().fit();
  }, [radius, adjustCamera]);
  return null;
}
function Stage({
  children,
  center,
  adjustCamera = true,
  intensity = 0.5,
  shadows = "contact",
  environment = "city",
  preset = "rembrandt",
  ...props
}) {
  const [{ radius, height }, set] = React.useState({
    radius: 0,
    width: 0,
    height: 0,
    depth: 0,
  });

  const onCentered = React.useCallback((props) => {
    const { width, height, depth, boundingSphere } = props;
    set({
      radius: boundingSphere.radius,
      width,
      height,
      depth,
    });
    if (center != null && center.onCentered) center.onCentered(props);
  }, []);

  return /*#__PURE__*/ React.createElement(
    React.Fragment,
    null,
    /*#__PURE__*/ React.createElement(
      Bounds,
      _extends(
        {
          fit: !!adjustCamera,
          clip: !!adjustCamera,
          margin: Number(adjustCamera),
          observe: false,
        },
        props
      ),
      /*#__PURE__*/ React.createElement(Refit, {
        radius: radius,
        adjustCamera: adjustCamera,
      }),
      /*#__PURE__*/ React.createElement(
        Center,
        _extends({}, center, {
          position: [0, 0, 0],
          onCentered: onCentered,
        }),
        children
      )
    ),
    environment &&
      /*#__PURE__*/ React.createElement(Environment, {
        preset: environment,
      })
  );
}

export { Stage };
