import React, { useState } from "react";
import GraphNodes from "../components/Canvas/GraphNodes";

function GraphUploader() {
    const [coordinates, setCoordinates] = useState([
        { id: 1, x: 100, y: 100 },
        { id: 2, x: 200, y: 150 },
        { id: 3, x: 300, y: 200 },
        { id: 4, x: 150, y: 250 },
        { id: 5, x: 250, y: 300 }
    ]);
    const [edges, setEdges] = useState([[1, 2], [2, 3], [3, 4], [4, 5], [5, 1]]);

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
            console.log('Coordinates:', coords);
        } catch (error) {
            console.error('Error:', error);
        }
    };

    return (
        <div>
            <GraphNodes nodes={coordinates} setNodes={setCoordinates} edges={edges} setEdges={setEdges} />
        </div>
    );
}

export default GraphUploader;