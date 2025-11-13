import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { analyzeToolDefinition } from '../tools/analyze';
import { grammarToolDefinition } from '../tools/grammar';

export const tools: Tool[] = [
  analyzeToolDefinition,
  grammarToolDefinition,
];

export function getToolByName(name: string): Tool | undefined {
  return tools.find((tool) => tool.name === name);
}
