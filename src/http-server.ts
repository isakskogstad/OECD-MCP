/**
 * OECD MCP Server - HTTP transport for cloud deployment
 * Supports both SSE (Server-Sent Events) and synchronous HTTP/JSON-RPC
 */

import express from 'express';
import cors from 'cors';
import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { marked } from 'marked';

// Import version from package.json (ES module compatible)
const require = createRequire(import.meta.url);
const { version: SERVER_VERSION } = require('../package.json');
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { OECDClient } from './oecd-client.js';
import { TOOL_DEFINITIONS, executeTool } from './tools.js';
import { RESOURCE_DEFINITIONS, readResource } from './resources.js';
import { PROMPT_DEFINITIONS, getPrompt } from './prompts.js';
import { SERVER_ICON } from './constants.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure marked for GitHub Flavored Markdown
marked.setOptions({
  gfm: true,
  breaks: false,
});

/**
 * Sanitize error messages to prevent information leakage
 * Only allow known safe error patterns through
 */
export function sanitizeErrorMessage(message: string): string {
  // Known safe error patterns from our code
  const safePatterns = [
    /^Unknown dataflow:/,
    /^Invalid filter format:/,
    /^OECD API request failed with status \d+$/,
    /^OECD API request timed out/,
    /^Unknown tool:/,
    /^Unknown resource:/,
    /^Unknown prompt:/,
    /^Unknown method:/,
    /^Method is required$/,
    /^Validation error:/,
    /^\{"error":"OECD API request failed"/, // JSON error format with detailed suggestions
  ];

  // Check if message matches a safe pattern
  for (const pattern of safePatterns) {
    if (pattern.test(message)) {
      return message;
    }
  }

  // For unknown errors, return a generic message
  // Full error is logged server-side for debugging
  return 'An unexpected error occurred. Please try again.';
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static assets (banner, images, etc.)
app.use('/assets', express.static(join(__dirname, '..', 'assets')));

// Initialize OECD client - direct API calls only, no caching
const client = new OECDClient();

/**
 * Create and configure an MCP server instance with all handlers
 */
function createMCPServer(): Server {
  const server = new Server(
    {
      name: 'oecd-mcp-server',
      version: SERVER_VERSION,
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    }
  );

  // ========== TOOLS ==========

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: TOOL_DEFINITIONS,
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    return await executeTool(client, name, args);
  });

  // ========== RESOURCES ==========

  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return { resources: RESOURCE_DEFINITIONS };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    return readResource(client, uri);
  });

  // ========== PROMPTS ==========

  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return { prompts: PROMPT_DEFINITIONS };
  });

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    return getPrompt(name, args || {});
  });

  return server;
}

// Helper to call MCP handlers directly (for HTTP/JSON-RPC mode)
async function callMCPHandler(server: Server, method: string, params?: any) {
  // Construct proper MCP request object
  const request = {
    method,
    params: params || {}
  };

  // Access server's internal request handlers
  const handlers = (server as any)['_requestHandlers'];
  const handler = handlers?.get(method);

  if (!handler) {
    throw new Error(`Unknown method: ${method}`);
  }

  return handler(request);
}

// Root endpoint - Mirror of GitHub README
app.get('/', (_req, res) => {
  try {
    // Read README.md from project root
    const readmePath = join(__dirname, '..', 'README.md');
    const readmeContent = readFileSync(readmePath, 'utf-8');

    // Convert markdown to HTML
    const htmlContent = marked.parse(readmeContent);

    // Render with GitHub-style CSS
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OECD MCP Server</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.5.1/github-markdown.min.css">
  <style>
    body {
      box-sizing: border-box;
      min-width: 200px;
      max-width: 980px;
      margin: 0 auto;
      padding: 45px;
      background-color: #ffffff;
    }
    @media (max-width: 767px) {
      body {
        padding: 15px;
      }
    }
    .markdown-body {
      box-sizing: border-box;
    }
  </style>
</head>
<body>
  <article class="markdown-body">
    ${htmlContent}
  </article>
</body>
</html>
    `);
  } catch (error) {
    console.error('Error rendering README:', error);
    res.status(500).send('Error loading README');
  }
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'oecd-mcp-server',
    version: SERVER_VERSION,
    timestamp: new Date().toISOString(),
  });
});

// ========== MCP ENDPOINTS ==========

/**
 * GET /mcp - Information page about the MCP endpoint
 */
app.get('/mcp', (req, res) => {
  // Check if this is an SSE connection attempt
  const acceptHeader = req.headers.accept || '';
  if (acceptHeader.includes('text/event-stream')) {
    // This is an SSE connection, handle it
    handleSSEConnection(req, res);
    return;
  }

  // Otherwise, return info page
  res.json({
    service: 'oecd-mcp-server',
    version: SERVER_VERSION,
    description: 'Model Context Protocol server for OECD statistical data',
    status: 'operational',
    usage: {
      method: 'POST',
      contentType: 'application/json',
      body: {
        jsonrpc: '2.0',
        id: 'request-id',
        method: 'tools/list | tools/call | resources/list | resources/read | prompts/list | prompts/get',
        params: {}
      }
    },
    examples: [
      {
        description: 'List all available tools',
        request: {
          method: 'POST',
          url: '/mcp',
          body: { jsonrpc: '2.0', id: 1, method: 'tools/list' }
        }
      },
      {
        description: 'Call a tool',
        request: {
          method: 'POST',
          url: '/mcp',
          body: {
            jsonrpc: '2.0',
            id: 2,
            method: 'tools/call',
            params: {
              name: 'search_dataflows',
              arguments: { query: 'GDP', limit: 10 }
            }
          }
        }
      }
    ],
    endpoints: {
      '/health': 'GET - Health check',
      '/mcp': 'POST - MCP protocol endpoint (JSON-RPC 2.0)',
      '/sse': 'GET - Server-Sent Events streaming (legacy)'
    },
    documentation: 'https://github.com/isakskogstad/OECD-MCP'
  });
});

/**
 * Handle SSE connection
 */
async function handleSSEConnection(req: express.Request, res: express.Response) {
  console.log('MCP SSE connection established via GET /mcp');

  const transport = new SSEServerTransport('/mcp', res);
  const server = createMCPServer();

  await server.connect(transport);

  // Handle client disconnect
  req.on('close', () => {
    console.log('MCP SSE connection closed');
  });
}

/**
 * POST /mcp - Synchronous HTTP/JSON-RPC transport for MCP
 * Implements full MCP protocol handshake and request handling
 */
app.post('/mcp', async (req, res) => {
  console.log('MCP JSON-RPC request via POST /mcp');

  try {
    // Detect JSON-RPC 2.0 format
    const isJsonRpc = 'jsonrpc' in req.body;
    const requestId = req.body.id;
    const method = req.body.method;
    const params = req.body.params;

    if (!method) {
      const error = { error: 'Method is required' };
      if (isJsonRpc) {
        return res.json({
          jsonrpc: '2.0',
          id: requestId,
          error: { code: -32600, message: 'Invalid Request', data: error }
        });
      }
      return res.status(400).json(error);
    }

    console.log(`[MCP] ${method}`, params ? { params } : {});

    // Handle initialize method (required for standard MCP)
    if (method === 'initialize') {
      const initResult = {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
          logging: {}
        },
        serverInfo: {
          name: 'oecd-mcp-server',
          version: SERVER_VERSION,
          icons: [
            {
              src: SERVER_ICON,
              mimeType: 'image/png',
              sizes: ['512x512'],
            }
          ],
          description: 'Model Context Protocol server for OECD statistical data via SDMX API'
        },
      };

      if (isJsonRpc) {
        return res.json({
          jsonrpc: '2.0',
          id: requestId,
          result: initResult
        });
      }
      return res.json(initResult);
    }

    // Handle ping method (health check)
    if (method === 'ping') {
      const pingResult = {};
      if (isJsonRpc) {
        return res.json({
          jsonrpc: '2.0',
          id: requestId,
          result: pingResult
        });
      }
      return res.json(pingResult);
    }

    // Handle initialized notification (no response needed)
    if (method === 'notifications/initialized') {
      console.log('Client initialization complete');
      // Notifications don't send responses
      return res.status(204).send();
    }

    // Create server instance
    const server = createMCPServer();

    // Route to appropriate MCP method
    let result;
    switch (method) {
      case 'tools/list':
        result = await callMCPHandler(server, 'tools/list');
        break;

      case 'tools/call':
        result = await callMCPHandler(server, 'tools/call', params);
        break;

      case 'resources/list':
        result = await callMCPHandler(server, 'resources/list');
        break;

      case 'resources/read':
        result = await callMCPHandler(server, 'resources/read', params);
        break;

      case 'prompts/list':
        result = await callMCPHandler(server, 'prompts/list');
        break;

      case 'prompts/get':
        result = await callMCPHandler(server, 'prompts/get', params);
        break;

      default:
        const unknownError = { error: `Unknown method: ${method}` };
        if (isJsonRpc) {
          return res.json({
            jsonrpc: '2.0',
            id: requestId,
            error: { code: -32601, message: 'Method not found', data: unknownError }
          });
        }
        return res.status(400).json(unknownError);
    }

    // Return result in appropriate format
    if (isJsonRpc) {
      return res.json({
        jsonrpc: '2.0',
        id: requestId,
        result
      });
    }
    res.json(result);
  } catch (error) {
    // Log full error internally for debugging
    console.error('Error processing MCP request:', error);

    // Sanitize error message - only expose safe, generic messages to clients
    const rawMessage = error instanceof Error ? error.message : 'Unknown error';
    const safeMessage = sanitizeErrorMessage(rawMessage);

    if ('jsonrpc' in req.body) {
      return res.json({
        jsonrpc: '2.0',
        id: req.body.id,
        error: { code: -32603, message: 'Internal error', data: { message: safeMessage } }
      });
    }
    res.status(500).json({ error: 'Internal server error', message: safeMessage });
  }
});

/**
 * GET /sse - Legacy SSE endpoint (for backward compatibility)
 */
app.get('/sse', async (req, res) => {
  console.log('Legacy SSE connection established via /sse');

  const transport = new SSEServerTransport('/message', res);
  const server = createMCPServer();

  await server.connect(transport);

  req.on('close', () => {
    console.log('Legacy SSE connection closed');
  });
});

/**
 * POST /message - Legacy message endpoint (for backward compatibility with /sse)
 */
app.post('/message', async (_req, res) => {
  // This endpoint is handled by the SSE transport
  res.status(200).end();
});

// ========== START SERVER ==========

app.listen(PORT, () => {
  console.log(`OECD MCP Server running on port ${PORT}`);
  console.log(`\nEndpoints:`);
  console.log(`  Root (README):   http://localhost:${PORT}/`);
  console.log(`  Health check:    http://localhost:${PORT}/health`);
  console.log(`  MCP (JSON-RPC):  POST http://localhost:${PORT}/mcp`);
  console.log(`  MCP (SSE):       GET  http://localhost:${PORT}/mcp (with Accept: text/event-stream)`);
  console.log(`  Legacy SSE:      GET  http://localhost:${PORT}/sse`);
  console.log(`\nTransport modes:`);
  console.log(`  - HTTP/JSON-RPC:  Use POST /mcp for synchronous requests (ChatGPT, Claude, etc.)`);
  console.log(`  - SSE:            Use GET /mcp with SSE headers for persistent connections`);
});
