// components/Canvas/GraphNodes.jsx
import React from 'react';
import { Line, Circle, Text } from 'react-konva';

const GraphNodes = ({ nodes, setNodes, edges, setEdges }) => {
  if (!nodes || nodes.length === 0) {
    return <Text x={10} y={10} text="Граф пустой. Загрузите данные." fontSize={20} fill="black" />;
  }

  const handleDragMove = (e, nodeId) => {
    const pos = e.target.position();
    setNodes(prevNodes =>
      prevNodes.map(node =>
        node.id === nodeId ? { ...node, x: pos.x, y: pos.y } : node
      )
    );
  };

  return (
    <>
      {edges.map((edge, i) => {
        const fromNode = nodes.find(n => n.id === edge[0]);
        const toNode = nodes.find(n => n.id === edge[1]);

        if (!fromNode || !toNode) return null;

        return (
          <Line
            key={`edge-${i}`}
            points={[fromNode.x, fromNode.y, toNode.x, toNode.y]}
            stroke="#ff0000ff"
            strokeWidth={4}
            lineCap="round"
            tension={0.3}
          />
        );
      })}

      {nodes.map(node => (
        <React.Fragment key={node.id}>
          <Circle
            x={node.x}
            y={node.y}
            radius={28}
            fill="#eeff00ff"
            stroke="#333"
            strokeWidth={4}
            draggable
            onDragMove={(e) => handleDragMove(e, node.id)}
          />
        </React.Fragment>
      ))}
    </>
  );
};

export default GraphNodes;