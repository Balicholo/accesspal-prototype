import { ACCESSPAL_TOOLS } from './tools';

export function toRealtimeTools() {
  return ACCESSPAL_TOOLS.flatMap((tool) => {
    if (!('function' in tool)) return [];
    return [
      {
        type: 'function' as const,
        name: tool.function.name,
        description: tool.function.description ?? '',
        parameters: tool.function.parameters ?? {
          type: 'object',
          properties: {},
        },
      },
    ];
  });
}
