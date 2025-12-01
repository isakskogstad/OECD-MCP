<div align="right">

[<img src="https://flagcdn.com/w40/se.png" width="30" alt="Svenska"> **Svenska**](README.sv.md) | <img src="https://flagcdn.com/w40/gb.png" width="30" alt="English"> **English**

</div>

# OECD MCP Server

[![npm version](https://img.shields.io/npm/v/oecd-mcp.svg)](https://www.npmjs.com/package/oecd-mcp)
[![npm downloads](https://img.shields.io/npm/dm/oecd-mcp.svg)](https://www.npmjs.com/package/oecd-mcp)
[![MCP Registry](https://img.shields.io/badge/MCP-Registry-green.svg)](https://registry.modelcontextprotocol.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![API Monitoring](https://github.com/isakskogstad/OECD-MCP/actions/workflows/api-monitoring.yml/badge.svg)](https://github.com/isakskogstad/OECD-MCP/actions/workflows/api-monitoring.yml)

**Model Context Protocol server for OECD statistical data** - Connect LLMs and AI assistants to 5,000+ economic datasets from the OECD via SDMX API.

> **OECD** (Organisation for Economic Co-operation and Development) is an intergovernmental organisation with 38 member countries providing comprehensive economic and statistical data.

---

## 🚀 Quick Start

### Remote Server (Recommended)

Use this URL in any MCP-compatible client:

```
https://oecd-mcp-server.onrender.com/mcp
```

**Compatible with:** ChatGPT, Claude Web, VS Code Copilot, Cursor, and 400+ MCP clients.

### Local Installation

```bash
# Run directly with npx (recommended)
npx oecd-mcp

# Or install globally
npm install -g oecd-mcp
oecd-mcp
```

**Requirements:** Node.js >= 18.0.0

---

## ✨ Features

- **9 MCP Tools** - Search, query, and analyze OECD data
- **5,000+ Datasets** - Across 17 categories (economy, health, education, etc.)
- **No Authentication** - Public API access
- **Multiple Transports** - HTTP/JSON-RPC, SSE, and stdio
- **Auto-Monitoring** - Daily tests ensure reliability

---

## 📊 Popular Datasets

| Dataset | ID | Description |
|---------|-----|-------------|
| **Quarterly National Accounts** | QNA | GDP, consumption, investment by quarter |
| **Main Economic Indicators** | MEI | CPI, unemployment, production indices |
| **Economic Outlook** | EO | Economic projections and forecasts |
| **Health Statistics** | HEALTH_STAT | Healthcare systems and outcomes |
| **PISA Results** | PISA | Education assessment results |
| **Green Growth** | GREEN_GROWTH | Environmental and economic indicators |

---

## 🔧 Tools

### Dataset Discovery
- `search_dataflows` - Search datasets by keyword
- `list_dataflows` - Browse datasets by category
- `get_categories` - List all 17 data categories
- `get_popular_datasets` - Get commonly used datasets
- `search_indicators` - Search specific indicators

### Data Access
- `get_data_structure` - Get dataset metadata
- `query_data` - Query statistical data
- `get_dataflow_url` - Generate OECD Data Explorer URL
- `list_categories_detailed` - Detailed category information

---

## 📖 Example Usage

```typescript
// Search for GDP datasets
await use_mcp_tool("oecd", "search_dataflows", {
  query: "GDP"
});

// Query USA GDP data
await use_mcp_tool("oecd", "query_data", {
  dataflow_id: "QNA",
  filter: "USA.GDP..",
  start_period: "2020-Q1",
  end_period: "2023-Q4"
});
```

---

<details>
<summary><b>🔌 Client Configuration</b> (Click to expand)</summary>

### Anthropic Products

#### Claude Web (claude.ai)

1. Go to **Settings** → **Integrations**
2. Click **Add custom connector**
3. Enter: `https://oecd-mcp-server.onrender.com/mcp`

#### Claude Desktop

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "oecd": {
      "url": "https://oecd-mcp-server.onrender.com/mcp"
    }
  }
}
```

Or local installation:
```json
{
  "mcpServers": {
    "oecd": {
      "command": "npx",
      "args": ["-y", "oecd-mcp"]
    }
  }
}
```

#### Claude Code (CLI)

```bash
# Remote
claude mcp add --transport http oecd https://oecd-mcp-server.onrender.com/mcp

# Local
claude mcp add oecd -- npx -y oecd-mcp
```

---

### OpenAI Products

#### ChatGPT (Developer Mode)

1. Settings → **Connectors** → **Advanced**
2. Enable **Developer Mode**
3. Create connector with URL: `https://oecd-mcp-server.onrender.com/mcp`

---

### VS Code with GitHub Copilot

Settings → Extensions → MCP → Add Server:

```json
{
  "mcpServers": {
    "oecd": {
      "url": "https://oecd-mcp-server.onrender.com/mcp",
      "transport": "http"
    }
  }
}
```

---

### Other Clients

#### Cursor AI
```json
{
  "mcpServers": {
    "oecd": {
      "command": "npx",
      "args": ["-y", "oecd-mcp"]
    }
  }
}
```

#### Lovable.dev / Firebase Studio
```json
{
  "mcpServers": {
    "oecd": {
      "url": "https://oecd-mcp-server.onrender.com/sse",
      "transport": "sse"
    }
  }
}
```

</details>

---

<details>
<summary><b>📂 OECD Data Categories</b> (17 categories - Click to expand)</summary>

| Category | Code | Topics | Datasets |
|----------|------|--------|----------|
| **Economy** | ECO | GDP, inflation, forecasts | 500+ |
| **Employment** | JOB | Labour market, wages | 300+ |
| **Trade** | TRD | International trade | 250+ |
| **Health** | HEA | Healthcare, life expectancy | 200+ |
| **Education** | EDU | PISA, outcomes | 180+ |
| **Environment** | ENV | Climate, emissions | 150+ |
| **Innovation** | STI | R&D, patents, AI | 140+ |
| **Energy** | NRG | Production, renewables | 120+ |
| **Taxation** | TAX | Tax revenues, rates | 100+ |
| **Finance** | FIN | Markets, banking | 95+ |
| **Government** | GOV | Public sector, governance | 90+ |
| **Social** | SOC | Inequality, quality of life | 85+ |
| **Agriculture** | AGR | Production, food security | 75+ |
| **Industry** | IND | Industrial production | 70+ |
| **Development** | DEV | Development aid | 60+ |
| **Transport** | TRA | Infrastructure, mobility | 50+ |
| **Regional** | REG | Sub-national data | 45+ |

</details>

---

<details>
<summary><b>💻 Development & Deployment</b> (Click to expand)</summary>

### Project Structure

```
oecd-mcp/
├── src/
│   ├── index.ts              # MCP server (stdio)
│   ├── http-server.ts        # HTTP server
│   ├── http-jsonrpc-transport.ts
│   ├── oecd-client.ts
│   ├── sdmx-client.ts
│   └── types.ts
├── tests/contract/
├── Dockerfile
├── render.yaml
└── server.json
```

### Commands

```bash
npm run build       # Compile TypeScript
npm start           # Start HTTP server
npm test            # Run tests
npm run dev         # Watch mode
```

### Deployment

**Render:**
```bash
git push origin main
# Auto-deploys via render.yaml
# Health: https://oecd-mcp-server.onrender.com/health
```

**Docker:**
```bash
docker build -t oecd-mcp .
docker run -p 3000:3000 oecd-mcp
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/mcp` | GET/POST | MCP protocol |
| `/sse` | GET | SSE transport |
| `/health` | GET | Health check |

</details>

---

<details>
<summary><b>🔍 Troubleshooting</b> (Click to expand)</summary>

### OECD API Returns No Data
- Verify dataflow ID with `search_dataflows`
- Check filter syntax matches SDMX
- Use `get_data_structure` to understand dimensions

### Connection Issues
- Check OECD API status: https://sdmx.oecd.org/public/rest/
- Review GitHub Actions for monitoring
- Check server logs

### Cold Starts (Render Free Tier)
- First request after 15 min idle takes 30-60s
- Subsequent requests are fast (~100-150ms)
- Upgrade to paid plan ($7/mo) for always-on

</details>

---

## 🤝 Contributing

Contributions welcome! Areas for improvement:
- Add verified dataflows to `src/known-dataflows.ts`
- Examples and tutorials
- Enhanced tools
- Bug fixes and tests

[Submit a pull request](https://github.com/isakskogstad/OECD-MCP/pulls)

---

## 📜 License

MIT License - See [LICENSE](LICENSE)

---

## 📚 Resources

- **OECD Data Portal:** https://data.oecd.org/
- **SDMX Standard:** https://sdmx.org/
- **MCP Documentation:** https://modelcontextprotocol.io/
- **npm Package:** https://www.npmjs.com/package/oecd-mcp
- **Issues:** [GitHub Issues](https://github.com/isakskogstad/OECD-MCP/issues)

---

**Created by Isak Skogstad** | Built with [Model Context Protocol SDK](https://github.com/modelcontextprotocol)
