import { Handle, type NodeProps, Position } from 'reactflow';

import { isWorkflowNodeType } from '../../core/workflow/types';
import { getNodeTypeIcon } from './icons/nodeTypeIconMap';

export function GenericWorkflowNode({ id, type, data, selected }: NodeProps): JSX.Element {
  const label = String((data as Record<string, unknown> | undefined)?.label ?? type);
  const outputPorts = Number((data as Record<string, unknown> | undefined)?.outputPorts ?? 1);
  const iconSrc = isWorkflowNodeType(type) ? getNodeTypeIcon(type) : null;
  const hasInput = type !== 'start';
  const hasOutput = type !== 'end';
  const ports = Number.isFinite(outputPorts) && outputPorts > 0 ? outputPorts : 1;

  return (
    <div
      style={{
        minWidth: 180,
        maxWidth: 220,
        border: selected ? '2px solid #2563eb' : '1px solid #94a3b8',
        borderRadius: 10,
        background: '#ffffff',
        padding: 10,
      }}
    >
      {hasInput ? <Handle id="input" type="target" position={Position.Left} /> : null}
      <div style={{ fontSize: 11, color: '#475569', marginBottom: 4 }}>{type}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {iconSrc ? (
          <img
            src={iconSrc}
            alt=""
            aria-hidden="true"
            width={18}
            height={18}
            style={{ flexShrink: 0 }}
          />
        ) : null}
        <div style={{ fontWeight: 600, color: '#0f172a' }}>{label}</div>
      </div>
      <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>{id}</div>
      {hasOutput
        ? Array.from({ length: ports }, (_, index) => {
            const top = ports === 1 ? '50%' : `${((index + 1) * 100) / (ports + 1)}%`;
            const handleId = ports === 1 ? 'output' : `branch-${index}`;

            return (
              <Handle
                key={handleId}
                id={handleId}
                type="source"
                position={Position.Right}
                style={{ top }}
              />
            );
          })
        : null}
    </div>
  );
}
