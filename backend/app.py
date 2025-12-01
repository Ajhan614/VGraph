from flask import Flask, request, jsonify
from flask_cors import CORS
import networkx as nx
import traceback

app = Flask(__name__)
CORS(app)

@app.route('/calculate_coordinates', methods=['POST'])
def calculate_coordinates():
    try:
        print("REQUEST METHOD:", request.method)
        data = request.get_json(force=True)
        print("RAW DATA:", data)
        nodes = data.get('nodes', [])
        edges = data.get('edges', [])
        print("NODES:", nodes)
        print("EDGES:", edges)

        G = nx.Graph()
        G.add_nodes_from(nodes)
        G.add_edges_from(edges)

        pos = nx.kamada_kawai_layout(G)
        print("POS COMPUTED:", pos)

        coordinates = [{'id': int(node), 'x': float(pos[node][0]), 'y': float(pos[node][1])} for node in pos]
        print("COORDINATES TO RETURN:", coordinates)

        return jsonify(coordinates)
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)