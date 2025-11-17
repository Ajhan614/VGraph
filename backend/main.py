import networkx as nx

G = nx.DiGraph()
G.add_nodes_from(["1","2","3","4","5","6","7","8"])
G.add_edges_from([("1","5"), ("1","3"),("1","4"),("2","5"),("5","6"),("5","7")])

if not nx.is_directed_acyclic_graph(G):
    G_cond = nx.condensation(G)
else:
    G_cond = G

pos = nx.nx_agraph.graphviz_layout(G_cond, prog="dot")