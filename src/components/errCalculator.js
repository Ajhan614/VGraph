const rectIntersectionArea = (r1, r2) => {
  const dx = Math.max(0, Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left));
  const dy = Math.max(0, Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top));
  return dx * dy;
}

const getRectFromNode = (node) => {
  const RADIUS = 28;
  const halfWidth = (RADIUS * Math.sqrt(3)) / 2;
  return {
    left: node.x - halfWidth,
    right: node.x + halfWidth,
    bottom: node.y + RADIUS,
    top: node.y - RADIUS / 2
  };
}

const getEdgeSegments = (edge, delta) => {
  const p = edge.points;
  const segments = [];
  
  if (!p) return segments;

  for (let i = 0; i < p.length - 2; i += 2) {
    const x1 = p[i], y1 = p[i + 1];
    const x2 = p[i + 2], y2 = p[i + 3];

    segments.push({
      left: Math.min(x1, x2) - delta,
      right: Math.max(x1, x2) + delta,
      top: Math.min(y1, y2) - delta,
      bottom: Math.max(y1, y2) + delta,
      isFirst: i === 0,
      isSecond: i === 2, 
      isLast: i === p.length - 4,
      sourceId: String(edge.fromNode?.id || edge.source),
      targetId: String(edge.toNode?.id || edge.target)
    });
  }
  return segments;
};

export const CalculateGraphError = (nodes, orthogonalEdges, delta) => {
  let errEE = 0;
  let errNN = 0;
  let errEN = 0;
  let edgeLengthPenalty = 0;     

  const nodeRects = nodes.map(n => ({ id: String(n.id), rect: getRectFromNode(n) }));
  const edgesSegments = orthogonalEdges.map(e => getEdgeSegments(e, delta));

  orthogonalEdges.forEach(edge => {
    // Считаем длину пути
    for (let i = 0; i < edge.points.length - 2; i += 2) {
      const x1 = edge.points[i], y1 = edge.points[i + 1];
      const x2 = edge.points[i + 2], y2 = edge.points[i + 3];
      edgeLengthPenalty += Math.hypot(x2 - x1, y2 - y1);
    }
  });

  // 1. Площадь пересечения стрелок
  for (let i = 0; i < edgesSegments.length; i++) {
    for (let j = i + 1; j < edgesSegments.length; j++) {
      const edgeA = edgesSegments[i];
      const edgeB = edgesSegments[j];

      for (const segA of edgeA) {
        for (const segB of edgeB) {
          if (segA.sourceId === segB.sourceId) {
            if (segA.isFirst && segB.isFirst) continue;
            if (segA.isFirst && segB.isSecond) continue;
            if (segA.isSecond && segB.isFirst) continue;
          }
          errEE += rectIntersectionArea(segA, segB);
        }
      }
    }
  }

  // 2. Пересечение вершин
  for (let i = 0; i < nodeRects.length; i++) {
    for (let j = i + 1; j < nodeRects.length; j++) {
      errNN += rectIntersectionArea(nodeRects[i].rect, nodeRects[j].rect);
    }
  }

  // 3. Пересечение вершин со стрелками
  for (const node of nodeRects) {
    for (const edgeSegs of edgesSegments) {
      for (const seg of edgeSegs) {
        let testSeg = { ...seg }; 
        if (seg.sourceId === node.id && seg.isFirst) {
          testSeg.top = Math.max(testSeg.top, node.rect.bottom);
        }
        if (seg.targetId === node.id && seg.isLast) {
          testSeg.bottom = Math.min(testSeg.bottom, node.rect.top);
        }

        if (testSeg.top < testSeg.bottom && testSeg.left < testSeg.right) {
          errEN += rectIntersectionArea(node.rect, testSeg);
        }
      }
    }
  }

  return {
    errEE,
    errNN,
    errEN,
    edgeLengthPenalty
  };
};