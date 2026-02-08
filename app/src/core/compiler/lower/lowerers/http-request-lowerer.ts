import type { ToolCallExecNode } from '../../../ir/types';
import type { Lowerer } from '../types';

export const httpRequestLowerer: Lowerer = {
  nodeType: 'httpRequest',
  lower(node) {
    const method = typeof node.config.method === 'string' ? node.config.method : 'GET';
    const url = typeof node.config.url === 'string' ? node.config.url : '';
    const responseFormat =
      typeof node.config.responseFormat === 'string' ? node.config.responseFormat : 'json';

    const execNode: ToolCallExecNode = {
      id: node.id,
      op: 'TOOL_CALL',
      tool: 'http.request',
      args: {
        method,
        url,
        responseFormat,
      },
      outputs: { result: `$vars.${node.id}.result` },
    };
    return { nodes: [execNode], edges: [], requiredTemplates: [] };
  },
};
