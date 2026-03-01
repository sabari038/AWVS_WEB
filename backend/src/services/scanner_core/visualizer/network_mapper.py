import networkx as nx
import matplotlib.pyplot as plt
import os
from scanners.network_scanner import NetworkScanner

def build_network_map(output_file="network_map.png"):
    arp_data = NetworkScanner().get_arp_table()
    graph = nx.Graph()

    for line in arp_data.split("\n"):
        if "-" in line:
            parts = line.split()
            if len(parts) >= 2:
                ip, mac = parts[0], parts[1]
                graph.add_node(ip)
                graph.add_edge("localhost", ip)

    plt.figure(figsize=(6, 4))
    nx.draw(graph, with_labels=True, node_color="skyblue", edge_color="gray", node_size=1500, font_size=8)
    plt.title("Network Map")
    plt.tight_layout()
    plt.savefig(output_file)
    plt.close()
    return output_file
