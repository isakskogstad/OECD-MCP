# OECD MCP Server

A Model Context Protocol (MCP) server providing access to OECD's comprehensive statistical data through their SDMX API. This server enables AI assistants and chatbots to query economic, health, education, environmental, and other OECD datasets.

## Features

- **9 MCP Tools** for querying OECD data
- **3 MCP Resources** for browsing categories and datasets
- **3 MCP Prompts** for common analysis patterns
- **Curated Datasets** - Working OECD climate & environmental datasets
- **No Authentication Required** - Uses OECD's public API
- **SDMX-Compliant** - Uses OECD SDMX v2.1 API
- **Local & Cloud Deployment** - Works both locally and on Render
- **Automated API Monitoring** - Daily contract tests ensure reliability

## Important Notes

**Current Status:** This MCP server provides access to curated OECD datasets focused on climate and environmental data for functional urban areas (FUAs).

**OECD SDMX API Complexity:** The OECD SDMX API uses a complex structure with multiple agencies (e.g., "OECD.CFE.EDS", "OECD.SDD.NAD") and non-standard naming conventions. The `/dataflow/all` endpoint returns malformed JSON, making it impossible to programmatically discover all available datasets.

**Workaround:** This server uses a curated list of verified working dataflows. Additional datasets can be added to `src/known-dataflows.ts` as they are discovered and verified.

**Future Development:** Full OECD economic statistics (QNA, MEI, etc.) require identifying the correct agency IDs and dataflow structures. Contributions welcome!

## Installation

### NPM Package (Coming Soon)

```bash
npm install -g oecd-mcp-server
```

### Local Development

```bash
# Clone the repository
git clone https://github.com/isakskogstad/OECD-MCP-server.git
cd OECD-MCP-server

# Install dependencies
npm install

# Build the project
npm run build

# Run locally (stdio)
npm run start:stdio

# Run as HTTP server
npm start
```

### Claude Desktop Configuration

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "oecd": {
      "command": "node",
      "args": ["/path/to/OECD-MCP-server/dist/index.js"]
    }
  }
}
```

### Remote Access (HTTP/SSE)

For remote AI chatbot access:

```json
{
  "mcpServers": {
    "oecd": {
      "type": "sse",
      "url": "https://your-render-deployment.onrender.com/sse"
    }
  }
}
```

## Available Tools

### 1. search_dataflows
Search for OECD datasets by keyword.

```typescript
{
  query: "GDP",        // Search query
  limit: 20           // Max results (default: 20)
}
```

### 2. list_dataflows
List available OECD dataflows, optionally filtered by category.

```typescript
{
  category: "ECO",    // Optional: ECO, HEA, EDU, ENV, TRD, JOB, etc.
  limit: 50          // Max results (default: 50)
}
```

### 3. get_data_structure
Get metadata and structure of a specific dataset.

```typescript
{
  dataflow_id: "QNA"  // Dataflow ID (e.g., "QNA", "MEI", "HEALTH_STAT")
}
```

### 4. query_data
Query actual data from an OECD dataset.

```typescript
{
  dataflow_id: "QNA",
  filter: "USA.GDP..",           // Dimension filter (use "all" for all)
  start_period: "2020-Q1",      // Optional start period
  end_period: "2023-Q4",        // Optional end period
  last_n_observations: 10       // Optional: get only last N observations
}
```

### 5. get_categories
Get all available OECD data categories.

```typescript
{}  // No parameters
```

### 6. get_popular_datasets
Get commonly used OECD datasets.

```typescript
{}  // No parameters
```

### 7. search_indicators
Search for specific economic indicators.

```typescript
{
  indicator: "inflation",  // Indicator to search for
  category: "ECO"         // Optional category filter
}
```

### 8. get_dataflow_url
Generate OECD Data Explorer URL for a dataset. Provides direct links for visual exploration.

```typescript
{
  dataflow_id: "QNA",           // Dataflow ID
  filter: "USA.GDP.."           // Optional dimension filter
}
```

**Returns**: Direct URL where users can:
- Visualize data interactively
- Apply additional filters
- Click "Developer API" for exact SDMX queries
- Export data in various formats

### 9. list_categories_detailed
Get all OECD data categories with example datasets for each.

```typescript
{}  // No parameters
```

**Returns**: Comprehensive list of 17 categories with:
- Category name and ID
- Description of data topics
- 3-5 example datasets per category
- Total dataset count per category

## OECD Data Categories

The server provides access to **17 main categories** covering all OECD data topics:

1. **Agriculture and Fisheries (AGR)** - Agricultural production, food security, fisheries
2. **Development (DEV)** - Development aid, ODA, international cooperation
3. **Economy (ECO)** - GDP, growth, inflation, interest rates, forecasts
4. **Education (EDU)** - Education outcomes, PISA, spending, attainment
5. **Employment (JOB)** - Labour market, unemployment, wages, working conditions
6. **Energy (NRG)** - Energy production, consumption, renewables, prices
7. **Environment (ENV)** - Climate, emissions, pollution, green growth, biodiversity
8. **Finance (FIN)** - Financial markets, banking, insurance, pensions
9. **Government (GOV)** - Public sector, governance, trust, e-government
10. **Health (HEA)** - Healthcare, life expectancy, health spending, outcomes
11. **Industry and Services (IND)** - Industrial production, services, productivity
12. **Innovation and Technology (STI)** - R&D, patents, digital economy, AI
13. **Social Protection and Well-being (SOC)** - Social spending, inequality, quality of life
14. **Taxation (TAX)** - Tax revenues, tax rates, tax policy
15. **Trade (TRD)** - International trade, imports, exports, trade agreements
16. **Transport (TRA)** - Infrastructure, mobility, freight, passenger transport
17. **Regional Statistics (REG)** - Sub-national data, cities, regions, territorial indicators

## Available Resources

### oecd://categories
List of all OECD data categories with descriptions.

### oecd://dataflows/popular
Popular OECD datasets with IDs and descriptions.

### oecd://api/info
Information about the OECD SDMX API endpoints.

## Available Prompts

### analyze_economic_trend
Analyze economic indicators over time.

```typescript
{
  indicator: "GDP",
  countries: "USA,GBR,DEU",
  time_period: "2020-2023"      // Optional
}
```

### compare_countries
Compare data across multiple countries.

```typescript
{
  indicator: "GDP per capita",
  countries: "USA,GBR,FRA,DEU,JPN",
  year: "2023"                  // Optional
}
```

### get_latest_statistics
Get most recent statistics for a topic.

```typescript
{
  topic: "unemployment",
  country: "USA"                // Optional
}
```

## Popular Datasets

- **QNA** - Quarterly National Accounts (GDP data)
- **MEI** - Main Economic Indicators (CPI, unemployment)
- **EO** - Economic Outlook (projections)
- **HEALTH_STAT** - Health Statistics
- **PISA** - Education Assessment Results
- **UN_DEN** - Unemployment by Duration
- **GREEN_GROWTH** - Environmental Indicators
- **CTS** - Trade in Services
- **FDI** - Foreign Direct Investment
- **REV** - Revenue Statistics

## Example Usage

### Query GDP Data
```typescript
// Search for GDP datasets
search_dataflows({ query: "GDP" })

// Get structure
get_data_structure({ dataflow_id: "QNA" })

// Query data for USA
query_data({
  dataflow_id: "QNA",
  filter: "USA.GDP..",
  start_period: "2020-Q1",
  end_period: "2023-Q4"
})
```

### Compare Countries
```typescript
// Use the compare_countries prompt
compare_countries({
  indicator: "GDP per capita",
  countries: "USA,GBR,FRA,DEU,JPN",
  year: "2023"
})
```

### Get Latest Unemployment
```typescript
// Use the get_latest_statistics prompt
get_latest_statistics({
  topic: "unemployment",
  country: "USA"
})
```

## API Information

- **Base URL**: https://sdmx.oecd.org/public/rest/
- **Format**: SDMX-JSON v2.1 (Statistical Data and Metadata eXchange)
- **Authentication**: None required (public API)
- **Rate Limiting**: Please be respectful with API usage
- **Documentation**: https://data.oecd.org/
- **Migration**: Legacy OECD.Stat APIs deprecated June 2024

## Deployment

### Render Deployment

1. **Push to GitHub**:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/isakskogstad/OECD-MCP-server.git
git push -u origin main
```

2. **Deploy on Render**:
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect `render.yaml` and deploy

3. **Access**:
   - Health check: `https://your-app.onrender.com/health`
   - SSE endpoint: `https://your-app.onrender.com/sse`

### Docker Deployment

```bash
# Build image
docker build -t oecd-mcp-server .

# Run container
docker run -p 3000:3000 oecd-mcp-server

# Check health
curl http://localhost:3000/health
```

## Development

### Project Structure
```
oecd-mcp-server/
├── src/
│   ├── index.ts          # MCP server (stdio transport)
│   ├── http-server.ts    # HTTP server for cloud deployment
│   ├── sdmx-client.ts    # OECD SDMX API client
│   ├── oecd-client.ts    # High-level OECD client
│   └── types.ts          # TypeScript type definitions
├── tests/
│   └── contract/
│       └── api-contract.test.ts  # API contract tests
├── .github/
│   └── workflows/
│       └── api-monitoring.yml    # Daily API monitoring
├── dist/                 # Compiled JavaScript
├── Dockerfile           # Docker configuration
├── render.yaml          # Render deployment config
├── vitest.config.ts     # Test configuration
├── package.json
├── tsconfig.json
└── README.md
```

### Running Tests
```bash
# Run all tests
npm test

# Run contract tests
npm test tests/contract/api-contract.test.ts

# Build project
npm run build
```

### Development Mode
```bash
npm run dev  # Watch mode with auto-rebuild
```

## Automated Monitoring

The server includes automated API monitoring via GitHub Actions:

- **Daily contract tests** verify API availability and structure
- **Automatic issue creation** when tests fail
- **Automatic issue closure** when tests pass again
- **Manual workflow trigger** available for on-demand testing

View monitoring status: `.github/workflows/api-monitoring.yml`

## Troubleshooting

### OECD API Returns No Data
- Check that the dataflow ID is correct
- Verify the filter syntax matches SDMX conventions
- Ensure the time period is valid for the dataset
- Use `get_data_structure` first to understand dimensions

### Connection Issues
- Verify internet connectivity
- Check if OECD API is accessible: https://sdmx.oecd.org/public/rest/
- Review error messages in console
- Check GitHub Actions for API status

### Structure Parsing Errors
- SDMX structure varies by dataset
- Some datasets may use different formats
- Check contract tests for known working examples
- Review raw API response for debugging

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

- **Issues**: Report bugs or request features via GitHub Issues
- **OECD API Documentation**: https://data.oecd.org/
- **SDMX Documentation**: https://sdmx.org/
- **MCP Documentation**: https://modelcontextprotocol.io/

## Acknowledgments

- Built with the [Model Context Protocol SDK](https://github.com/modelcontextprotocol)
- Data provided by [OECD](https://www.oecd.org/)
- Uses the [SDMX standard](https://sdmx.org/) for statistical data exchange
- SDMX v2.1 implementation based on OECD Data API documentation (2024)
