import React from 'react';
import { Line, Circle } from 'react-konva';

const GraphNodes = ({ nodes, setNodes }) => {
  function handleDragMove(event, id) {
    const node = event.target;        
    const position = node.position(); 

    const newNodes = [...nodes];

    for (let i = 0; i < newNodes.length; i++) {
      if (newNodes[i].id === id) {
        newNodes[i].x = position.x;
        newNodes[i].y = position.y;
        break;
      }
    }

    setNodes(newNodes);
  }

  return (
    <>
        <Line
          points={[nodes[0].x, nodes[0].y, nodes[1].x, nodes[1].y]}
          stroke="black"
          strokeWidth={2}
        />

        <Circle
          x={nodes[0].x}
          y={nodes[0].y}
          radius={20}
          fill="skyblue"
          stroke="black"
          strokeWidth={2}
          draggable
          onDragMove={(e) => handleDragMove(e, 1)}
        />

        <Circle
          x={nodes[1].x}
          y={nodes[1].y}
          radius={20}
          fill="lightgreen"
          stroke="black"
          strokeWidth={2}
          draggable
          onDragMove={(e) => handleDragMove(e, 2)}
        />
    </>
  );
};

export default GraphNodes;