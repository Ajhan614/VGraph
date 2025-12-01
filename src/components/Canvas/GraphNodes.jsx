// components/Canvas/GraphNodes.jsx
import React,{useRef} from 'react';
import { Line, Circle, Text } from 'react-konva';

const GraphNodes = ({ nodes, setNodes, edges,stageRef}) => {
  const scrollInterval = useRef(null);
  const handleDragStart = (e) => {
    const stage = stageRef.current;
    if (!stage) return;

    scrollInterval.current = setInterval(() => {
      const pos = stage.getPointerPosition();
      if (!pos) return;

      const target = e.target;
      const offset = 100;
      const delta = 2;

      if (pos.x < offset) {
        stage.x(stage.x() + delta);
        target.x(target.x() - delta);
      }
      if (pos.x > stage.width() - offset) {
        stage.x(stage.x() - delta);
        target.x(target.x() + delta);
      }
      if (pos.y < offset) {
        stage.y(stage.y() + delta);
        target.y(target.y() - delta);
      }
      if (pos.y > stage.height() - offset) {
        stage.y(stage.y() - delta);
        target.y(target.y() + delta);
      }

      stage.batchDraw();
    }, 16);
  };

  const handleDragMove = (e, nodeId) => {
    const pos = e.target.position();

    setNodes(prev =>
      prev.map(node =>
        node.id === nodeId
          ? { ...node, x: pos.x, y: pos.y }
          : node
      )
    );
  };

  const handleDragEnd = (e) => {
    clearInterval(scrollInterval.current);
    scrollInterval.current = null;
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
          />
        );
      })}

      {nodes.map(node => (
        <Circle
          key={node.id}
          x={node.x}
          y={node.y}
          radius={28}
          fill="#eeff00ff"
          stroke="#333"
          strokeWidth={4}
          draggable
          onDragStart={handleDragStart}
          onDragMove={(e) => handleDragMove(e, node.id)}
          onDragEnd={handleDragEnd}
        />
      ))}
    </>
  );
};

export default GraphNodes