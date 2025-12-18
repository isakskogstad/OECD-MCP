# OECD MCP Server - Monitoring & Observability Guide

## Table of Contents

1. [Overview](#overview)
2. [Health Checks](#health-checks)
3. [Logging](#logging)
4. [Metrics (Planned)](#metrics-planned)
5. [Alerting](#alerting)
6. [Performance Monitoring](#performance-monitoring)
7. [Troubleshooting Dashboard](#troubleshooting-dashboard)

---

## Overview

### Observability Pillars

1. **Health Checks:** Is the service running?
2. **Logging:** What is the service doing?
3. **Metrics:** How is the service performing?
4. **Tracing:** Where is time spent in requests? (future)

### Current Monitoring Stack

- **Health Checks:** `/health` endpoint
- **Logging:** Structured JSON logs to stdout
- **Metrics:** Not yet implemented (planned)
- **Uptime Monitoring:** GitHub Actions (api-monitoring.yml)

---

## Health Checks

### Endpoint: GET /health

**Response (200 OK):**

```json
{
  "status": "healthy",
  "service": "oecd-mcp-server",
  "version": "4.0.0",
  "timestamp": "2025-12-01T15:30:00.000Z"
}
```

**Response (500 Error):**

```json
{
  "status": "unhealthy",
  "service": "oecd-mcp-server",
  "version": "4.0.0",
  "timestamp": "2025-12-01T15:30:00.000Z",
  "error": "Service degraded"
}
```

### Health Check Levels

**Current (Basic):**
- Server is running and can respond to HTTP requests

**Planned (Advanced):**
- OECD API connectivity check
- Memory usage check
- Response time check

### Implementation

Add advanced health checks to `http-server.ts`:

```typescript
app.get('/health', async (req, res) => {
  const checks = {
    server: 'healthy',
    oecd_api: 'unknown',
    memory: 'unknown',
  };

  // Check OECD API
  try {
    const testUrl = 'https://sdmx.oecd.org/public/rest/dataflow/OECD/all/all';
    const response = await fetch(testUrl, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    });
    checks.oecd_api = response.ok ? 'healthy' : 'unhealthy';
  } catch (error) {
    checks.oecd_api = 'unhealthy';
  }

  // Check memory usage
  const memUsage = process.memoryUsage();
  const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  checks.memory = heapUsedPercent < 90 ? 'healthy' : 'warning';

  const overallHealth = Object.values(checks).every(v => v === 'healthy');

  res.status(overallHealth ? 200 : 503).json({
    status: overallHealth ? 'healthy' : 'degraded',
    service: 'oecd-mcp-server',
    version: '4.0.0',
    timestamp: new Date().toISOString(),
    checks,
    memory: {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
      heapUsedPercent: Math.round(heapUsedPercent) + '%',
    }
  });
});
```

---

## Logging

### Current Logging

**Format:** Plain text to stdout

```
OECD MCP Server running on port 3000
MCP JSON-RPC request via POST /mcp
[MCP] tools/call { params: { name: 'search_dataflows', arguments: { query: 'GDP' } } }
```

### Recommended: Structured Logging

Install Winston or Pino:

```bash
npm install pino pino-pretty
```

**Implementation:**

```typescript
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: { colorize: true }
  } : undefined
});

// Usage
logger.info({ method: 'tools/call', tool: 'search_dataflows' }, 'MCP request');
logger.error({ err, method, params }, 'MCP request failed');
```

**Output (JSON):**

```json
{
  "level": 30,
  "time": 1701446400000,
  "pid": 1234,
  "hostname": "oecd-mcp-server-abc123",
  "method": "tools/call",
  "tool": "search_dataflows",
  "msg": "MCP request"
}
```

### Log Levels

| Level | When to Use |
|-------|-------------|
| `error` | Errors requiring attention |
| `warn` | Potential issues, degraded performance |
| `info` | Important events (requests, tool calls) |
| `debug` | Detailed debugging information |
| `trace` | Very verbose (OECD API responses, etc.) |

### Log Aggregation

**Render:**
- View logs in dashboard
- Stream logs: `render logs --tail`

**Kubernetes:**
- Use Fluentd/Fluent Bit → Elasticsearch → Kibana
- Or Loki → Grafana

**Docker:**
- Use Docker logging driver (json-file, syslog, etc.)
- Or forward to external service (Datadog, New Relic)

---

## Metrics (Planned)

### Prometheus Integration

**1. Install Prometheus client:**

```bash
npm install prom-client
```

**2. Add metrics endpoint:**

```typescript
import { register, collectDefaultMetrics, Counter, Histogram } from 'prom-client';

// Collect default Node.js metrics
collectDefaultMetrics({ prefix: 'oecd_mcp_' });

// Custom metrics
const httpRequestsTotal = new Counter({
  name: 'oecd_mcp_http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'path', 'status'],
});

const httpRequestDuration = new Histogram({
  name: 'oecd_mcp_http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'path'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

const mcpToolCallsTotal = new Counter({
  name: 'oecd_mcp_tool_calls_total',
  help: 'Total MCP tool calls',
  labelNames: ['tool_name', 'status'],
});

const oecdApiDuration = new Histogram({
  name: 'oecd_mcp_oecd_api_duration_seconds',
  help: 'OECD API request duration',
  labelNames: ['endpoint'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

**3. Instrument requests:**

```typescript
// HTTP middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestsTotal.labels(req.method, req.path, res.statusCode.toString()).inc();
    httpRequestDuration.labels(req.method, req.path).observe(duration);
  });
  next();
});

// MCP tool calls
mcpToolCallsTotal.labels(toolName, 'success').inc();
mcpToolCallsTotal.labels(toolName, 'error').inc();

// OECD API calls
const timer = oecdApiDuration.startTimer({ endpoint: 'dataflow' });
// ... make API call ...
timer();
```

### Key Metrics

**HTTP Metrics:**
- `oecd_mcp_http_requests_total` - Request count by method, path, status
- `oecd_mcp_http_request_duration_seconds` - Request latency distribution

**MCP Metrics:**
- `oecd_mcp_tool_calls_total` - Tool usage by name and status
- `oecd_mcp_tool_duration_seconds` - Tool execution time

**OECD API Metrics:**
- `oecd_mcp_oecd_api_requests_total` - API calls by endpoint
- `oecd_mcp_oecd_api_duration_seconds` - API response time
- `oecd_mcp_oecd_api_errors_total` - API errors by type

**Node.js Metrics (auto-collected):**
- `process_cpu_seconds_total` - CPU usage
- `nodejs_heap_size_used_bytes` - Memory usage
- `nodejs_heap_size_total_bytes` - Total heap size
- `nodejs_external_memory_bytes` - External memory (buffers, etc.)
- `nodejs_eventloop_lag_seconds` - Event loop lag

---

## Alerting

### Alert Rules (Prometheus)

**High error rate:**

```yaml
- alert: HighErrorRate
  expr: rate(oecd_mcp_http_requests_total{status=~"5.."}[5m]) > 0.1
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "High error rate on OECD MCP server"
    description: "Error rate is {{ $value }} requests/sec"
```

**Service down:**

```yaml
- alert: ServiceDown
  expr: up{job="oecd-mcp"} == 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "OECD MCP server is down"
```

**High memory usage:**

```yaml
- alert: HighMemoryUsage
  expr: nodejs_heap_size_used_bytes / nodejs_heap_size_total_bytes > 0.9
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "High memory usage on OECD MCP server"
    description: "Heap usage is {{ $value | humanizePercentage }}"
```

**Slow OECD API:**

```yaml
- alert: SlowOECDAPI
  expr: histogram_quantile(0.95, rate(oecd_mcp_oecd_api_duration_seconds_bucket[5m])) > 5
  for: 10m
  labels:
    severity: warning
  annotations:
    summary: "OECD API is slow"
    description: "P95 latency is {{ $value }}s"
```

### Notification Channels

**Options:**
- **Email:** Simple, built-in
- **Slack:** Real-time notifications
- **PagerDuty:** On-call rotations
- **Webhook:** Custom integrations

**Alertmanager config:**

```yaml
route:
  receiver: 'slack-notifications'
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 5m
  repeat_interval: 4h

receivers:
  - name: 'slack-notifications'
    slack_configs:
      - api_url: 'YOUR_SLACK_WEBHOOK_URL'
        channel: '#alerts'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}\n{{ .Annotations.description }}{{ end }}'
```

---

## Performance Monitoring

### Key Performance Indicators (KPIs)

**Availability:**
- **Target:** 99.9% uptime (SLO)
- **Current:** Monitored via GitHub Actions (api-monitoring.yml)

**Latency:**
- **Target:** P95 < 200ms (when warm)
- **Cold start:** < 60s (Render free tier)

**Error Rate:**
- **Target:** < 1% of requests
- **Track:** 4xx (client errors), 5xx (server errors)

**Throughput:**
- **Expected:** 10-100 req/min (low-medium traffic)
- **Max:** Limited by Render free tier CPU

### Performance Baselines

**HTTP Endpoints:**
- `/health` - 5-10ms
- `/mcp` (list tools) - 10-20ms
- `/mcp` (search_dataflows) - 50-150ms
- `/mcp` (query_data) - 500-2000ms (depends on OECD API)

**OECD API Calls:**
- List dataflows: 200-500ms
- Get data structure: 300-800ms
- Query data: 500-3000ms (depends on dataset size)

**Memory Usage:**
- Idle: ~100MB
- Under load: ~300MB
- Peak: ~450MB

**CPU Usage:**
- Idle: ~5-10m (0.005-0.01 cores)
- Under load: ~100-200m (0.1-0.2 cores)
- Peak: ~400m (0.4 cores)

### Performance Testing

**Load test with k6:**

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 10 },  // Ramp up to 10 users
    { duration: '3m', target: 10 },  // Stay at 10 users
    { duration: '1m', target: 0 },   // Ramp down
  ],
};

export default function () {
  const url = 'https://oecd-mcp-server.onrender.com/mcp';
  const payload = JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
  });
  const params = {
    headers: { 'Content-Type': 'application/json' },
  };

  const res = http.post(url, payload, params);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

**Run test:**

```bash
k6 run performance-test.js
```

---

## Troubleshooting Dashboard

### Quick Status Check

```bash
#!/bin/bash
# check-status.sh - Quick health check script

BASE_URL="${1:-https://oecd-mcp-server.onrender.com}"

echo "Checking OECD MCP Server health..."
echo "URL: $BASE_URL"
echo ""

# Health check
echo "1. Health Check:"
curl -s "$BASE_URL/health" | jq .
echo ""

# MCP tools list
echo "2. MCP Tools List:"
curl -s -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | jq '.result.tools | length'
echo " tools available"
echo ""

# Test search
echo "3. Test Search:"
curl -s -X POST "$BASE_URL/mcp" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"search_dataflows","arguments":{"query":"GDP","limit":3}}}' \
  | jq '.result.content[0].text | fromjson | .results | length'
echo " results found"
echo ""

echo "Status check complete!"
```

### Monitoring Checklist

Daily:
- [ ] Check uptime (GitHub Actions badge)
- [ ] Review error logs (if any)
- [ ] Check response times

Weekly:
- [ ] Review resource usage trends
- [ ] Check for OECD API issues
- [ ] Update dependencies (if needed)

Monthly:
- [ ] Performance testing
- [ ] Security audit
- [ ] Capacity planning

---

## Next Steps

1. **Implement Prometheus metrics** - Track performance and errors
2. **Set up Grafana dashboard** - Visualize metrics
3. **Add distributed tracing** - Trace requests through OECD API
4. **Implement structured logging** - Better log analysis
5. **Set up alerting** - Get notified of issues

---

**Built by Isak Skogstad** | MIT License
