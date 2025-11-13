import type { MCPResponse } from '../mcp/types';

export function createMCPResponse(
  id: number | string,
  result: any
): MCPResponse {
  return {
    jsonrpc: '2.0',
    id,
    result,
  };
}

export function createMethodNotFound(id: number | string): MCPResponse {
  return {
    jsonrpc: '2.0',
    id,
    error: {
      code: -32601,
      message: 'Method not found',
    },
  };
}

export function createInvalidParams(
  id: number | string,
  message?: string
): MCPResponse {
  return {
    jsonrpc: '2.0',
    id,
    error: {
      code: -32602,
      message: message || 'Invalid params',
    },
  };
}

export function createInternalError(
  id: number | string,
  message?: string
): MCPResponse {
  return {
    jsonrpc: '2.0',
    id,
    error: {
      code: -32603,
      message: message || 'Internal error',
    },
  };
}

export function createInvalidRequest(id: number | string): MCPResponse {
  return {
    jsonrpc: '2.0',
    id,
    error: {
      code: -32600,
      message: 'Invalid Request',
    },
  };
}

export function createParseError(): MCPResponse {
  return {
    jsonrpc: '2.0',
    id: 0,
    error: {
      code: -32700,
      message: 'Parse error',
    },
  };
}
