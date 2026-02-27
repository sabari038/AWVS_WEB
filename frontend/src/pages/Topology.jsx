import React, { useRef, useEffect, useState } from 'react';
import Card from '../components/ui/Card';
import ForceGraph2D from 'react-force-graph-2d';
import { Network } from 'lucide-react';

const Topology = () => {
    const containerRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const graphRef = useRef(null);

    const [gData, setGData] = useState({ nodes: [], links: [] });

    useEffect(() => {
        if (containerRef.current) {
            setDimensions({
                width: containerRef.current.clientWidth,
                height: containerRef.current.clientHeight
            });
        }

        import('../services/api').then(({ default: api }) => {
            api.get('/assets').then(res => {
                const assets = Object.values(res.data.assets || {});
                const nodes = [{ id: 'Internet', name: 'Internet Router', group: 0, size: 12, color: '#ffffff' }];
                const links = [];
                const subnets = new Set();

                assets.forEach(a => {
                    const parts = a.ip.split('.');
                    if (parts.length === 4) {
                        const subnet = `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
                        subnets.add(subnet);
                        nodes.push({ id: a.ip, name: a.os && a.os !== 'Unknown System' ? `${a.ip}\n(${a.os})` : a.ip, group: 2, size: 6, color: a.riskScore > 70 ? '#FF3D3D' : '#4ade80' });
                        links.push({ source: subnet, target: a.ip });
                    }
                });

                subnets.forEach(subnet => {
                    nodes.push({ id: subnet, name: `Switch\n${subnet}`, group: 1, size: 8, color: '#4A90D9' });
                    links.push({ source: 'Internet', target: subnet });
                });

                setGData({ nodes, links });

                setTimeout(() => {
                    if (graphRef.current) {
                        graphRef.current.zoomToFit(400, 50);
                    }
                }, 500);
            }).catch(console.error);
        });
    }, []);



    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
            <h1 style={{ margin: 0, fontSize: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Network color="var(--accent)" /> Network Topology
            </h1>

            <Card style={{ flex: 1, padding: 0 }}>
                <div ref={containerRef} style={{ width: '100%', height: '100%', backgroundColor: '#0A0E14' }}>
                    <ForceGraph2D
                        ref={graphRef}
                        width={dimensions.width}
                        height={dimensions.height}
                        graphData={gData}
                        nodeLabel="name"
                        nodeColor={n => n.color}
                        nodeVal={n => n.size}
                        linkColor={() => 'rgba(255,255,255,0.1)'}
                        backgroundColor="#0A0E14"
                        nodeRelSize={4}
                        linkWidth={1.5}
                        enableNodeDrag={true}
                        enablePanInteraction={true}
                        enableZoomInteraction={true}
                    />
                </div>
            </Card>
        </div>
    );
};

export default Topology;
