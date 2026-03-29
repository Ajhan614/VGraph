import { CalculateGraphError } from '../components/errCalculator';
import { getSmoothStepPath } from '@xyflow/react';

const prepareEdgesForCalculator = (nodes, edges) => {
    const RADIUS = 28;
    const TOP_EDGE_WIDTH = RADIUS * Math.sqrt(3);

    return edges.map((edge, i) => {
        const fromNode = nodes.find(n => String(n.id) === String(edge.source));
        const toNode = nodes.find(n => String(n.id) === String(edge.target));
        if (!fromNode || !toNode) return null;

        const pointA = { x: fromNode.x, y: fromNode.y + RADIUS, side: 'bottom' };

        const ports = toNode.ports || [];
        const targetPort = edge.targetPort;
        let portX = ports.length === 0 
            ? toNode.x 
            : (() => {
                const portIndex = ports.indexOf(targetPort);
                const totalPorts = ports.length;
                const startX = toNode.x - TOP_EDGE_WIDTH / 2;
                const stepX = TOP_EDGE_WIDTH / (totalPorts + 1);
                return portIndex !== -1 ? startX + stepX * (portIndex + 1) : toNode.x;
              })();

        const pointB = { x: portX, y: toNode.y - RADIUS / 2, side: 'top' };

        try {
            const [pathString] = getSmoothStepPath({
                sourceX: pointA.x, sourceY: pointA.y, sourcePosition: pointA.side,
                targetX: pointB.x, targetY: pointB.y, targetPosition: pointB.side,
            });
            if (!pathString) return null;

            const flatPoints = pathString.match(/-?\d+(\.\d+)?/g)?.map(Number) || [];
            return { id: `edge-${i}`, points: flatPoints, fromNode, toNode };
        } catch (e) {
            console.warn(`Smooth path error for edge ${i}`);
            return null;
        }
    }).filter(Boolean);
};

export const runGeneticAlgorithm = async (initialNodes, edges, weights, epsilonThreshold, onProgress) => {
    if (!Array.isArray(initialNodes) || initialNodes.length === 0) return initialNodes || [];

    const { a, b, c } = weights;
    const POP_SIZE = 40;
    const ELITE_SIZE = 8;
    const MUTATION_RATE = 0.28; 
    let mutationStep = 65;
    let noImprovementStreak = 0;

    let population = Array.from({ length: POP_SIZE }, () =>
        initialNodes.map(n => ({
            ...n,
            x: n.x + (Math.random() - 0.5) * 40,
            y: n.y + (Math.random() - 0.5) * 40
        }))
    );

    let bestNodes = initialNodes;
    let minScore = Infinity;
    let generation = 0;

    while (minScore > epsilonThreshold) {
        generation++;

        const scoredPopulation = population.map(indNodes => {
            const preparedEdges = prepareEdgesForCalculator(indNodes, edges);
            
            const errs = CalculateGraphError(indNodes, preparedEdges, 3); 
            
            // === ШТРАФ ЗА ДЛИНУ РЕБЕР ===
            let edgeLengthPenalty = 0;
            preparedEdges.forEach(edge => {
                const dist = Math.sqrt(
                    Math.pow(edge.fromNode.x - edge.toNode.x, 2) + 
                    Math.pow(edge.fromNode.y - edge.toNode.y, 2)
                );
                edgeLengthPenalty += dist * 0.02; 
            });

            const totalScore = (a * errs.err1EE) + (b * errs.err2NN) + (c * errs.err3EN) + edgeLengthPenalty;
            
            return { nodes: indNodes, score: totalScore };
        });

        scoredPopulation.sort((x, y) => x.score - y.score);

        // === ТОЛЬКО СИЛЬНЫЕ ИЗМЕНЕНИЯ - УЛУЧШЕНИЯ ===
        const currentBest = scoredPopulation[0];
        if (minScore - currentBest.score > 0.1) {
            minScore = currentBest.score;
            bestNodes = currentBest.nodes;
            noImprovementStreak = 0;
        } else {
            noImprovementStreak++;
        }

        if (onProgress && generation % 5 === 0) {
            onProgress(generation, minScore, bestNodes);
        }

        await new Promise(r => setTimeout(r, 0));

        if (generation > 2000) break;

        // === ЭЛИТА И МУТАЦИЯ ===
        const survivors = scoredPopulation.slice(0, ELITE_SIZE).map(p => p.nodes);
        let nextGen = [...survivors];

        while (nextGen.length < POP_SIZE) {
            const parent1 = survivors[Math.floor(Math.random() * survivors.length)];
            const parent2 = survivors[Math.floor(Math.random() * survivors.length)];

            const child = parent1.map((node, i) => {
                const other = parent2[i] || node;
                return {
                    ...node,
                    x: Math.random() < 0.5 ? node.x : other.x,
                    y: Math.random() < 0.5 ? node.y : other.y
                };
            });

            // === УЛУЧШЕННАЯ МУТАЦИЯ ===
            const mutatedChild = child.map(node => {
                if (Math.random() < MUTATION_RATE) {
                    const isMacroJump = Math.random() < 0.1;
                    const step = isMacroJump ? mutationStep * 3 : mutationStep;

                    return {
                        ...node,
                        x: node.x + (Math.random() - 0.5) * step,
                        y: node.y + (Math.random() - 0.5) * step
                    };
                }
                return node;
            });

            nextGen.push(mutatedChild);
        }

        population = nextGen;

        // === АДАПТИВНЫЙ ШАГ ===
        if (noImprovementStreak > 100) {
            mutationStep = Math.min(120, mutationStep * 2.0);
            noImprovementStreak = 0;
        } else {
            mutationStep = Math.max(4, mutationStep * 0.9997);
        }

        // === ВСТРЯСКА ===
        if (generation % 400 === 0 && generation > 300) {
            population = population.map((ind, idx) => {
                if (idx < POP_SIZE * 0.3) { 
                    return ind.map(n => ({
                        ...n,
                        x: n.x + (Math.random() - 0.5) * 90,
                        y: n.y + (Math.random() - 0.5) * 90
                    }));
                }
                return ind;
            });
        }
    }

    return bestNodes;
};