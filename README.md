<p align="center">
 <img width="640" height="320" alt="OECD MCP Server banner" src="https://github.com/user-attachments/assets/25c886ab-4857-4960-be26-dd250f3155b0" />
</p>

# OECD MCP Server

[![npm version](https://img.shields.io/npm/v/oecd-mcp)](https://www.npmjs.com/package/oecd-mcp)
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

<details>
<summary>🇸🇪 Snabbstart (Svenska)</summary>

Det är enkelt att ansluta en LLM / AI-chatbot till MCP-servern. Det enklaste sättet är att använda npm-paketet `oecd-mcp` via `npx`. Nedan finner du guider för olika klienter.

</details>

The easiest way to connect an LLM / AI chatbot to the MCP server is via the published npm package `oecd-mcp` using `npx`. Below you'll find guides for different clients.

---

### Claude Desktop

**1. Open Claude Desktop settings → Developer → "Edit Config"**

**2. Add to the JSON file:**

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

**3. Save and restart Claude Desktop**

---

### Claude Code

```bash
claude mcp add oecd npx -y oecd-mcp
```

**Verify:** `claude mcp list`

---

### OpenAI Codex

**`~/.codex/config.toml`:**

```toml
[mcp.oecd]
command = "npx"
args = ["-y", "oecd-mcp"]
transport = "stdio"
```

---

### From Source

```bash
git clone https://github.com/isakskogstad/OECD-MCP.git
cd OECD-MCP
npm install
npm run build
```

Then point your client at `node /absolute/path/to/OECD-MCP/dist/index.js`, e.g.:

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

---

## Features

<details>
<summary>🇸🇪 Funktioner (Svenska)</summary>

Servern ansluter till OECD SDMX API och ger tillgång till 5,000+ dataset i 17 kategorier.

**OECD SDMX API**
Tillgång till kvartalsvis nationalräkenskaper (QNA), huvudsakliga ekonomiska indikatorer (MEI), hälsostatistik, utbildningsdata, miljöindikatorer och mer från 38 OECD-medlemsländer plus partnerekonomier.

MCP-servern implementerar MCP-protokollet med stöd för:

- **9 verktyg** — Dataset-upptäckt (5) och dataåtkomst (4)
- **7 resurser** — Kategorier, länder, filterguide, ordlista, LLM-instruktioner
- **7 promptmallar** — Ekonomisk analys, landsjämförelser, nordiskt fokus

</details>

The server connects to the OECD SDMX API providing access to 5,000+ datasets across 17 categories:

**OECD SDMX API**
Access to quarterly national accounts (QNA), main economic indicators (MEI), health statistics, education data, environmental indicators, and more from 38 OECD member countries plus partner economies.

The MCP server implements the MCP protocol with support for:

- **9 tools** — Dataset discovery (5) and data access (4)
- **7 resources** — Categories, countries, filter guide, glossary, LLM instructions
- **7 prompt templates** — Economic analysis, country comparisons, Nordic focus

### Tools

| Tool                       | Description                      |
| -------------------------- | -------------------------------- |
| `search_dataflows`         | Search for datasets by keyword   |
| `list_dataflows`           | List datasets by category        |
| `get_categories`           | List all 17 data categories      |
| `get_popular_datasets`     | Get commonly used datasets       |
| `search_indicators`        | Search for specific indicators   |
| `get_data_structure`       | Get metadata for a dataset       |
| `query_data`               | Query statistical data           |
| `get_dataflow_url`         | Generate OECD Data Explorer link |
| `list_categories_detailed` | Detailed category information    |

### Resources

| Resource                   | Description                          |
| -------------------------- | ------------------------------------ |
| `oecd://categories`        | 17 data categories with descriptions |
| `oecd://dataflows/popular` | Curated popular datasets             |
| `oecd://countries`         | ISO 3166-1 alpha-3 country codes     |
| `oecd://filter-guide`      | SDMX filter syntax guide             |
| `oecd://glossary`          | Definitions of OECD terms            |
| `oecd://llm-instructions`  | Instructions for AI assistants       |
| `oecd://api/info`          | API information                      |

### Prompt Templates

| Prompt                   | Description                           |
| ------------------------ | ------------------------------------- |
| `analyze_economic_trend` | Analyze economic trends over time     |
| `compare_countries`      | Compare data between countries        |
| `get_latest_statistics`  | Get latest statistics                 |
| `explore_dataset`        | Guided dataset exploration            |
| `find_data_for_question` | Find the right dataset for a question |
| `build_filter`           | Help building SDMX filters            |
| `nordic_comparison`      | Compare Nordic countries              |

---

## Use Cases

<details>
<summary>🇸🇪 Användningsområden (Svenska)</summary>

### Ekonomer & Forskare

**Verktyg:**

| Verktyg              | Beskrivning                             |
| -------------------- | --------------------------------------- |
| `query_data`         | Fråga BNP, inflation, arbetslöshetsdata |
| `search_dataflows`   | Hitta dataset för forskningsfrågor      |
| `get_data_structure` | Förstå dataset-dimensioner              |

**Exempel:**

- "Jämför BNP-tillväxt mellan G7-länderna 2020-2024"
- "Analysera inflationstrender i eurozonen"
- "Hitta data om arbetsproduktivitet per sektor"

**App-exempel:** Mobil ekonomisk brief med BNP-trender och jämförelsediagram.

---

### Policyanalytiker

**Verktyg:**

| Verktyg            | Beskrivning                    |
| ------------------ | ------------------------------ |
| `get_categories`   | Bläddra i 17 policyområden     |
| `list_dataflows`   | Hitta relevanta policy-dataset |
| `get_dataflow_url` | Generera länkar för rapporter  |

**Exempel:**

- "Vilken sjukvårdsutgiftsdata finns för Sverige?"
- "Hitta utbildningsresultatindikatorer för PISA-analys"
- "Jämför miljöpolicyer i nordiska länder"

**App-exempel:** Hälsostatistik-dashboard med donutdiagram och landjämförelser.

---

### Datajournalister

**Verktyg:**

| Verktyg                | Beskrivning                        |
| ---------------------- | ---------------------------------- |
| `search_indicators`    | Hitta specifika mätvärden          |
| `get_popular_datasets` | Få tillgång till ofta citerad data |
| `query_data`           | Hämta siffror för artiklar         |

**Exempel:**

- "Hämta senaste arbetslöshetssiffror för EU-länder"
- "Hitta inkomstojämlikhetsdata (Gini-koefficient)"
- "Jämför skatteintäkter som % av BNP"

**App-exempel:** Produktivitetsjämförelse med stapeldiagram och trendlinjer.

</details>

### Economists & Researchers

**Tools:**

| Tool                 | Description                             |
| -------------------- | --------------------------------------- |
| `query_data`         | Query GDP, inflation, unemployment data |
| `search_dataflows`   | Find datasets for research questions    |
| `get_data_structure` | Understand dataset dimensions           |

**Examples:**

- "Compare GDP growth between G7 countries 2020-2024"
- "Analyze inflation trends in the Eurozone"
- "Find data on labor productivity by sector"

**App Example:**

<img width="320" alt="GDP Economic Brief" src="https://raw.githubusercontent.com/isakskogstad/OECD-MCP/main/assets/app-examples/app1-mobile-minimalist.png" />

_Mobile economic brief with GDP trends, G7 comparison charts, and sparkline visualizations from the QNA dataset._

---

### Policy Analysts

**Tools:**

| Tool               | Description                   |
| ------------------ | ----------------------------- |
| `get_categories`   | Browse 17 policy areas        |
| `list_dataflows`   | Find relevant policy datasets |
| `get_dataflow_url` | Generate links for reports    |

**Examples:**

- "What healthcare spending data is available for Sweden?"
- "Find education outcome indicators for PISA analysis"
- "Compare environmental policies across Nordic countries"

**App Example:**

<img width="500" alt="Health Statistics" src="https://raw.githubusercontent.com/isakskogstad/OECD-MCP/main/assets/app-examples/app2-light-minimalist.png" />

_Health statistics dashboard with donut chart overview and country comparison from the HEALTH_STAT dataset._

---

### Data Journalists

**Tools:**

| Tool                   | Description                |
| ---------------------- | -------------------------- |
| `search_indicators`    | Find specific metrics      |
| `get_popular_datasets` | Access commonly cited data |
| `query_data`           | Get numbers for stories    |

**Examples:**

- "Get latest unemployment figures for EU countries"
- "Find income inequality data (Gini coefficient)"
- "Compare tax revenues as % of GDP"

---

### Data Categories

<details>
<summary>View all 17 categories</summary>

| Category        | Code | Description                            | Datasets |
| --------------- | ---- | -------------------------------------- | -------- |
| **Economy**     | ECO  | GDP, growth, inflation, interest rates | 500+     |
| **Employment**  | JOB  | Labor market, wages                    | 300+     |
| **Trade**       | TRD  | International trade                    | 250+     |
| **Health**      | HEA  | Healthcare, life expectancy            | 200+     |
| **Education**   | EDU  | PISA, outcomes                         | 180+     |
| **Environment** | ENV  | Climate, emissions                     | 150+     |
| **Innovation**  | STI  | R&D, patents, AI                       | 140+     |
| **Energy**      | NRG  | Production, renewables                 | 120+     |
| **Taxation**    | TAX  | Tax revenues, tax rates                | 100+     |
| **Finance**     | FIN  | Markets, banking                       | 95+      |
| **Government**  | GOV  | Governance, public sector              | 90+      |
| **Social**      | SOC  | Inequality, quality of life            | 85+      |
| **Agriculture** | AGR  | Production, food security              | 75+      |
| **Industry**    | IND  | Industrial production                  | 70+      |
| **Development** | DEV  | Development aid                        | 60+      |
| **Transport**   | TRA  | Infrastructure, mobility               | 50+      |
| **Regional**    | REG  | Subnational data                       | 45+      |

</details>

---

## About

<details>
<summary>🇸🇪 Om (Svenska)</summary>

**Skapad av:** [Isak Skogstad](https://www.linkedin.com/in/isak-skogstad/)

**Kontakt:** [isak.skogstad@me.com](mailto:isak.skogstad@me.com)

**Fristående:** Detta projekt är fristående och är inte anslutet till, godkänt av eller officiellt kopplat till OECD (Organisationen för ekonomiskt samarbete och utveckling).

**Användarvillkor:** Data tillhandahålls via OECD:s öppna SDMX API. Se [OECD:s användarvillkor](https://www.oecd.org/termsandconditions/) för användningsvillkor.

</details>

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
