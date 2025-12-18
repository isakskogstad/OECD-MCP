# OECD MCP Server - Deployment Checklist

## Pre-Deployment

### Code Quality
- [ ] All tests passing (`npm test`)
- [ ] TypeScript compiles without errors (`npm run build`)
- [ ] No console.log statements (use proper logging)
- [ ] Code reviewed and approved
- [ ] Version bumped in `package.json`
- [ ] CHANGELOG.md updated

### Security
- [ ] No secrets in code (API keys, passwords, etc.)
- [ ] Dependencies updated (`npm audit`)
- [ ] No high/critical vulnerabilities
- [ ] `.env` file not committed (check `.gitignore`)
- [ ] Environment variables documented in `.env.example`

### Configuration
- [ ] `Dockerfile` builds successfully
- [ ] `render.yaml` configuration correct
- [ ] Environment variables set in deployment platform
- [ ] Health check endpoint working (`/health`)
- [ ] Resource limits appropriate for tier

### Documentation
- [ ] README.md up to date
- [ ] API documentation complete
- [ ] Deployment guide reviewed
- [ ] Environment variables documented

---

## Deployment Process

### Render Deployment

**Automatic (Recommended):**

1. [ ] Commit changes to git
   ```bash
   git add .
   git commit -m "Description of changes"
   ```

2. [ ] Push to main branch
   ```bash
   git push origin main
   ```

3. [ ] Monitor deployment in Render dashboard
   - Watch build logs
   - Check for errors
   - Wait for "Live" status

4. [ ] Verify deployment
   ```bash
   curl https://oecd-mcp-server.onrender.com/health
   ```

**Manual:**

1. [ ] Trigger manual deploy in Render dashboard
2. [ ] Select commit/branch to deploy
3. [ ] Monitor build logs
4. [ ] Verify deployment

### Docker Deployment

1. [ ] Build Docker image
   ```bash
   docker build -t oecd-mcp:v4.0.0 .
   ```

2. [ ] Test image locally
   ```bash
   docker run -p 3000:3000 oecd-mcp:v4.0.0
   curl http://localhost:3000/health
   ```

3. [ ] Tag image
   ```bash
   docker tag oecd-mcp:v4.0.0 yourusername/oecd-mcp:v4.0.0
   docker tag oecd-mcp:v4.0.0 yourusername/oecd-mcp:latest
   ```

4. [ ] Push to registry
   ```bash
   docker push yourusername/oecd-mcp:v4.0.0
   docker push yourusername/oecd-mcp:latest
   ```

5. [ ] Deploy on target server
   ```bash
   docker pull yourusername/oecd-mcp:latest
   docker-compose up -d
   ```

### Kubernetes Deployment

1. [ ] Build and push Docker image (see above)

2. [ ] Update image tag in `k8s-deployment.yaml`
   ```yaml
   image: ghcr.io/isakskogstad/oecd-mcp:v4.0.0
   ```

3. [ ] Apply changes
   ```bash
   kubectl apply -f k8s-deployment.yaml
   ```

4. [ ] Monitor rollout
   ```bash
   kubectl rollout status deployment/oecd-mcp-server -n mcp-servers
   ```

5. [ ] Check pods
   ```bash
   kubectl get pods -n mcp-servers
   ```

6. [ ] Test service
   ```bash
   kubectl port-forward -n mcp-servers svc/oecd-mcp-service 8080:80
   curl http://localhost:8080/health
   ```

---

## Post-Deployment

### Verification

- [ ] Health check returns 200 OK
  ```bash
  curl https://oecd-mcp-server.onrender.com/health
  ```

- [ ] MCP endpoint responds
  ```bash
  curl -X POST https://oecd-mcp-server.onrender.com/mcp \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
  ```

- [ ] Tools work correctly
  ```bash
  curl -X POST https://oecd-mcp-server.onrender.com/mcp \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"search_dataflows","arguments":{"query":"GDP","limit":3}}}'
  ```

- [ ] Root endpoint shows README
  ```bash
  curl https://oecd-mcp-server.onrender.com/
  ```

- [ ] No errors in logs
  - Render: Check dashboard logs
  - Docker: `docker logs oecd-mcp`
  - Kubernetes: `kubectl logs -n mcp-servers -l app=oecd-mcp`

### Performance

- [ ] Response times acceptable
  - Health: < 100ms
  - Tools list: < 200ms
  - Search: < 500ms

- [ ] Memory usage normal
  - Idle: ~100MB
  - Under load: ~300MB

- [ ] No memory leaks (monitor over time)

- [ ] Cold start time acceptable (Render free tier: < 60s)

### Monitoring

- [ ] Health checks passing
- [ ] Uptime monitoring enabled (GitHub Actions)
- [ ] Error tracking configured (if using Sentry)
- [ ] Metrics endpoint accessible (if enabled)
- [ ] Logs properly aggregated

### External Services

- [ ] OECD API accessible
  ```bash
  curl -I https://sdmx.oecd.org/public/rest/dataflow/OECD/all/all
  ```

- [ ] MCP Registry updated (if version changed)
  ```bash
  npm publish  # If npm package updated
  ```

### Client Testing

- [ ] Claude Desktop: Test MCP connection
- [ ] Claude Web: Test custom connector
- [ ] ChatGPT: Test connector (if configured)
- [ ] Local client: Test stdio mode
  ```bash
  npx oecd-mcp
  ```

---

## Rollback Procedure

If deployment fails or issues discovered:

### Render

1. [ ] Go to Render dashboard
2. [ ] Navigate to oecd-mcp-server service
3. [ ] Click "Manual Deploy"
4. [ ] Select previous working commit
5. [ ] Deploy

### Docker

1. [ ] Pull previous version
   ```bash
   docker pull yourusername/oecd-mcp:v3.0.0
   ```

2. [ ] Update docker-compose.yml with previous tag

3. [ ] Restart service
   ```bash
   docker-compose up -d
   ```

### Kubernetes

1. [ ] Rollback deployment
   ```bash
   kubectl rollout undo deployment/oecd-mcp-server -n mcp-servers
   ```

2. [ ] Verify rollback
   ```bash
   kubectl rollout status deployment/oecd-mcp-server -n mcp-servers
   ```

---

## Post-Rollback

- [ ] Identify root cause of failure
- [ ] Fix issue in code
- [ ] Test fix locally
- [ ] Re-run deployment checklist
- [ ] Document incident (if major)

---

## Scheduled Maintenance

### Weekly

- [ ] Check for security updates
  ```bash
  npm audit
  ```

- [ ] Review error logs

- [ ] Check resource usage trends

- [ ] Verify health check passing

### Monthly

- [ ] Update dependencies
  ```bash
  npm update
  npm audit fix
  ```

- [ ] Performance testing

- [ ] Review and optimize resource limits

- [ ] Backup configuration files

### Quarterly

- [ ] Major version updates (if available)

- [ ] Security audit

- [ ] Load testing

- [ ] Disaster recovery drill

- [ ] Review and update documentation

---

## Emergency Contacts

**Service Owner:** Isak Skogstad
**GitHub:** https://github.com/isakskogstad/OECD-MCP
**Issues:** https://github.com/isakskogstad/OECD-MCP/issues

**OECD API Support:**
- Website: https://data.oecd.org/
- Status: https://sdmx.oecd.org/public/rest/

**Render Support:**
- Dashboard: https://dashboard.render.com/
- Docs: https://render.com/docs

---

## Notes

Use this space for deployment-specific notes:

**v4.0.0 Deployment (2025-12-01):**
- Removed Supabase integration
- Simplified architecture
- Updated Docker configuration
- Added Kubernetes manifests

---

**Checklist Template Version:** 1.0
**Last Updated:** 2025-12-01
