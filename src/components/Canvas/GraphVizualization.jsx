import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Group, Arrow, RegularPolygon, Text } from 'react-konva';
import { OrthogonalConnector } from './ortho-connector';

const GraphVizualization = ({ nodes, setNodes, edges, stageRef, scrollInterval, globalBounds }) => {
  const [localNodes, setLocalNodes] = useState(nodes);
  
  useEffect(() => {
    setLocalNodes(nodes);
  }, [nodes]);

  const r = 28;
  const triangleHeight = r * 1.5;
  const topOffset = 0.5 * r;
  const bottomOffset = r;

  const getTriangleVertices = (node) => {
    const { x: cx, y: cy } = node;
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

  const getIntersectionWithTriangle = (start, end, vertices) => {
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
     
      if (t >= 0 && t <= 1 && s >= 0 && s <= 1) {
        return {
          x: start.x + dx * t,
          y: start.y + dy * t
        };
      }
    }
    return null;
  };

  const getPointOnTriangleSide = (node, side) => {
    const vertices = getTriangleVertices(node);
    const center = { x: node.x, y: node.y };
   
    switch (side) {
      case 'top':
        const topPoint = {
          x: node.x,
          y: node.y - triangleHeight/2
        };
        return {
          point: topPoint,
          side: 'top',
          distance: 0.5
        };
      case 'bottom':
        const bottomPoint = {
          x: node.x,
          y: node.y + triangleHeight/2
        };
        return {
          point: bottomPoint,
          side: 'bottom',
          distance: 0.5
        };
      default:
        return {
          point: { x: node.x, y: node.y },
          side: 'top',
          distance: 0.5
        };
    }
  };

  const getTriangleBoundingBox = (node) => {
    const vertices = getTriangleVertices(node);
    const xCoords = vertices.map(v => v.x);
    const yCoords = vertices.map(v => v.y);
   
    const left = Math.min(...xCoords);
    const top = Math.min(...yCoords);
    const right = Math.max(...xCoords);
    const bottom = Math.max(...yCoords);
   
    return {
      left,
      top,
      width: right - left,
      height: bottom - top,
      centerX: node.x,
      centerY: node.y
    };
  };

  // Простая функция для создания ортогонального пути между двумя точками
  const createOrthogonalPath = (start, end) => {
    const points = [];
    points.push(start);
    
    // Добавляем промежуточную точку для создания ортогонального пути
    // Вертикально-горизонтальный путь
    points.push({ x: start.x, y: (start.y + end.y) / 2 });
    points.push({ x: end.x, y: (start.y + end.y) / 2 });
    
    points.push(end);
    return points;
  };

  const orthogonalEdges = useMemo(() => {
    return edges.map((edge, i) => {
      const fromNode = localNodes.find(n => String(n.id) === String(edge[0]));
      const toNode = localNodes.find(n => String(n.id) === String(edge[1]));
      
      if (!fromNode || !toNode) return null;

      const fromBox = getTriangleBoundingBox(fromNode);
      const toBox = getTriangleBoundingBox(toNode);
      
      const fromSide = 'bottom';
      const toSide = 'top';
      const fromConnection = getPointOnTriangleSide(fromNode, fromSide);
      const toConnection = getPointOnTriangleSide(toNode, toSide);

      try {
        const pathPoints = OrthogonalConnector.route({
          pointA: {
            shape: fromBox,
            side: fromConnection.side,
            distance: fromConnection.distance
          },
          pointB: {
            shape: toBox,
            side: toConnection.side,
            distance: toConnection.distance
          },
          shapeMargin: 0,
          globalBoundsMargin: 0,
          globalBounds: globalBounds || {
            left: 0,
            top: 0,
            width: 1000,
            height: 800
          }
        });

        if (pathPoints.length > 0) {
          const verticesFrom = getTriangleVertices(fromNode);
          const verticesTo = getTriangleVertices(toNode);
         
          const firstPoint = pathPoints[0];
          const intersectionStart = getIntersectionWithTriangle(
            { x: fromNode.x, y: fromNode.y },
            firstPoint,
            verticesFrom
          ) || firstPoint;
         
          const lastPoint = pathPoints[pathPoints.length - 1];
          const intersectionEnd = getIntersectionWithTriangle(
            { x: toNode.x, y: toNode.y },
            lastPoint,
            verticesTo
          ) || lastPoint;
         
          const correctedPath = [intersectionStart, ...pathPoints.slice(1, -1), intersectionEnd];
          const flatPoints = correctedPath.flatMap(p => [p.x, p.y]);
         
          return {
            id: `edge-${i}`,
            points: flatPoints,
            fromNode,
            toNode
          };
        } else {
          // Если путь пустой, создаем простой ортогональный путь
          throw new Error('Empty path');
        }
      } catch (error) {
        // ВСЕГДА создаем ортогональный путь, даже если OrthogonalConnector не сработал
        
        // Создаем простой ортогональный путь
        const verticesFrom = getTriangleVertices(fromNode);
        const verticesTo = getTriangleVertices(toNode);
        
        // Получаем точки соединения
        const startPoint = fromConnection.point;
        const endPoint = toConnection.point;
        
        // Создаем простой ортогональный путь
        const orthogonalPath = createOrthogonalPath(startPoint, endPoint);
        
        // Находим пересечения с треугольниками
        const intersectionStart = getIntersectionWithTriangle(
          { x: fromNode.x, y: fromNode.y },
          orthogonalPath[1],
          verticesFrom
        ) || startPoint;
        
        const intersectionEnd = getIntersectionWithTriangle(
          { x: toNode.x, y: toNode.y },
          orthogonalPath[orthogonalPath.length - 2],
          verticesTo
        ) || endPoint;
        
        // Формируем окончательный путь
        const finalPath = [
          intersectionStart,
          ...orthogonalPath.slice(1, -1),
          intersectionEnd
        ];
        
        const flatPoints = finalPath.flatMap(p => [p.x, p.y]);
       
        return {
          id: `edge-${i}`,
          points: flatPoints,
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
            radius={r}
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