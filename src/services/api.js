import React, { useEffect, useState } from "react";
import GraphNodes from "../components/Canvas/GraphNodes";

function GraphUploader({stageRef}) {
    const [coordinates, setCoordinates] = useState([
        { id: 1, x: 0, y: 0 },
        { id: 2, x: 0, y: 0 },
        { id: 3, x: 0, y: 0 },
        { id: 4, x: 0, y: 0 },
        { id: 5, x: 0, y: 0 },
        { id: 6, x: 0, y: 0 },
        { id: 7, x: 0, y: 0 },
    ]);
    const [edges, setEdges] = useState([[1, 2], [1, 3], [1, 4], [4,5], [4,6]]);

    const calculate_layout = async (graphData) => {
        try {
            const response = await fetch('http://localhost:5000/calculate_coordinates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(graphData),
            });
            if (!response.ok) throw new Error(`Server error: ${response.status}`);
            const coords = await response.json();
            const minY = Math.min(...coords.map(n => n.y));
            const maxY = Math.max(...coords.map(n => n.y));
            const converted = coords.map(n => ({
                id: n.id,
                x: n.x,
                y: maxY - n.y + minY,  // Flip y to match canvas coord system
            }));
            setCoordinates(converted);
            console.log('Coordinates:', converted);
            } catch (error) {
            console.error('Error:', error);
        }
    };

    useEffect(() =>{
        const nodeIds = coordinates.map(c => c.id);  // Extract just IDs for backend
        calculate_layout({ nodes: nodeIds, edges });
    }, [])

    return (
        <div>
            <GraphNodes 
            nodes={coordinates} 
            setNodes={setCoordinates} 
            edges={edges} 
            stageRef={stageRef}
            />
        </div>
    );
}

export default GraphUploader;