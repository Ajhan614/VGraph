// components/Canvas/GraphNodes.jsx
import React,{useRef} from 'react';
import {  Group, Arrow, RegularPolygon, Text } from 'react-konva';

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

  const getTriangleVertices = (node) => {
    const { x: cx, y: cy } = node;
    const r = 28;
    const rotation = 90 * (Math.PI / 180);
    const vertices = [];
    for (let i = 0; i < 3; i++) {
      const angle = ((Math.PI * 2) / 3) * i + rotation;
      vertices.push({
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
      });
    }
    return vertices;
  };

  const getIntersections = (start, end, vertices) => {
    const intersections = [];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    for (let i = 0; i < 3; i++) {
      const p3 = vertices[i];
      const p4 = vertices[(i + 1) % 3];
      const dx2 = p4.x - p3.x;
      const dy2 = p4.y - p3.y;
      const den = dx * dy2 - dy * dx2;
      if (Math.abs(den) < 1e-6) continue;
      const t = ((p3.x - start.x) * dy2 - (p3.y - start.y) * dx2) / den;
      const s = ((p3.x - start.x) * dy - (p3.y - start.y) * dx) / den;
      if (t > 0 && s >= 0 && s <= 1) {
        intersections.push(t);
      }
    }
    return intersections;
  };

  return (
    <>
      {edges.map((edge, i) => {
        const fromNode = nodes.find(n => n.id === edge[0]);
        const toNode = nodes.find(n => n.id === edge[1]);
        if (!fromNode || !toNode) return null;

        const toVertices = getTriangleVertices(toNode);

        const startX = fromNode.x;
        const startY = fromNode.y + 28;

        const toTs = getIntersections({ x: startX, y: startY }, toNode, toVertices);

        let endX = toNode.x;
        let endY = toNode.y;

        if (toTs.length > 0) {
          const t_end = Math.min(...toTs);
          endX = startX + t_end * (toNode.x - startX);
          endY = startY + t_end * (toNode.y - startY);
        }

        return (
          <Arrow
            key={`edge-${i}`}
            points={[startX, startY, endX, endY]}
            stroke="#000000ff"
            strokeWidth={2}
            fill = "#000000ff"
            lineCap="round"
          />
        );
      })}

      {nodes.map(node => (
        <Group
          key={node.id}
          x={node.x}
          y={node.y}
          draggable
          onDragStart={handleDragStart}
          onDragMove={(e) => handleDragMove(e, node.id)}
          onDragEnd={handleDragEnd}>

          <RegularPolygon
          radius = {28}
          sides = {3}
          rotation = {60}
          fill="#7bb6ecff"
          stroke="#000000ff"
          strokeWidth={2}
          />
          <Text
          text={node.id}
          fontSize={14}
          fill="black"
          align="center"
          verticalAlign="middle"
          x={-14}
          y={-7}
          width={28}
          />
        </Group>
      ))}
    </>
  );
};

export default GraphNodes