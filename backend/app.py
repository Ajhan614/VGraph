from flask import Flask, request, jsonify
from flask_cors import CORS
import networkx as nx
import pydot

app = Flask(__name__)
CORS(app)

@app.route('/calculate_coordinates', methods=['POST'])
def calculate_coordinates():
    try:      
        dot_file = request.files['file']
        if dot_file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
          
        dot_content = dot_file.read().decode('utf-8')
      
        graphs = pydot.graph_from_dot_data(dot_content)
        if not graphs:
            return jsonify({'error': 'Failed to parse DOT content'}), 400
      
        pdot_graph = graphs[0]
        is_directed = (pdot_graph.get_type() == 'digraph')
        
        # Используем MultiDiGraph, чтобы NetworkX не «проглатывал» множественные связи между A и C
        G = nx.MultiDiGraph() if is_directed else nx.MultiGraph()
            
        for node in pdot_graph.get_nodes():
            node_name = node.get_name().strip('"')
            # ПРОПУСКАЕМ системные узлы, задающие стили (чтобы убрать левый треугольник "nod e")
            if node_name in ['node', 'edge', 'graph']:
                continue
            G.add_node(node_name)

        parsed_edges = []
        target_ports_map = {}
              
        for edge in pdot_graph.get_edges():
            src_raw = edge.get_source().strip('"')
            dst_raw = edge.get_destination().strip('"')
            src_parts = src_raw.split(':')
            dst_parts = dst_raw.split(':')
        
            src_id = src_parts[0]
            dst_id = dst_parts[0]
        
            dst_port = dst_parts[1] if len(dst_parts) > 1 else 'default'
        
            parsed_edges.append({
                'source': src_id,
                'target': dst_id,
                'targetPort': dst_port
            })
        
            if dst_id not in target_ports_map:
                target_ports_map[dst_id] = []
            if dst_port not in target_ports_map[dst_id]:
                target_ports_map[dst_id].append(dst_port)

            G.add_edge(src_id, dst_id)
      
        if len(G.nodes()) == 0:
            return jsonify({'error': 'Graph is empty'}), 400
      
        # ВНИМАНИЕ: Я удалил строчку edges = [[u, v] for u, v in G.edges()], 
        # так как она стирала всю инфу о портах!
      
        pos = nx.nx_agraph.graphviz_layout(G, prog="dot")
      
        nodes = []
        for node, (x, y) in pos.items():
            node_id = str(node)
            nodes.append({
                'id': node_id,
                'x': float(x),
                'y': float(y),
                'ports': target_ports_map.get(node_id, []) 
            })
      
        return jsonify({'nodes': nodes, 'edges': parsed_edges})
      
    except Exception as e:
        print("ERROR:", str(e))
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)