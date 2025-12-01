<div align="right">

<img src="https://flagcdn.com/w40/se.png" width="30" alt="Svenska"> **Svenska** | [<img src="https://flagcdn.com/w40/gb.png" width="30" alt="English"> **English**](README.md)

</div>

# OECD MCP Server

[![npm version](https://img.shields.io/npm/v/oecd-mcp.svg)](https://www.npmjs.com/package/oecd-mcp)
[![npm downloads](https://img.shields.io/npm/dm/oecd-mcp.svg)](https://www.npmjs.com/package/oecd-mcp)
[![MCP Registry](https://img.shields.io/badge/MCP-Registry-green.svg)](https://registry.modelcontextprotocol.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![API Monitoring](https://github.com/isakskogstad/OECD-MCP/actions/workflows/api-monitoring.yml/badge.svg)](https://github.com/isakskogstad/OECD-MCP/actions/workflows/api-monitoring.yml)

**Model Context Protocol-server för OECD-statistik** - Koppla LLM:er och AI-assistenter till 5 000+ ekonomiska dataset från OECD via SDMX API.

> **OECD** (Organisationen för ekonomiskt samarbete och utveckling) är en mellanstatlig organisation med 38 medlemsländer som tillhandahåller omfattande ekonomisk och statistisk data.

---

## 🚀 Snabbstart

### Fjärrserver (Rekommenderas)

Använd denna URL i vilken MCP-kompatibel klient som helst:

```
https://oecd-mcp-server.onrender.com/mcp
```

**Kompatibel med:** ChatGPT, Claude Web, VS Code Copilot, Cursor, och 400+ MCP-klienter.

### Lokal Installation

```bash
# Kör direkt med npx (rekommenderas)
npx oecd-mcp

# Eller installera globalt
npm install -g oecd-mcp
oecd-mcp
```

**Krav:** Node.js >= 18.0.0

---

## ✨ Funktioner

- **9 MCP-verktyg** - Sök, fråga och analysera OECD-data
- **5 000+ dataset** - Över 17 kategorier (ekonomi, hälsa, utbildning, etc.)
- **Ingen autentisering** - Offentlig API-åtkomst
- **Flera transporter** - HTTP/JSON-RPC, SSE, och stdio
- **Automatisk övervakning** - Dagliga tester säkerställer tillförlitlighet

---

## 📊 Populära Dataset

| Dataset | ID | Beskrivning |
|---------|-----|-------------|
| **Kvartalsvis Nationalräkenskaper** | QNA | BNP, konsumtion, investeringar per kvartal |
| **Huvudsakliga Ekonomiska Indikatorer** | MEI | KPI, arbetslöshet, produktionsindex |
| **Ekonomisk Prognos** | EO | Ekonomiska projektioner och prognoser |
| **Hälsostatistik** | HEALTH_STAT | Sjukvårdssystem och resultat |
| **PISA-resultat** | PISA | Utbildningsbedömningsresultat |
| **Grön Tillväxt** | GREEN_GROWTH | Miljö- och ekonomiska indikatorer |

---

## 🔧 Verktyg

### Dataset-upptäckt
- `search_dataflows` - Sök dataset med nyckelord
- `list_dataflows` - Bläddra dataset efter kategori
- `get_categories` - Lista alla 17 datakategorier
- `get_popular_datasets` - Hämta vanligt använda dataset
- `search_indicators` - Sök specifika indikatorer

### Dataåtkomst
- `get_data_structure` - Hämta dataset-metadata
- `query_data` - Fråga statistisk data
- `get_dataflow_url` - Generera OECD Data Explorer URL
- `list_categories_detailed` - Detaljerad kategoriinformation

---

## 📖 Exempel på Användning

```typescript
// Sök efter BNP-dataset
await use_mcp_tool("oecd", "search_dataflows", {
  query: "GDP"
});

// Fråga USA BNP-data
await use_mcp_tool("oecd", "query_data", {
  dataflow_id: "QNA",
  filter: "USA.GDP..",
  start_period: "2020-Q1",
  end_period: "2023-Q4"
});
```

---

<details>
<summary><b>🔌 Klientkonfiguration</b> (Klicka för att expandera)</summary>

### Anthropic-produkter

#### Claude Web (claude.ai)

1. Gå till **Inställningar** → **Integrationer**
2. Klicka på **Lägg till anpassad connector**
3. Ange: `https://oecd-mcp-server.onrender.com/mcp`

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

Eller lokal installation:
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
# Fjärr
claude mcp add --transport http oecd https://oecd-mcp-server.onrender.com/mcp

# Lokal
claude mcp add oecd -- npx -y oecd-mcp
```

---

### OpenAI-produkter

#### ChatGPT (Developer Mode)

1. Inställningar → **Connectors** → **Advanced**
2. Aktivera **Developer Mode**
3. Skapa connector med URL: `https://oecd-mcp-server.onrender.com/mcp`

---

### VS Code med GitHub Copilot

Inställningar → Tillägg → MCP → Lägg till Server:

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

### Andra Klienter

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
<summary><b>📂 OECD-datakategorier</b> (17 kategorier - Klicka för att expandera)</summary>

| Kategori | Kod | Ämnen | Dataset |
|----------|-----|-------|---------|
| **Ekonomi** | ECO | BNP, inflation, prognoser | 500+ |
| **Sysselsättning** | JOB | Arbetsmarknad, löner | 300+ |
| **Handel** | TRD | Internationell handel | 250+ |
| **Hälsa** | HEA | Sjukvård, livslängd | 200+ |
| **Utbildning** | EDU | PISA, resultat | 180+ |
| **Miljö** | ENV | Klimat, utsläpp | 150+ |
| **Innovation** | STI | FoU, patent, AI | 140+ |
| **Energi** | NRG | Produktion, förnybart | 120+ |
| **Beskattning** | TAX | Skatteintäkter, satser | 100+ |
| **Finans** | FIN | Marknader, bankväsen | 95+ |
| **Förvaltning** | GOV | Offentlig sektor, styrning | 90+ |
| **Socialt** | SOC | Ojämlikhet, livskvalitet | 85+ |
| **Jordbruk** | AGR | Produktion, livsmedelstrygghet | 75+ |
| **Industri** | IND | Industriproduktion | 70+ |
| **Utveckling** | DEV | Utvecklingsbistånd | 60+ |
| **Transport** | TRA | Infrastruktur, mobilitet | 50+ |
| **Regional** | REG | Sub-nationell data | 45+ |

</details>

---

<details>
<summary><b>💻 Utveckling & Distribution</b> (Klicka för att expandera)</summary>

### Projektstruktur

```
oecd-mcp/
├── src/
│   ├── index.ts              # MCP-server (stdio)
│   ├── http-server.ts        # HTTP-server
│   ├── http-jsonrpc-transport.ts
│   ├── oecd-client.ts
│   ├── sdmx-client.ts
│   └── types.ts
├── tests/contract/
├── Dockerfile
├── render.yaml
└── server.json
```

### Kommandon

```bash
npm run build       # Kompilera TypeScript
npm start           # Starta HTTP-server
npm test            # Kör tester
npm run dev         # Bevakningsläge
```

### Distribution

**Render:**
```bash
git push origin main
# Auto-distribuerar via render.yaml
# Hälsa: https://oecd-mcp-server.onrender.com/health
```

**Docker:**
```bash
docker build -t oecd-mcp .
docker run -p 3000:3000 oecd-mcp
```

### API-endpoints

| Endpoint | Metod | Beskrivning |
|----------|-------|-------------|
| `/mcp` | GET/POST | MCP-protokoll |
| `/sse` | GET | SSE-transport |
| `/health` | GET | Hälsokontroll |

</details>

---

<details>
<summary><b>🔍 Felsökning</b> (Klicka för att expandera)</summary>

### OECD API Returnerar Ingen Data
- Verifiera dataflödes-ID med `search_dataflows`
- Kontrollera filtersyntax matchar SDMX
- Använd `get_data_structure` för att förstå dimensioner

### Anslutningsproblem
- Kontrollera OECD API-status: https://sdmx.oecd.org/public/rest/
- Granska GitHub Actions för övervakning
- Kontrollera serverloggar

### Cold Starts (Render Gratis Plan)
- Första förfrågan efter 15 min inaktivitet tar 30-60s
- Efterföljande förfrågningar är snabba (~100-150ms)
- Uppgradera till betald plan ($7/mån) för alltid-på

</details>

---

## 🤝 Bidra

Bidrag är välkomna! Förbättringsområden:
- Lägg till verifierade dataflöden till `src/known-dataflows.ts`
- Exempel och handledningar
- Förbättrade verktyg
- Buggfixar och tester

[Skicka en pull request](https://github.com/isakskogstad/OECD-MCP/pulls)

---

## 📜 Licens

MIT License - Se [LICENSE](LICENSE)

---

## 📚 Resurser

- **OECD Dataportalen:** https://data.oecd.org/
- **SDMX-standard:** https://sdmx.org/
- **MCP-dokumentation:** https://modelcontextprotocol.io/
- **npm-paket:** https://www.npmjs.com/package/oecd-mcp
- **Ärenden:** [GitHub Issues](https://github.com/isakskogstad/OECD-MCP/issues)

---

**Skapat av Isak Skogstad** | Byggt med [Model Context Protocol SDK](https://github.com/modelcontextprotocol)
