from flask import Flask, request, jsonify
from flask_cors import CORS
import networkx as nx

app = Flask(__name__)
CORS(app)

@app.route('/calculate_coordinates', methods=['POST'])
def calculate_coordinates():
    try:
        data = request.json
        nodes = data.get('nodes', [])  # List of node IDs, e.g., [1, 2, 3]
        edges = data.get('edges', [])  # List of edge tuples, e.g., [[1, 2], [2, 3]]

        G = nx.Graph()
        G.add_nodes_from(nodes)
        G.add_edges_from(edges)

        pos = nx.nx_agraph.graphviz_layout(G, prog="dot")
        coordinates = [{'id': node, 'x': pos[node][0], 'y': pos[node][1]} for node in pos]

        return jsonify(coordinates)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)