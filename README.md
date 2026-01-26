# OpenCRAVAT MCP Server

This repository contains an MCP (Model Context Protocol) server that exposes OpenCRAVAT-powered variant annotation as callable tools. It runs as a Cloudflare Worker (via Wrangler) and proxies requests to public OpenCRAVAT services.

## What this server provides

It exposes MCP tools that let an MCP client:

- Discover which OpenCRAVAT annotators are being run (a curated default set).
- Inspect annotator output schemas (field names/types/descriptions).
- Annotate variants by:
  - genomic coordinates (chrom/pos/ref/alt). Accepts only GRCh38/hg38 coordinates.
  - dbSNP rsID
  - ClinGen Allele Registry ID (CAid)
  - HGVS (g./c./p.)
- Convert a protein missense notation (e.g., BRAF V600E) into candidate GRCh38 genomic HGVS changes (via SynVar), which you can then pass to HGVS annotation.

## Connecting
URL is `mcp.opencravat.org`

### Claude
Link to claude docs
Copied instructions

### ChatGPT
Link to chatgpt docs
Copied instructions

## Running Locally

Prerequisites:

- Node.js (recent enough for modern TypeScript tooling; Node 18+ recommended)
- npm

Install dependencies:

```
npm install
```

Start the dev server (Wrangler):

```
npm start
```

By default, your MCP endpoint will be: http://localhost:8787/sse

### Connect Claude Desktop

To connect to your MCP server from Claude Desktop, follow [Anthropic's Quickstart](https://modelcontextprotocol.io/quickstart/user) and within Claude Desktop go to Settings > Developer > Edit Config.

Update with this configuration:

```json
{
  "mcpServers": {
    "OpenCRAVAT": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "http://localhost:8787/sse"
      ]
    }
  }
}
```

Restart Claude and you should see the tools become available. 
