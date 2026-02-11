import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Group, Arrow, RegularPolygon, Text, Line } from 'react-konva';
import { OrthogonalConnector } from './ortho-connector';

const GraphVizualization = ({ nodes, setNodes, edges, stageRef, scrollInterval, globalBounds }) => {
  const [localNodes, setLocalNodes] = useState(nodes);

  useEffect(() => {
    setLocalNodes(nodes);
  }, [nodes]);

  const getTriangleBoundingBox = (node) => {
    const r = 28;
    return{
      left: node.x - r,
      top: node.y - r,
      width: r * 2,
      height: r * 2,
      centerX: node.x,
      centerY: node.y
    }
  }

  const orthogonalEdges = useMemo(() =>{
    return edges.map((edge, i) => {
      const fromNode = localNodes.find(n => String(n.id) === String(edge[0]));
      const toNode = localNodes.find(n => String(n.id) === String(edge[1]));
      if (!fromNode || !toNode) return null;

      const fromBox = getTriangleBoundingBox(fromNode);
      const toBox = getTriangleBoundingBox(toNode);

      const sideA = 'bottom';
      const sideB = 'top';

      const getConnectionPoint = (node, side) =>{
        const box = getTriangleBoundingBox(node);
        switch(side) {
          case 'top': return{
            x: node.x, 
            y: node.y - 14,
            side: 'top',
            distance: 0.5
          };
          case 'bottom': return{
            x: node.x, 
            y: node.y + 28,
            side: 'bottom',
            distance: 0.5
          };
          default: return { x: node.x, y: node.y };
        }
      };

      const pointA = getConnectionPoint(fromNode,sideA);
      const pointB = getConnectionPoint(toNode, sideB);

      try{
        const pathPoints = OrthogonalConnector.route({
          pointA : {
            shape: fromBox, 
            side: pointA.side, 
            distance: pointA.distance 
          },
          pointB : {
            shape: toBox,
            side: pointB.side,
            distance: pointB.distance
          },
          shapeMargin: 0,
          globalBoundsMargin: 0,
          globalBounds: globalBounds || {
            left: 0,
            top: 0,
            width: 1000,
            height: 800
          }
        })

        const flatPoints = pathPoints.flatMap(p => [p.x, p.y]);

        return {
          id: `edge-${i}`,
          points: flatPoints,
          fromNode,
          toNode
        };
      } catch(error) {
        console.warn(`Could not compute orthogonal path for edge ${i}:`, error);
        return {
          id: `edge-${i}`,
          points: [fromNode.x, fromNode.y + 28, toNode.x, toNode.y],
          fromNode,
          toNode,
          isFallback: true
        };
      }
    }).filter(edge => edge !== null);
  }, [localNodes, edges, globalBounds]);

  const handleDragStart = (e) => {
    const stage = stageRef.current;
    if (!stage) return;

    scrollInterval.current = setInterval(() => {
      const pos = stage.getPointerPosition();
      if (!pos) return;

      const target = e.target;
      const offset = 100;
      const delta = 2;
      const scaleX = stage.scaleX();
      const scaleY = stage.scaleY();

      let dx = 0, dy = 0;

      if (pos.x < offset) {
        dx = delta;
      }
      if (pos.x > stage.width() - offset) {
        dx = -delta;
      }
      if (pos.y < offset) {
        dy = delta;
      }
      if (pos.y > stage.height() - offset) {
        dy = -delta;
      }

      if (dx === 0 && dy === 0) return;

      const oldStageX = stage.x();
      const oldStageY = stage.y();

      stage.position({
        x: oldStageX + dx,
        y: oldStageY + dy
      });

      const newNodeX = target.x() - dx / scaleX;
      const newNodeY = target.y() - dy / scaleY;

      target.position({
        x: newNodeX,
        y: newNodeY
      });

      setLocalNodes(prev =>
        prev.map(node =>
          node.id === target.id()
            ? { ...node, x: newNodeX, y: newNodeY }
            : node
        )
      );
    }, 16);
  };

  const handleDragMove = (e, nodeId) => {
    const pos = e.currentTarget.position();
    setLocalNodes(prev =>
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
    
    const nodeId = e.target.id();
    const pos = e.target.position();
    
    setNodes(prev =>
      prev.map(node =>
        node.id === nodeId
          ? { ...node, x: pos.x, y: pos.y }
          : node
      )
    );
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
      {orthogonalEdges.map(edge => (
        <Arrow
          key={edge.id}
          points={edge.points}
          stroke="#000000ff"
          strokeWidth={2}
          fill="#000000ff"
          lineCap="round"
          lineJoin="round"
          tension={0}
          pointerLength={10}
          pointerWidth={10}
        />
      ))}

      {localNodes.map(node => (
        <Group
          key={node.id}
          id={node.id}
          x={node.x}
          y={node.y}
          draggable
          onDragStart={handleDragStart}
          onDragMove={(e) => handleDragMove(e, node.id)}
          onDragEnd={handleDragEnd}
        >
          <RegularPolygon
            radius={28}
            sides={3}
            rotation={60}
            fill="#4a90e2"
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

export default GraphVizualization;
