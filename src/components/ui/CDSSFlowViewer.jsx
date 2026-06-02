import { useMemo } from 'react';
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';

// Custom node to display a rule
function RuleNode({ data }) {
  return (
    <div style={{
      background: data.status === 'active' ? '#e8f5e9' : '#fff3e0',
      border: `2px solid ${data.status === 'active' ? '#4caf50' : '#ff9800'}`,
      borderRadius: 12,
      padding: '12px 16px',
      minWidth: 220,
      maxWidth: 280,
      fontSize: 13,
      boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
    }}>
      <strong style={{ display: 'block', marginBottom: 6 }}>{data.name}</strong>
      <div style={{ color: '#555' }}>
        IF {data.condition?.parameter} {data.condition?.operator} {data.condition?.value}
      </div>
      <div style={{ color: '#1976d2', fontWeight: 600, marginTop: 4 }}>
        THEN {data.action?.message}
      </div>
    </div>
  );
}

const nodeTypes = { ruleNode: RuleNode };

export default function CDSSFlowViewer({ rules }) {
  // Build nodes and edges
  const { nodes, edges } = useMemo(() => {
    if (!rules || rules.length === 0) return { nodes: [], edges: [] };

    const activeRules = rules.filter(r => r.status === 'active');
    if (activeRules.length === 0) return { nodes: [], edges: [] };

    // Position vertically with spacing
    const spacingY = 180;
    const startY = 0;

    const newNodes = activeRules.map((rule, idx) => ({
      id: rule.id.toString(),
      type: 'ruleNode',
      position: { x: 250, y: startY + idx * spacingY },
      data: {
        name: rule.name,
        condition: rule.condition,
        action: rule.action,
        status: rule.status,
      },
    }));

    // Connect nodes sequentially
    const newEdges = [];
    for (let i = 0; i < newNodes.length - 1; i++) {
      newEdges.push({
        id: `e-${newNodes[i].id}-${newNodes[i+1].id}`,
        source: newNodes[i].id,
        target: newNodes[i+1].id,
        animated: true,
        style: { stroke: '#1976d2', strokeWidth: 2 },
      });
    }

    return { nodes: newNodes, edges: newEdges };
  }, [rules]);

  if (nodes.length === 0) {
    return (
      <div className="notification is-light">No active CDSS rules to visualize.</div>
    );
  }

  return (
    <div style={{ height: Math.max(300, nodes.length * 200), border: '1px solid #eee', borderRadius: 8 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Background />
        <Controls />
        <MiniMap
          nodeStrokeColor="#1976d2"
          nodeColor="#e3f2fd"
          nodeBorderRadius={8}
        />
      </ReactFlow>
    </div>
  );
}
