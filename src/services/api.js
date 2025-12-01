import React, { useEffect, useState } from "react";
import GraphNodes from "../components/Canvas/GraphNodes";

function GraphUploader({stageRef}) {
    const [coordinates, setCoordinates] = useState([
        { id: 1, x: 100, y: 100 },
        { id: 2, x: 200, y: 150 },
        { id: 3, x: 300, y: 200 },
        { id: 4, x: 150, y: 250 },
        { id: 5, x: 250, y: 300 }
    ]);
    const [edges, setEdges] = useState([[1, 2], [1, 3], [3, 4], [3, 5]]);

    const calculate_layout = async (graphData) => {
        try {
            const response = await fetch('http://localhost:5000/calculate_coordinates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(graphData),
            });
            if (!response.ok) throw new Error(`Server error: ${response.status}`);
            const coords = await response.json();
            setCoordinates(coords);
            const scale = 100;

            const converted = coords.map(n => ({
                id: n.id,
                x: n.x * scale + 100,
                y: n.y * scale + 100,
            }));

            setCoordinates(converted);

            console.log('Coordinates:', coords);
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