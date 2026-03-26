//вычисление ошибок
  const rectIntersectionArea = (r1, r2) =>{
    const dx = Math.max(0, Math.min(r1.right,r2.right) - Math.max(r1.left, r2.left));
    const dy = Math.max(0, Math.min(r1.bottom, r2.bottom)- Math.max(r1.top,r2.top));
    return dx * dy;
  }
  const getRectFromNode = (node) =>{
    const RADIUS = 28
    const halfWidth = (RADIUS * Math.sqrt(3)) / 2;
    return{
      left: node.x - halfWidth,
      right: node.x + halfWidth,
      bottom: node.y + RADIUS,
      top: node.y - RADIUS/2
    }
  }
const getEdgeSegments = (edge, epsilon) => {
  const p = edge.points;
  const segments = [];

  for (let i = 0; i < p.length - 2; i += 2) {
    const x1 = p[i], y1 = p[i+1];
    const x2 = p[i+2], y2 = p[i+3];

    segments.push({
      left: Math.min(x1, x2) - epsilon,
      right: Math.max(x1, x2) + epsilon,
      top: Math.min(y1, y2) - epsilon,
      bottom: Math.max(y1, y2) + epsilon,
      isFirst: i === 0,
      isLast: i === p.length - 4, // Добавили проверку на последний сегмент
      sourceId: String(edge.fromNode.id),
      targetId: String(edge.toNode.id)
    });
  }
  return segments;
};
//Вычисление всех площадей пересечений
export const CalculateGraphError = (nodes, orthogonalEdges, epsilon) =>{
    let err1EE = 0;
    let err2NN = 0;
    let err3EN = 0;

    const nodeRects = nodes.map(n => ({id: String(n.id), rect: getRectFromNode(n)}))
    const edgesSegments = orthogonalEdges.map(e => getEdgeSegments(e, epsilon))
    //Площадь пересечения стрелок
    for(let i = 0; i < edgesSegments.length; i++){
      for(let j = i + 1; j < edgesSegments.length; j++){
        const edgeA = edgesSegments[i]
        const edgeB = edgesSegments[j]

        for(const segA of edgeA){
          for(const segB of edgeB){
            if(segA.sourceId === segB.sourceId && segA.isFirst && segB.isFirst){
              continue;
            }
            err1EE += rectIntersectionArea(segA, segB)
          }
        }
      }
    }

    //Пересечение вершин
    for(let i = 0; i < nodeRects.length; i++){
      for(let j = i + 1; j < nodeRects.length; j++){
        err2NN += rectIntersectionArea(nodeRects[i].rect, nodeRects[j].rect)
      }
    }

    //Пересечение вершин со стрелками
    for(const node of nodeRects){
      for(const edgeSegs of edgesSegments){
        for(const seg of edgeSegs){
          let testSeg = { 
            left: seg.left, 
            right: seg.right, 
            top: seg.top, 
            bottom: seg.bottom 
          };
          if (seg.sourceId === node.id && seg.isFirst) {
            testSeg.top = Math.max(testSeg.top, node.rect.bottom);
          }
          if (seg.targetId === node.id && seg.isLast) {
            testSeg.bottom = Math.min(testSeg.bottom, node.rect.top);
          }
          err3EN += rectIntersectionArea(node.rect, testSeg);
          
        }
      }
    }

    return{
      err1EE,
      err2NN,
      err3EN
    }
  }