export type ChatRole = 'user' | 'assistant' | 'tool';

export interface ToolCallPayload {
  id: string;
  name: string;
  arguments: string;
}

export interface ChatWireMessage {
  role: ChatRole;
  content: string | null;
  tool_call_id?: string;
  tool_calls?: ToolCallPayload[];
}

export interface ChatApiSuccess {
  message: ChatWireMessage;
  finish_reason: 'stop' | 'tool_calls';
}

export interface ChatApiError {
  error: string;
  configured?: boolean;
}
