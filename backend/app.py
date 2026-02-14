from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import networkx as nx
import pydot
import os

app = Flask(__name__,static_folder='build')
CORS(app)

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')
    
@app.route('/calculate_coordinates', methods=['POST'])
def calculate_coordinates():
    try:       
        dot_file = request.files['file']
        if dot_file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
            
        dot_content = dot_file.read().decode('utf-8')
        print("DOT CONTENT LENGTH:", len(dot_content))
        
        graphs = pydot.graph_from_dot_data(dot_content)
        if not graphs:
            return jsonify({'error': 'Failed to parse DOT content'}), 400
        
        pdot_graph = graphs[0] 

        is_directed = (pdot_graph.get_type() == 'digraph')

        if is_directed:
            G = nx.DiGraph()
        else:
            G = nx.Graph()
              
        for node in pdot_graph.get_nodes():
            node_name = node.get_name().strip('"')
            G.add_node(node_name)
                
        for edge in pdot_graph.get_edges():
            src = edge.get_source().strip('"')
            dst = edge.get_destination().strip('"')
            G.add_edge(src, dst)

        #сделать кластеризацию циклов (condensation + relabel)
        
        if len(G.nodes()) == 0:
            return jsonify({'error': 'Graph is empty'}), 400
        
        edges = [[u, v] for u, v in G.edges()]
        
        pos = nx.nx_agraph.graphviz_layout(G, prog="dot")
        print("POS COMPUTED for", len(pos), "nodes")
        
        nodes = []
        for node, (x, y) in pos.items():
            node_id = str(node)
            
            nodes.append({
                'id': node_id,
                'x': float(x),
                'y': float(y)
            })
        
        print("NODES TO RETURN:", len(nodes))
        print("EDGES TO RETURN:", len(edges))
        return jsonify({'nodes': nodes, 'edges': edges})
        
    except Exception as e:
        print("ERROR:", str(e))
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)