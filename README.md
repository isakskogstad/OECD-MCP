<p align="center">
  <img width="700" height="220" alt="OECD MCP Server banner" src="https://raw.githubusercontent.com/isakskogstad/OECD-MCP/main/assets/banner.svg" />
</p>

# OECD MCP Server

[![Server Status](https://img.shields.io/website?url=https%3A%2F%2Foecd-mcp.onrender.com%2Fhealth&label=MCP%20Server&up_message=online&down_message=offline)](https://oecd-mcp.onrender.com/health)
[![MCP Registry](https://img.shields.io/badge/MCP%20Registry-Published-brightgreen)](https://www.npmjs.com/package/oecd-mcp)
[![MCP Protocol](https://img.shields.io/badge/MCP-2024--11--05-green)](https://modelcontextprotocol.io/)
[![License](https://img.shields.io/badge/license-MIT-orange)](LICENSE)

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server providing AI assistants access to **OECD's 5,000+ economic and statistical datasets via SDMX API**. By connecting to the MCP server, you can use AI to search, analyze, and compare data from 38 OECD countries across economy, health, education, environment, and more.

<details>
<summary>🇸🇪 Svenska</summary>

En [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server som ger AI-assistenter tillgång till **OECD:s 5,000+ ekonomiska och statistiska dataset via SDMX API**. Genom att ansluta till MCP-servern kan du med hjälp av AI söka, analysera och jämföra data från 38 OECD-länder inom ekonomi, hälsa, utbildning, miljö och mer.

</details>

---

## Quick Start

It's easy to connect an LLM / AI chatbot to the MCP server. Connect either directly to the hosted server (simple and convenient) or install locally. Below you'll find guides for different clients.

<details>
<summary>🇸🇪 Snabbstart (Svenska)</summary>

Det är enkelt att ansluta en LLM / AI-chatbot till MCP-servern. Anslut antingen direkt till den hostade servern (enkelt och smidigt) eller installera lokalt.

</details>

### 1. AI Chatbots (Web)

<details>
<summary><strong>ChatGPT</strong></summary>

1. Open settings and enable **Developer Mode**
2. Go to **Connectors** → **Add Connection**
3. Enter URL: `https://oecd-mcp.onrender.com/mcp`
4. Click **Connect**

#### Video Guide
![ChatGPT MCP connection](https://allgot.se/wp-content/uploads/users/1/ChatGPT-MCP-guide.gif)

</details>

<details>
<summary><strong>Claude (Web)</strong></summary>

1. Go to https://claude.ai and log in
2. Click your profile (bottom left) → **Settings**
3. Go to **Developer** or **Integrations**
4. Click **Add MCP Server** or **Connect**
5. Name: `OECD`, URL: `https://oecd-mcp.onrender.com/mcp`
6. Click **Connect**

</details>

<img width="189" height="38" alt="claude chatgpt" src="https://allgot.se/wp-content/uploads/users/1/claude.chatgpt.png" />

---

### 2. Local Installation

<details>
<summary><strong>Claude Desktop</strong></summary>

**1. Clone and build:**
```bash
git clone https://github.com/isakskogstad/OECD-MCP.git
cd OECD-MCP
npm install && npm run build
```

**2. In Claude Desktop:**
- Settings → **Developer** (not Connectors!)
- Click **"Edit Config"**

**3. Add to the JSON file:**
```json
{
  "mcpServers": {
    "oecd": {
      "command": "node",
      "args": ["/absolute/path/to/OECD-MCP/dist/index.js"]
    }
  }
}
```

**4. Save and restart Claude Desktop**

**Note:** Local installation uses stdio transport via the Developer section, not Connectors.

</details>

<details>
<summary><strong>Claude Code</strong></summary>

**Remote Server:**
```bash
claude mcp add --transport http oecd https://oecd-mcp.onrender.com/mcp
```

**Local (from source):**
```bash
# After git clone and npm install (see above)
claude mcp add oecd node /absolute/path/to/dist/index.js
```

**Verify:** `claude mcp list`

</details>

<details>
<summary><strong>OpenAI Codex</strong></summary>

#### Remote Server (HTTP)

**`~/.codex/config.toml`:**
```toml
[mcp.oecd]
url = "https://oecd-mcp.onrender.com/mcp"
transport = "http"
```

#### Local Installation

**1. Clone and build (if not already done):**
```bash
git clone https://github.com/isakskogstad/OECD-MCP.git
cd OECD-MCP
npm install && npm run build
```

**2. Configure stdio transport:**

**`~/.codex/config.toml`:**
```toml
[mcp.oecd]
command = "node"
args = ["/absolute/path/to/OECD-MCP/dist/index.js"]
transport = "stdio"
```

**Windows:**
```toml
[mcp.oecd]
command = "node"
args = ["C:\\Users\\username\\OECD-MCP\\dist\\index.js"]
transport = "stdio"
```

</details>

<img width="273" height="46" alt="claudecode openaicodex googlegemini" src="https://allgot.se/wp-content/uploads/users/1/claudecode.openaicodex.googlegemini.png" />

---

## Features

The server connects to the OECD SDMX API providing access to 5,000+ datasets across 17 categories:

**OECD SDMX API**
Access to quarterly national accounts (QNA), main economic indicators (MEI), health statistics, education data, environmental indicators, and more from 38 OECD member countries plus partner economies.

The MCP server implements the MCP protocol with support for:
- **9 tools** — Dataset discovery (5) and data access (4)
- **7 resources** — Categories, countries, filter guide, glossary, LLM instructions
- **7 prompt templates** — Economic analysis, country comparisons, Nordic focus

### Tools

| Tool | Description |
|------|-------------|
| `search_dataflows` | Search for datasets by keyword |
| `list_dataflows` | List datasets by category |
| `get_categories` | List all 17 data categories |
| `get_popular_datasets` | Get commonly used datasets |
| `search_indicators` | Search for specific indicators |
| `get_data_structure` | Get metadata for a dataset |
| `query_data` | Query statistical data |
| `get_dataflow_url` | Generate OECD Data Explorer link |
| `list_categories_detailed` | Detailed category information |

### Resources

| Resource | Description |
|----------|-------------|
| `oecd://categories` | 17 data categories with descriptions |
| `oecd://dataflows/popular` | Curated popular datasets |
| `oecd://countries` | ISO 3166-1 alpha-3 country codes |
| `oecd://filter-guide` | SDMX filter syntax guide |
| `oecd://glossary` | Definitions of OECD terms |
| `oecd://llm-instructions` | Instructions for AI assistants |
| `oecd://api/info` | API information |

### Prompt Templates

| Prompt | Description |
|--------|-------------|
| `analyze_economic_trend` | Analyze economic trends over time |
| `compare_countries` | Compare data between countries |
| `get_latest_statistics` | Get latest statistics |
| `explore_dataset` | Guided dataset exploration |
| `find_data_for_question` | Find the right dataset for a question |
| `build_filter` | Help building SDMX filters |
| `nordic_comparison` | Compare Nordic countries |

---

## Use Cases

### Economists & Researchers

| Tool | Description |
|------|-------------|
| `query_data` | Query GDP, inflation, unemployment data |
| `search_dataflows` | Find datasets for research questions |
| `get_data_structure` | Understand dataset dimensions |

**Examples:**
- "Compare GDP growth between G7 countries 2020-2024"
- "Analyze inflation trends in the Eurozone"
- "Find data on labor productivity by sector"

---

### Policy Analysts

| Tool | Description |
|------|-------------|
| `get_categories` | Browse 17 policy areas |
| `list_dataflows` | Find relevant policy datasets |
| `get_dataflow_url` | Generate links for reports |

**Examples:**
- "What healthcare spending data is available for Sweden?"
- "Find education outcome indicators for PISA analysis"
- "Compare environmental policies across Nordic countries"

---

### Data Journalists

| Tool | Description |
|------|-------------|
| `search_indicators` | Find specific metrics |
| `get_popular_datasets` | Access commonly cited data |
| `query_data` | Get numbers for stories |

**Examples:**
- "Get latest unemployment figures for EU countries"
- "Find income inequality data (Gini coefficient)"
- "Compare tax revenues as % of GDP"

---

### Data Categories

<details>
<summary>View all 17 categories</summary>

| Category | Code | Description | Datasets |
|----------|------|-------------|----------|
| **Economy** | ECO | GDP, growth, inflation, interest rates | 500+ |
| **Employment** | JOB | Labor market, wages | 300+ |
| **Trade** | TRD | International trade | 250+ |
| **Health** | HEA | Healthcare, life expectancy | 200+ |
| **Education** | EDU | PISA, outcomes | 180+ |
| **Environment** | ENV | Climate, emissions | 150+ |
| **Innovation** | STI | R&D, patents, AI | 140+ |
| **Energy** | NRG | Production, renewables | 120+ |
| **Taxation** | TAX | Tax revenues, tax rates | 100+ |
| **Finance** | FIN | Markets, banking | 95+ |
| **Government** | GOV | Governance, public sector | 90+ |
| **Social** | SOC | Inequality, quality of life | 85+ |
| **Agriculture** | AGR | Production, food security | 75+ |
| **Industry** | IND | Industrial production | 70+ |
| **Development** | DEV | Development aid | 60+ |
| **Transport** | TRA | Infrastructure, mobility | 50+ |
| **Regional** | REG | Subnational data | 45+ |

</details>

---

## About

**Created by:** [Isak Skogstad](https://www.linkedin.com/in/isak-skogstad/)

**Contact:** [isak.skogstad@me.com](mailto:isak.skogstad@me.com)

**Disclaimer:** This project is independent and not affiliated with, endorsed by, or officially connected to the OECD (Organisation for Economic Co-operation and Development).

**Terms of use:** Data is provided via OECD's open SDMX API. See [OECD Terms and Conditions](https://www.oecd.org/termsandconditions/) for usage conditions.

---

## Resources

- **OECD Data Portal:** https://data.oecd.org/
- **SDMX Standard:** https://sdmx.org/
- **MCP Documentation:** https://modelcontextprotocol.io/
- **npm Package:** https://www.npmjs.com/package/oecd-mcp
- **Issues:** [GitHub Issues](https://github.com/isakskogstad/OECD-MCP/issues)

---

**Built with** [Model Context Protocol SDK](https://github.com/modelcontextprotocol) | **Version** 4.0.0
