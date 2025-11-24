# 🔒 Local LLM Security Lab Setup Guide

> Transform Neocortex into a completely local, air-gapped security analysis platform powered by open-source LLMs.

## Philosophy: Zero Cloud, Full Control

Neocortex can run entirely on your infrastructure with:
- **Local LLM inference** (Ollama, vLLM, or LM Studio)
- **Private data sources** (PostgreSQL logs, PCAP files, firewall logs)
- **Custom MCP servers** for security tools
- **Role-based agents** (SOC Analyst, Network Admin, Red Team)

No data leaves your network. Ever.

---

## 🎯 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Neocortex Frontend                   │
│          (Next.js UI - Role-based Dashboards)           │
└─────────────────────┬───────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
   ┌────▼────┐   ┌────▼────┐   ┌───▼────┐
   │ SOC     │   │ NetAdmin│   │ RedTeam│
   │ Agent   │   │ Agent   │   │ Agent  │
   └────┬────┘   └────┬────┘   └───┬────┘
        │             │             │
        └─────────────┼─────────────┘
                      │
            ┌─────────▼──────────┐
            │   Local LLM Engine │
            │  (Ollama/vLLM/etc) │
            │  localhost:11434   │
            └─────────┬──────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
   ┌────▼────┐   ┌────▼────┐   ┌───▼────┐
   │ Postgres│   │  PCAP   │   │  Log   │
   │   MCP   │   │  MCP    │   │  MCP   │
   └─────────┘   └─────────┘   └────────┘
        │             │             │
   ┌────▼────┐   ┌────▼────┐   ┌───▼────┐
   │Firewall │   │ Packet  │   │ SIEM   │
   │  Logs   │   │ Capture │   │  Data  │
   └─────────┘   └─────────┘   └────────┘
```

---

## Step 1: Install Local LLM Runtime

### Option A: Ollama (Recommended for Getting Started)

**Why Ollama:**
- Simple installation across Mac/Linux/Windows
- Easy model management (`ollama pull`)
- OpenAI-compatible API at `http://localhost:11434`
- Automatic GPU acceleration

**Installation:**

```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.com/install.sh | sh

# Windows
# Download from https://ollama.com/download
```

**Start Ollama:**

```bash
ollama serve
```

**Pull Security-Focused Models:**

```bash
# Reasoning model for complex analysis
ollama pull deepseek-r1:7b

# Fast general-purpose model
ollama pull llama3.2:3b

# Code/config analysis
ollama pull qwen2.5-coder:7b

# Larger model for deep investigations
ollama pull llama3.1:8b
```

**Verify Installation:**

```bash
curl http://localhost:11434/api/tags
```

---

### Option B: vLLM (For Production Deployment)

**Why vLLM:**
- High-throughput inference server
- Better GPU utilization for multi-user scenarios
- More control over batching and caching

**Installation:**

```bash
pip install vllm

# Start server with a model
vllm serve deepseek-ai/DeepSeek-R1-Distill-Qwen-7B \
  --host 0.0.0.0 \
  --port 8000 \
  --trust-remote-code
```

**API available at:** `http://localhost:8000`

---

### Option C: LM Studio (GUI Option)

- Download from: https://lmstudio.ai/
- Load models through UI
- Start local server from app
- Good for non-technical users

---

## Step 2: Configure Neocortex for Local-Only LLMs

### Edit `.env` File

```bash
# === LOCAL LLM CONFIGURATION ===

# Ollama Configuration (if using Ollama)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_API_KEY=ollama  # Required but can be any value

# OpenAI-Compatible Local LLM (for vLLM/LM Studio)
OPENAI_COMPATIBLE_DATA='[
  {
    "provider": "LocalVLLM",
    "baseUrl": "http://localhost:8000/v1",
    "models": [
      {"id": "deepseek-r1-7b", "name": "DeepSeek R1 7B (Reasoning)"},
      {"id": "llama3.1-8b", "name": "Llama 3.1 8B (General)"},
      {"id": "qwen2.5-coder-7b", "name": "Qwen 2.5 Coder 7B (Code)"}
    ]
  }
]'

# === DISABLE ALL CLOUD PROVIDERS ===
# Leave these UNSET to prevent accidental cloud API usage
# OPENAI_API_KEY=
# ANTHROPIC_API_KEY=
# GOOGLE_GENERATIVE_AI_API_KEY=
# XAI_API_KEY=
# GROQ_API_KEY=

# === SECURITY LAB CONFIGURATION ===

# Disable external MCP servers
NOT_ALLOW_ADD_MCP_SERVERS=1

# Disable user signups (controlled lab environment)
DISABLE_SIGN_UP=1

# File-based MCP config for version control
FILE_BASED_MCP_CONFIG=true

# Database (keep local)
POSTGRES_URL=postgres://postgres:postgres@localhost:5432/neocortex_security_lab

# Auth (local only)
BETTER_AUTH_SECRET=your-secure-random-secret-here
BETTER_AUTH_URL=http://localhost:3000
```

---

## Step 3: Create Security-Focused MCP Servers

### A. PostgreSQL Log Analysis MCP

**Purpose:** Query firewall logs, authentication logs, network flow data stored in PostgreSQL.

**`.mcp-config.json` entry:**

```json
{
  "postgres-security-logs": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://postgres:password@localhost:5432/security_logs"]
  }
}
```

**Database Schema Example:**

```sql
CREATE TABLE firewall_logs (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL,
  source_ip INET NOT NULL,
  dest_ip INET NOT NULL,
  source_port INT,
  dest_port INT,
  protocol VARCHAR(10),
  action VARCHAR(20),
  bytes_sent BIGINT,
  bytes_received BIGINT
);

CREATE TABLE auth_events (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL,
  user_name VARCHAR(255),
  source_ip INET,
  event_type VARCHAR(50),
  success BOOLEAN,
  details JSONB
);

CREATE INDEX idx_firewall_timestamp ON firewall_logs(timestamp);
CREATE INDEX idx_firewall_source_ip ON firewall_logs(source_ip);
CREATE INDEX idx_auth_timestamp ON auth_events(timestamp);
```

---

### B. PCAP Analysis MCP

**Purpose:** Analyze packet captures using `tshark` or `zeek` for deep packet inspection.

**Create custom MCP server:** `pcap-analyzer-mcp/`

```typescript
// pcap-analyzer-mcp/src/index.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const server = new Server(
  {
    name: "pcap-analyzer",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool: Analyze PCAP file
server.setRequestHandler("tools/list", async () => ({
  tools: [
    {
      name: "analyze_pcap",
      description: "Analyze PCAP file for suspicious patterns, protocols, top talkers",
      inputSchema: {
        type: "object",
        properties: {
          file_path: {
            type: "string",
            description: "Path to PCAP file"
          },
          filter: {
            type: "string",
            description: "Optional tshark display filter (e.g., 'tcp.port == 443')"
          }
        },
        required: ["file_path"]
      }
    },
    {
      name: "extract_suspicious_ips",
      description: "Extract IPs with unusual traffic patterns",
      inputSchema: {
        type: "object",
        properties: {
          file_path: { type: "string" }
        },
        required: ["file_path"]
      }
    }
  ]
}));

server.setRequestHandler("tools/call", async (request) => {
  if (request.params.name === "analyze_pcap") {
    const { file_path, filter } = request.params.arguments as any;
    
    // Run tshark analysis
    const filterArg = filter ? `-Y "${filter}"` : "";
    const { stdout } = await execAsync(
      `tshark -r ${file_path} ${filterArg} -q -z conv,ip -z io,phs`
    );
    
    return {
      content: [
        {
          type: "text",
          text: `PCAP Analysis Results:\n\n${stdout}`
        }
      ]
    };
  }
  
  if (request.params.name === "extract_suspicious_ips") {
    const { file_path } = request.params.arguments as any;
    
    // Find IPs with high connection counts
    const { stdout } = await execAsync(
      `tshark -r ${file_path} -T fields -e ip.src | sort | uniq -c | sort -rn | head -20`
    );
    
    return {
      content: [
        {
          type: "text",
          text: `Top 20 Source IPs by Packet Count:\n\n${stdout}`
        }
      ]
    };
  }
});

const transport = new StdioServerTransport();
server.connect(transport);
```

**`.mcp-config.json` entry:**

```json
{
  "pcap-analyzer": {
    "command": "node",
    "args": ["/path/to/pcap-analyzer-mcp/dist/index.js"]
  }
}
```

---

### C. Suricata/Snort Rule Analysis MCP

**Purpose:** Parse, test, and optimize IDS/IPS rules.

**`.mcp-config.json` entry:**

```json
{
  "suricata-rules": {
    "command": "npx",
    "args": ["-y", "@your-org/suricata-mcp-server"]
  }
}
```

---

## Step 4: Create Role-Based Security Agents

### Agent 1: SOC Analyst 👮

**Role:** Monitor security events, investigate incidents, correlate logs.

**System Prompt:**

```
You are a Security Operations Center (SOC) Analyst specializing in threat detection and incident response.

Your core responsibilities:
- Monitor firewall logs, IDS alerts, and authentication events
- Investigate suspicious network activity and anomalies
- Correlate events across multiple data sources
- Provide clear, actionable incident reports
- Suggest remediation steps for security findings

Available data sources:
- PostgreSQL firewall logs (last 30 days)
- PCAP files for deep packet inspection
- Authentication event logs

Analysis approach:
1. Start with high-level metrics (top talkers, protocol distribution)
2. Drill down into anomalies
3. Correlate across time windows
4. Assess threat severity (Critical/High/Medium/Low)
5. Recommend specific actions

Always cite evidence from logs with timestamps and IP addresses.
```

**Tools Assigned:**
- `postgres-security-logs` (query firewall/auth logs)
- `pcap-analyzer` (deep packet inspection)
- `web-search` (threat intel lookup)

**Default Model:** `deepseek-r1:7b` (reasoning-focused)

---

### Agent 2: Network Administrator 🔧

**Role:** Design network segmentation, manage configurations, least-privilege enforcement.

**System Prompt:**

```
You are a Network Security Administrator responsible for network architecture, segmentation design, and access control.

Your core responsibilities:
- Design and maintain network segmentation strategies
- Configure firewall rules following least-privilege principles
- Plan VLAN topology and access control lists
- Review and optimize network configurations
- Document network changes and security policies

Analysis approach:
1. Assess current network topology
2. Identify over-permissive rules or flat network segments
3. Design defense-in-depth layers
4. Recommend specific ACL/firewall rule changes
5. Consider operational impact of changes

Prefer zero-trust principles: deny by default, explicit allow rules, microsegmentation.
```

**Tools Assigned:**
- `postgres-security-logs` (review ACL effectiveness)
- `filesystem` (read config files)
- `create-table` (visualize topology)

**Default Model:** `llama3.1:8b` (general-purpose)

---

### Agent 3: Red Team Tester 🎯

**Role:** Simulate attacks, test defenses, identify vulnerabilities.

**System Prompt:**

```
You are a Red Team Operator simulating adversary tactics to test security controls.

Your core responsibilities:
- Identify potential attack vectors in network topology
- Simulate attacker reconnaissance and lateral movement
- Test firewall rules and detection capabilities
- Suggest offensive security scenarios for testing
- Provide blue team feedback on detection gaps

Analysis approach:
1. Map attack surface from external/internal perspectives
2. Identify critical assets and paths to reach them
3. Simulate MITRE ATT&CK techniques
4. Test detection coverage for simulated attacks
5. Recommend detection improvements

Always clarify: "This is a sanctioned security test in a controlled environment."
```

**Tools Assigned:**
- `postgres-security-logs` (test detection visibility)
- `pcap-analyzer` (analyze test traffic)
- `python-executor` (run simple attack simulations)

**Default Model:** `qwen2.5-coder:7b` (code-focused for scripting)

---

## Step 5: Usage Examples

### Example 1: Investigate Suspicious Outbound Traffic

**User asks SOC Analyst:**
> "Show me all outbound connections to non-standard ports in the last 24 hours"

**Agent workflow:**
1. Queries `postgres-security-logs` MCP:
   ```sql
   SELECT source_ip, dest_ip, dest_port, COUNT(*) as conn_count
   FROM firewall_logs
   WHERE timestamp > NOW() - INTERVAL '24 hours'
     AND dest_port NOT IN (80, 443, 22, 25, 53)
     AND action = 'ALLOW'
   GROUP BY source_ip, dest_ip, dest_port
   ORDER BY conn_count DESC
   LIMIT 20;
   ```

2. Analyzes results with local LLM
3. Returns:
   ```
   🚨 SECURITY ALERT: Suspicious Outbound Traffic Detected

   High-Priority Findings:
   1. 192.168.1.45 → 185.220.101.33:9050 (Tor Relay)
      - 327 connections in last 24h
      - Possible data exfiltration or C2 traffic
      
   2. 192.168.1.67 → 45.61.137.12:8888 (Unknown)
      - 156 connections, large data transfer (2.3GB outbound)
      - Recommend PCAP analysis
   
   Recommended Actions:
   - Isolate 192.168.1.45 immediately
   - Pull PCAP for detailed inspection
   - Check endpoint for malware
   - Review auth logs for compromised credentials
   ```

---

### Example 2: Design Network Segmentation

**User asks Network Admin:**
> "We have flat /16 network. Design microsegmentation for DMZ, internal apps, and user workstations."

**Agent workflow:**
1. Uses reasoning model to design tiered architecture
2. Creates table visualization with zones
3. Returns detailed segmentation plan:

```
🔒 NETWORK SEGMENTATION DESIGN

Current State: Flat 10.0.0.0/16 (HIGH RISK)
Proposed: Zone-Based Architecture with ACLs

┌─────────────────────────────────────────────┐
│ Zone 1: Internet DMZ (10.10.0.0/24)        │
│ - Web servers, load balancers              │
│ - Inbound: 80/443 from Internet            │
│ - Outbound: DENY ALL except DNS/NTP        │
└─────────────────────────────────────────────┘
         │ (ACL: Allow 443 only)
┌─────────────────────────────────────────────┐
│ Zone 2: Application Tier (10.20.0.0/22)    │
│ - App servers, APIs                         │
│ - Inbound: Only from DMZ on 443             │
│ - Outbound: Database zone 5432, Internet HTTPS │
└─────────────────────────────────────────────┘
         │ (ACL: DB connections only)
┌─────────────────────────────────────────────┐
│ Zone 3: Database Tier (10.30.0.0/24)       │
│ - PostgreSQL, Redis                         │
│ - Inbound: Only from App Tier on 5432/6379 │
│ - Outbound: DENY ALL                        │
└─────────────────────────────────────────────┘

Zone 4: User Workstations (10.40.0.0/20)
Zone 5: Management (10.50.0.0/28 - Jump Hosts)

Firewall Rules Matrix: [table follows...]
```

---

## Step 6: Disable Cloud Providers Completely

### Option A: Environment Variables (Recommended)

Simply don't set cloud API keys in `.env`:

```bash
# These should be COMMENTED or REMOVED entirely
# OPENAI_API_KEY=
# ANTHROPIC_API_KEY=
# GOOGLE_GENERATIVE_AI_API_KEY=
```

### Option B: Admin UI Toggle (Future Enhancement)

Add to Neocortex admin panel:

```tsx
// src/components/admin/cloud-provider-settings.tsx
export function CloudProviderSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cloud LLM Providers</CardTitle>
        <CardDescription>
          Control which external AI providers are available
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>OpenAI (GPT-4, etc.)</Label>
          <Switch disabled={!process.env.OPENAI_API_KEY} />
        </div>
        <div className="flex items-center justify-between">
          <Label>Anthropic (Claude)</Label>
          <Switch disabled={!process.env.ANTHROPIC_API_KEY} />
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Local-Only Mode Enabled</AlertTitle>
          <AlertDescription>
            No cloud API keys detected. All inference runs locally via Ollama.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
```

---

## Step 7: Performance Optimization

### GPU Acceleration

**For Ollama:**
```bash
# Verify GPU is used
ollama run llama3.1:8b --verbose

# Should show: Using GPU: NVIDIA RTX 4090 (24GB)
```

**For vLLM:**
```bash
# Enable tensor parallelism for multi-GPU
vllm serve deepseek-r1-7b \
  --tensor-parallel-size 2 \
  --gpu-memory-utilization 0.9
```

### Model Quantization

Use smaller quantized models for faster inference:

```bash
# 4-bit quantized models (faster, less VRAM)
ollama pull deepseek-r1:7b-q4_0
ollama pull llama3.1:8b-q4_K_M

# 8-bit (balance quality/speed)
ollama pull llama3.1:8b-q8_0
```

### Batch Processing

For analyzing large log datasets, process in batches:

```python
# MCP server optimization
async def analyze_logs_batch(log_entries: list[LogEntry], batch_size=100):
    results = []
    for i in range(0, len(log_entries), batch_size):
        batch = log_entries[i:i+batch_size]
        analysis = await llm_analyze(batch)
        results.append(analysis)
    return aggregate_results(results)
```

---

## Troubleshooting

### Issue: "Model not found"
```bash
# List installed models
ollama list

# Pull missing model
ollama pull llama3.1:8b
```

### Issue: "Out of memory"
```bash
# Use smaller model or quantized version
ollama pull llama3.2:3b  # Only 2GB VRAM needed

# Or limit context window in Neocortex UI
# Settings → Model → Max Tokens: 2048
```

### Issue: "Slow inference on CPU"
- Use quantized models (q4_0, q4_K_M)
- Reduce max tokens
- Consider smaller models (3B instead of 8B)
- Upgrade to GPU for production use

### Issue: "MCP server connection failed"
```bash
# Test MCP server manually
npx @modelcontextprotocol/server-postgres \
  postgresql://localhost:5432/security_logs

# Check .mcp-config.json syntax
jq . .mcp-config.json
```

---

## Security Considerations

### 1. Network Isolation
- Run Neocortex on isolated management network
- No direct internet access for LLM inference
- Air-gapped deployment for classified environments

### 2. Data Sanitization
- Scrub PII from logs before LLM analysis
- Use data masking for sensitive fields
- Log all queries for audit trail

### 3. Access Control
- Use `DISABLE_SIGN_UP=1` for controlled user list
- Implement role-based access (admin vs. analyst)
- Require strong authentication (OAuth + MFA)

### 4. Model Security
- Only use vetted open-source models
- Scan model files for tampering
- Version control model deployments

---

## Next Steps

1. **Deploy Ollama** and pull your first model
2. **Configure `.env`** with local-only settings
3. **Create SOC Analyst agent** with log query tools
4. **Test workflow**: Ask agent to analyze firewall logs
5. **Build custom MCP** for your specific log formats
6. **Scale horizontally**: Add more agents for different roles

---

## Resources

- **Ollama Models:** https://ollama.com/library
- **MCP Servers:** https://github.com/modelcontextprotocol/servers
- **vLLM Docs:** https://docs.vllm.ai/
- **Neocortex Discord:** https://discord.gg/gCRu69Upnp

---

**Questions?** Open an issue or ask in Discord `#security-lab` channel.
