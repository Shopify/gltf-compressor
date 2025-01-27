import { Components, styled, useInputContext } from "leva/plugin";
import { useState } from "react";
import type { TreeNode, TreeProps } from "./tree-types";

const { Row, Label } = Components;

const TreeContainer = styled("div", {
  padding: "$rowGap",
  fontFamily: "$mono",
  fontSize: "$sm",
});

const TreeNodeContainer = styled("div", {
  marginLeft: "$md",
});

const NodeLabel = styled("div", {
  display: "flex",
  alignItems: "center",
  cursor: "pointer",
  "&:hover": {
    color: "$accent2",
  },
});

const ToggleButton = styled("span", {
  display: "inline-block",
  width: "12px",
  marginRight: "$xs",
  color: "$accent1",
});

function TreeNodeComponent({ node }: { node: TreeNode }) {
  const [expanded, setExpanded] = useState(node.expanded);

  return (
    <div>
      <NodeLabel onClick={() => setExpanded(!expanded)}>
        <ToggleButton>
          {node.children.length > 0 ? (expanded ? "▼" : "▶") : "•"}
        </ToggleButton>
        {node.name}
      </NodeLabel>
      {expanded && node.children.length > 0 && (
        <TreeNodeContainer>
          {node.children.map((child, i) => (
            <TreeNodeComponent key={i} node={child} />
          ))}
        </TreeNodeContainer>
      )}
    </div>
  );
}

export function Tree() {
  const { label, value } = useInputContext<TreeProps>();

  return (
    <Row input>
      <Label>{label}</Label>
      <TreeContainer>
        <TreeNodeComponent node={value.root} />
      </TreeContainer>
    </Row>
  );
}
