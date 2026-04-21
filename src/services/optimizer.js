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
                sourceX: pointA.x, 
                sourceY: pointA.y, 
                sourcePosition: pointA.side,
                targetX: pointB.x, 
                targetY: pointB.y, 
                targetPosition: pointB.side,
                borderRadius: 0
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

export const runGeneticAlgorithm = async (initialNodes, edges, weights, epsilon, onProgress) => {
    if (!Array.isArray(initialNodes) || initialNodes.length === 0) return initialNodes || [];

    const { a, b, c } = weights;
    const POP_SIZE = 40;
    const ELITE_SIZE = 3;
    const MUTATION_RATE = 0.3; 
    const GEN_NUM = 10000;
    let mutationStep = 150;

    let population = Array.from({ length: POP_SIZE }, (_, index) => {
        if (index === 0) {
            return [...initialNodes.map(n => ({ ...n }))]; 
        }
        return initialNodes.map(n => ({
            ...n,
            x: n.x + (Math.random() * 2 - 1) * mutationStep,
            y: n.y + (Math.random() * 2 - 1) * mutationStep
        }));
    });

    let bestNodes = initialNodes;
    let minScore = Infinity;
    let generation = 0;

    while (true) {
        generation++;

        const parentPool = population;
        let nextGenCandidates = [];

        while (nextGenCandidates.length < POP_SIZE) {
            const parent1 = parentPool[Math.floor(Math.random() * parentPool.length)];
            const parent2 = parentPool[Math.floor(Math.random() * parentPool.length)];

            const child = parent1.map((node, i) => {
                const other = parent2[i] || node;
                return {
                    ...node,
                    x: Math.random() < 0.5 ? node.x : other.x,
                    y: Math.random() < 0.5 ? node.y : other.y
                };
            });

            const mutatedChild = child.map(node => {
                if (Math.random() < MUTATION_RATE) {
                    const rand = Math.random();
                    let step;
                    if (rand < 0.1) step = mutationStep * 3;
                    else if (rand < 0.5) step = mutationStep;
                    else step = mutationStep * 0.2;

                    return {
                        ...node,
                        x: node.x + (Math.random() * 2 - 1) * step,
                        y: node.y + (Math.random() * 2 - 1) * step
                    };
                }
                return node;
            });

            nextGenCandidates.push(mutatedChild);
        }

        const poolToEvaluate = [...population, ...nextGenCandidates];
        const scoredPopulation = poolToEvaluate.map(indNodes => {
            const delta = 3;
            const preparedEdges = prepareEdgesForCalculator(indNodes, edges);
            const errs = CalculateGraphError(indNodes, preparedEdges, delta); 

            const totalScore = (a * errs.errEE) + 
                               (b * errs.errNN) + 
                               (c * errs.errEN) + 
                               errs.edgeLengthPenalty;
            return { nodes: indNodes, score: totalScore };
        });

        scoredPopulation.sort((x, y) => x.score - y.score);

        const survivors = [];

        for (let i = 0; i < ELITE_SIZE; i++) {
            survivors.push(scoredPopulation[i]);
        }

        while (survivors.length < POP_SIZE) {
            const competitor1 = scoredPopulation[Math.floor(Math.random() * scoredPopulation.length)];
            const competitor2 = scoredPopulation[Math.floor(Math.random() * scoredPopulation.length)];
            
            const winner = competitor1.score < competitor2.score ? competitor1 : competitor2;
            survivors.push(winner);
        }

        population = survivors.map(p => p.nodes);

        const currentBest = scoredPopulation[0];
        if (minScore - currentBest.score > 0.1) {
            minScore = currentBest.score;
            bestNodes = currentBest.nodes;
        }

        if (onProgress && generation % 5 === 0) {
            onProgress(generation, minScore, bestNodes);
        }

        await new Promise(r => setTimeout(r, 0));

        if (minScore <= epsilon || generation > GEN_NUM) {
            break;
        }
    }

    return bestNodes;
};