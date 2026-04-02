// Вычисление площади пересечения
const rectIntersectionArea = (r1, r2) => {
  const dx = Math.max(0, Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left));
  const dy = Math.max(0, Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top));
  return dx * dy;
}

// Хитбокс ноды
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

const getEdgeSegments = (edge, epsilon) => {
  const p = edge.points;
  const segments = [];
  
  if (!p) return segments;

  for (let i = 0; i < p.length - 2; i += 2) {
    const x1 = p[i], y1 = p[i + 1];
    const x2 = p[i + 2], y2 = p[i + 3];

    segments.push({
      left: Math.min(x1, x2) - epsilon,
      right: Math.max(x1, x2) + epsilon,
      top: Math.min(y1, y2) - epsilon,
      bottom: Math.max(y1, y2) + epsilon,
      isFirst: i === 0,
      isSecond: i === 2, // <-- Добавили маркер для второго сегмента
      isLast: i === p.length - 4,
      // Безопасное получение ID (на случай, если придет объект из ГА без fromNode)
      sourceId: String(edge.fromNode?.id || edge.source),
      targetId: String(edge.toNode?.id || edge.target)
    });
  }
  return segments;
};

// Вычисление всех площадей пересечений
export const CalculateGraphError = (nodes, orthogonalEdges, epsilon) => {
  let err1EE = 0;
  let err2NN = 0;
  let err3EN = 0;

  const nodeRects = nodes.map(n => ({ id: String(n.id), rect: getRectFromNode(n) }));
  const edgesSegments = orthogonalEdges.map(e => getEdgeSegments(e, epsilon));

  // 1. Площадь пересечения стрелок
  for (let i = 0; i < edgesSegments.length; i++) {
    for (let j = i + 1; j < edgesSegments.length; j++) {
      const edgeA = edgesSegments[i];
      const edgeB = edgesSegments[j];

      for (const segA of edgeA) {
        for (const segB of edgeB) {
          
          // Если стрелки исходят из одного и того же узла
          if (segA.sourceId === segB.sourceId) {
            // Игнорируем совпадение общих вертикальных стволов
            if (segA.isFirst && segB.isFirst) continue;
            
            // Игнорируем точку ответвления (горизонталь одной стрелки пересекает ствол другой)
            if (segA.isFirst && segB.isSecond) continue;
            if (segA.isSecond && segB.isFirst) continue;
          }

          err1EE += rectIntersectionArea(segA, segB);
        }
      }
    }
  }

  // 2. Пересечение вершин
  for (let i = 0; i < nodeRects.length; i++) {
    for (let j = i + 1; j < nodeRects.length; j++) {
      err2NN += rectIntersectionArea(nodeRects[i].rect, nodeRects[j].rect);
    }
  }

  // 3. Пересечение вершин со стрелками
  for (const node of nodeRects) {
    for (const edgeSegs of edgesSegments) {
      for (const seg of edgeSegs) {
        let testSeg = {
          left: seg.left,
          right: seg.right,
          top: seg.top,
          bottom: seg.bottom
        };

        // Обрезаем зону проверки, чтобы стрелка не конфликтовала с родными портами
        if (seg.sourceId === node.id && seg.isFirst) {
          testSeg.top = Math.max(testSeg.top, node.rect.bottom);
        }
        if (seg.targetId === node.id && seg.isLast) {
          testSeg.bottom = Math.min(testSeg.bottom, node.rect.top);
        }

        // Если после обрезки сегмент "вывернулся", значит он полностью внутри разрешенной зоны
        if (testSeg.top < testSeg.bottom && testSeg.left < testSeg.right) {
          err3EN += rectIntersectionArea(node.rect, testSeg);
        }
      }
    }
  }

  return {
    err1EE,
    err2NN,
    err3EN
  };
};