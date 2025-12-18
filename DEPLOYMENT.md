# OECD MCP Server - Deployment Guide

## Table of Contents

1. [Deployment Options](#deployment-options)
2. [Render Deployment (Current)](#render-deployment-current)
3. [Docker Deployment](#docker-deployment)
4. [Kubernetes Deployment](#kubernetes-deployment)
5. [Environment Variables](#environment-variables)
6. [Health Checks & Monitoring](#health-checks--monitoring)
7. [Security Best Practices](#security-best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Deployment Options

| Platform | Use Case | Cost | Setup Time | Scalability |
|----------|----------|------|------------|-------------|
| **Render** | Quick deployment, free tier | Free - $7/mo | 5 min | Low-Medium |
| **Docker** | Local development, VPS | VPS cost | 10 min | Medium |
| **Kubernetes** | Production, high availability | Medium-High | 30 min | High |

---

## Render Deployment (Current)

### Current Status
- **URL:** https://oecd-mcp-server.onrender.com
- **Region:** Frankfurt
- **Plan:** Free tier
- **Auto-deploy:** Enabled (from `main` branch)

### Configuration

The deployment is configured via `render.yaml`:

```yaml
services:
  - type: web
    name: oecd-mcp-server
    env: docker
    plan: free
    region: frankfurt
    dockerfilePath: ./Dockerfile
    healthCheckPath: /health
    branch: main
```

### Free Tier Limitations

**Cold Starts:**
- After 15 minutes of inactivity, the service spins down
- First request takes 30-60 seconds to wake up
- Subsequent requests are fast (~100-150ms)

**Solution:** Upgrade to paid plan ($7/month) for always-on service.

### Environment Variables

Set in Render dashboard or `render.yaml`:

```yaml
envVars:
  - key: NODE_ENV
    value: production
  - key: PORT
    value: 3000
  - key: NODE_OPTIONS
    value: "--max-old-space-size=450"
```

### Deployment Process

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```

2. **Automatic Deployment:**
   - Render detects the push
   - Builds Docker image
   - Runs health checks
   - Routes traffic to new deployment

3. **Monitor Deployment:**
   - View logs in Render dashboard
   - Check health: https://oecd-mcp-server.onrender.com/health

### Manual Deploy

If auto-deploy fails:

```bash
# Via Render Dashboard:
# Settings → Manual Deploy → Deploy latest commit

# Or force rebuild:
curl -X POST https://api.render.com/deploy/srv-YOUR_SERVICE_ID \
  -H "Authorization: Bearer YOUR_API_KEY"
```

---

## Docker Deployment

### Prerequisites

- Docker installed (20.10+)
- Docker Compose (optional, for easier management)

### Build & Run

**Single Container:**

```bash
# Build image
docker build -t oecd-mcp:latest .

# Run container
docker run -d \
  --name oecd-mcp \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  --restart unless-stopped \
  oecd-mcp:latest

# Check health
curl http://localhost:3000/health
```

**With Docker Compose:**

```bash
# Start service
docker-compose up -d

# View logs
docker-compose logs -f

# Stop service
docker-compose down
```

### Image Optimization

**Multi-stage build results:**
- Build stage: ~500MB (includes TypeScript, dev deps)
- Production stage: ~150MB (only runtime deps)
- Final image: Node.js Alpine + app code

**Security features:**
- Non-root user (UID 1001)
- Read-only filesystem
- Security updates applied
- Minimal attack surface

### Push to Registry

**Docker Hub:**

```bash
docker tag oecd-mcp:latest yourusername/oecd-mcp:v4.0.0
docker push yourusername/oecd-mcp:v4.0.0
```

**GitHub Container Registry:**

```bash
docker tag oecd-mcp:latest ghcr.io/isakskogstad/oecd-mcp:v4.0.0
echo $GITHUB_TOKEN | docker login ghcr.io -u isakskogstad --password-stdin
docker push ghcr.io/isakskogstad/oecd-mcp:v4.0.0
```

---

## Kubernetes Deployment

### Prerequisites

- Kubernetes cluster (1.19+)
- `kubectl` configured
- Ingress controller (nginx, traefik, etc.)
- Cert-manager (for TLS)

### Quick Deploy

```bash
# Apply all resources
kubectl apply -f k8s-deployment.yaml

# Check deployment
kubectl get pods -n mcp-servers
kubectl get svc -n mcp-servers

# View logs
kubectl logs -n mcp-servers -l app=oecd-mcp --tail=100 -f
```

### Configuration

The `k8s-deployment.yaml` includes:

1. **Namespace:** `mcp-servers`
2. **Deployment:** 2 replicas, rolling update strategy
3. **Service:** ClusterIP on port 80
4. **HPA:** Auto-scale 2-10 pods based on CPU/memory
5. **Ingress:** HTTPS with Let's Encrypt
6. **PodDisruptionBudget:** Ensure 1 pod always available

### Scaling

**Manual:**

```bash
kubectl scale deployment oecd-mcp-server -n mcp-servers --replicas=5
```

**Automatic (HPA):**
- Scales up when CPU > 70% or Memory > 80%
- Scales down after 5 minutes of low usage
- Min: 2 replicas, Max: 10 replicas

### Resource Limits

```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "100m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

**Typical usage:**
- Idle: ~100MB RAM, 10m CPU
- Under load: ~300MB RAM, 200m CPU
- Peak: ~450MB RAM, 400m CPU

### High Availability

**Zero-downtime deployments:**
- `maxUnavailable: 0` ensures at least 1 pod always running
- `readinessProbe` prevents routing to unhealthy pods
- `PodDisruptionBudget` protects against voluntary disruptions

**Health checks:**
- **Liveness:** Restart unhealthy pods
- **Readiness:** Remove from service if not ready
- **Startup:** Allow 150s for cold starts

### Monitoring

**Prometheus scraping:**

Annotations on pods enable automatic scraping:

```yaml
annotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "3000"
  prometheus.io/path: "/metrics"
```

**Grafana dashboard:**

Import dashboard ID: (to be created - see Monitoring section)

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Node.js environment |
| `PORT` | `3000` | HTTP server port |
| `NODE_OPTIONS` | `--max-old-space-size=512` | Node.js memory limit |

### Memory Optimization

**Free tier (512MB RAM):**
- Set `NODE_OPTIONS=--max-old-space-size=450`
- Leaves headroom for OS and container overhead

**Production (1GB+ RAM):**
- Set `NODE_OPTIONS=--max-old-space-size=768`
- Better performance under high load

**Enterprise (2GB+ RAM):**
- Set `NODE_OPTIONS=--max-old-space-size=1536`
- Optimal for high-traffic scenarios

---

## Health Checks & Monitoring

### Health Endpoint

**GET /health**

Returns service status:

```json
{
  "status": "healthy",
  "service": "oecd-mcp-server",
  "version": "4.0.0",
  "timestamp": "2025-12-01T15:30:00.000Z"
}
```

**HTTP 200:** Service healthy
**HTTP 500:** Service unhealthy

### Docker Health Check

Configured in `Dockerfile`:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
```

- Checks every 30 seconds
- 3-second timeout
- 10-second grace period on startup
- Unhealthy after 3 consecutive failures

### Kubernetes Probes

**Liveness Probe:**
- Restarts pod if unhealthy
- Initial delay: 15s
- Period: 20s
- Failure threshold: 3

**Readiness Probe:**
- Removes from load balancer if not ready
- Initial delay: 5s
- Period: 10s
- Failure threshold: 2

**Startup Probe:**
- Allows extra time for cold starts
- Max startup time: 150s (30 failures * 5s)

### Logging

**Structured logging:**

All logs output to `stdout` in JSON format:

```json
{
  "level": "info",
  "timestamp": "2025-12-01T15:30:00.000Z",
  "message": "MCP JSON-RPC request via POST /mcp",
  "method": "tools/call",
  "params": {"name": "search_dataflows"}
}
```

**Log aggregation:**

- **Render:** View in dashboard or stream logs
- **Docker:** `docker logs -f oecd-mcp`
- **Kubernetes:** `kubectl logs -n mcp-servers -l app=oecd-mcp -f`

### Metrics (Future)

**Planned Prometheus metrics:**

```
# Request metrics
http_requests_total{method, path, status}
http_request_duration_seconds{method, path}

# MCP metrics
mcp_tool_calls_total{tool_name}
mcp_tool_duration_seconds{tool_name}
mcp_tool_errors_total{tool_name}

# OECD API metrics
oecd_api_requests_total{endpoint, status}
oecd_api_duration_seconds{endpoint}
oecd_api_errors_total{endpoint}

# System metrics
nodejs_heap_size_used_bytes
nodejs_heap_size_total_bytes
process_cpu_seconds_total
```

---

## Security Best Practices

### Container Security

**1. Non-root user:**
- Container runs as UID 1001 (nodejs)
- No privilege escalation allowed

**2. Read-only filesystem:**
- Application cannot write to disk (except `/tmp`)
- Prevents malware persistence

**3. Security updates:**
- Base image updated regularly
- `apk upgrade` in Dockerfile

**4. Minimal dependencies:**
- Only production dependencies included
- Smaller attack surface

### Network Security

**1. CORS configuration:**
- Configured in `http-server.ts`
- Allows all origins (public API)

**2. Rate limiting (recommended):**

Add nginx/traefik rate limiting:

```yaml
nginx.ingress.kubernetes.io/rate-limit: "100"  # 100 req/min per IP
```

**3. HTTPS enforcement:**
- Always use HTTPS in production
- Ingress handles TLS termination

### Input Validation

**1. Zod schemas:**
- All inputs validated with Zod
- Type-safe at runtime

**2. Error sanitization:**
- Error messages sanitized before sending to clients
- Full errors logged server-side only

**3. Timeout protection:**
- OECD API requests timeout after 30 seconds
- Prevents resource exhaustion

### Secrets Management

**Current:** No secrets required (public OECD API)

**Future (if auth added):**

- **Kubernetes:** Use Secrets or External Secrets Operator
- **Render:** Environment variables (encrypted at rest)
- **Docker:** Use Docker secrets or env files (not committed)

---

## Troubleshooting

### Common Issues

**1. Cold start timeouts (Render free tier)**

**Symptom:** First request takes 60+ seconds

**Solution:**
- This is expected on free tier
- Upgrade to paid plan for always-on service
- Or: Use external monitoring to keep service warm

**2. Out of memory errors**

**Symptom:** Container crashes with "JavaScript heap out of memory"

**Solution:**
- Increase `NODE_OPTIONS=--max-old-space-size=XXX`
- Check for memory leaks (use heap profiler)
- Upgrade to larger instance

**3. Health check failures**

**Symptom:** Kubernetes keeps restarting pods

**Solution:**
- Check if `/health` endpoint is accessible
- Increase `initialDelaySeconds` in probes
- Check application logs for errors

**4. OECD API timeouts**

**Symptom:** Frequent "OECD API request timed out" errors

**Solution:**
- OECD API may be slow/down
- Check OECD API status: https://sdmx.oecd.org/public/rest/
- Increase timeout in `sdmx-client.ts` (current: 30s)

**5. Docker build failures**

**Symptom:** Build fails during npm install or TypeScript compilation

**Solution:**
- Clear Docker cache: `docker build --no-cache`
- Check `package-lock.json` is committed
- Ensure Node.js version matches (20-alpine)

### Debug Commands

**Check container logs:**

```bash
# Docker
docker logs oecd-mcp --tail=100 -f

# Docker Compose
docker-compose logs -f

# Kubernetes
kubectl logs -n mcp-servers -l app=oecd-mcp --tail=100 -f
```

**Test health endpoint:**

```bash
# Local
curl http://localhost:3000/health

# Render
curl https://oecd-mcp-server.onrender.com/health

# Kubernetes (from inside cluster)
kubectl run -it --rm debug --image=curlimages/curl --restart=Never \
  -- curl http://oecd-mcp-service.mcp-servers.svc.cluster.local/health
```

**Test MCP endpoint:**

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list"
  }'
```

**Check resource usage:**

```bash
# Docker
docker stats oecd-mcp

# Kubernetes
kubectl top pods -n mcp-servers
```

### Support

**Issues:** https://github.com/isakskogstad/OECD-MCP/issues
**Discussions:** https://github.com/isakskogstad/OECD-MCP/discussions

---

## Changelog

### v4.0.0 (2025-12-01)
- Production-grade Dockerfile with multi-stage build
- Optimized render.yaml with memory limits
- Added Kubernetes deployment manifests
- Added Docker Compose configuration
- Enhanced security (non-root user, read-only fs)
- Comprehensive deployment documentation

### v3.0.x
- Initial production deployment on Render

---

**Built by Isak Skogstad** | MIT License
