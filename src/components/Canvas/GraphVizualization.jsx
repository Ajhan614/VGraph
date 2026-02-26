import { useState, useEffect, useMemo } from 'react';
import { Group, Arrow, RegularPolygon, Text, Circle } from 'react-konva';
import { getSmoothStepPath } from '@xyflow/react'; 

const GraphVizualization = ({ nodes, setNodes, edges, stageRef, scrollInterval }) => {
  const [localNodes, setLocalNodes] = useState(nodes);
  const [hoveredEdgeId, setHoveredEdgeId] = useState(null);

  useEffect(() => {
    setLocalNodes(nodes);
  }, [nodes]);

  const orthogonalEdges = useMemo(() => {
    const RADIUS = 28;
    const TOP_EDGE_WIDTH = RADIUS * Math.sqrt(3);
    return edges.map((edge, i) => {
      const fromNode = localNodes.find(n => String(n.id) === String(edge.source));
      const toNode = localNodes.find(n => String(n.id) === String(edge.target));
      
      if (!fromNode || !toNode) return null;

      const pointA = {
      x: fromNode.x,
      y: fromNode.y + RADIUS,
      side: 'bottom'
      };

      const ports = toNode.ports || [];
      const targetPort = edge.targetPort;

      let portX;
      if (ports.length === 0) {
        portX = toNode.x; 
      } 
      else {
      const portIndex = ports.indexOf(targetPort);
      const totalPorts = ports.length;
      const startX = toNode.x - TOP_EDGE_WIDTH / 2;
      const stepX = TOP_EDGE_WIDTH / (totalPorts + 1);
    
      portX = portIndex !== -1 ? startX + stepX * (portIndex + 1) : toNode.x;
    }

      const pointB = {
        x: portX,
        y: toNode.y - RADIUS / 2, 
        side: 'top'
      };

      try {
        const [pathString] = getSmoothStepPath({
          sourceX: pointA.x,
          sourceY: pointA.y,
          sourcePosition: pointA.side,
          targetX: pointB.x,
          targetY: pointB.y,
          targetPosition: pointB.side,
        });

        if (!pathString) return null; 

        const flatPoints = pathString
            .match(/-?\d+(\.\d+)?/g)
            ?.map(Number) || [];

        return {
          id: `edge-${i}`,
          points: flatPoints,
          fromNode,
          toNode
        };
      } catch(error) {
        console.warn(`Could not compute smooth step path for edge ${i}:`, error);
        return null;
      }
    }).filter(edge => edge !== null);
  }, [localNodes, edges]);

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

      if (pos.x < offset) dx = delta;
      if (pos.x > stage.width() - offset) dx = -delta;
      if (pos.y < offset) dy = delta;
      if (pos.y > stage.height() - offset) dy = -delta;

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
          stroke={hoveredEdgeId === edge.id ? "#ff0000" : "rgb(0, 0, 0)"}
          fill={hoveredEdgeId === edge.id ? "#ff0000" : "rgb(0, 0, 0)"}
          strokeWidth={hoveredEdgeId === edge.id ? 2 : 1}
          hitStrokeWidth={3}
          onMouseEnter={(e) => {
            setHoveredEdgeId(edge.id);
            const container = e.target.getStage().container();
            container.style.cursor = 'pointer';
          }}
          onMouseLeave={(e) => {
            setHoveredEdgeId(null);
            const container = e.target.getStage().container();
            container.style.cursor = 'default';
          }}
        />
      ))}

      {localNodes.map(node => {
        const RADIUS = 28;
        const TOP_EDGE_WIDTH = RADIUS * Math.sqrt(3);
        const ports = node.ports || [];
        const totalPorts = ports.length;
        const startXInGroup = -TOP_EDGE_WIDTH / 2;
        const stepX = TOP_EDGE_WIDTH / (totalPorts + 1);
        return(
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
            fill="#2563eb"
            stroke="rgb(0, 0, 0)"
            strokeWidth={2}
          />
          {ports && ports.map((portId, index) => (
              <Circle
                key={portId}
                x={startXInGroup + stepX * (index + 1)}
                y={-RADIUS / 2}
                radius={3}
                fill="white"
                stroke="#000000"
                strokeWidth={1}
              />
            ))}
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
      )})}
    </>
  );
};

export default GraphVizualization;