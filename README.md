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

This MCP server is hosted remotely at 

```
https://mcp.opencravat.org/sse
```

It can also be run locally.

### Claude

To connect to Claude, follow [these instructions](https://support.claude.com/en/articles/11175166-getting-started-with-custom-connectors-using-remote-mcp). Use the URL above, and do not set up auth. No user-specific data is needed for the MCP to work. Remember to enable the MCP for your chat. 

### ChatGPT

To connect with ChatGPT, you must enable developer mode, then add a custom app:

- Open Settings
- Go to Apps
- In Advanced Settings, use the toggle to turn on “Developer Mode”
- Click Create App
- Use the URL above as the “MCP Server URL”
- Set Authentication to “No Auth”
- Add a name to the MCP App that you’ll easily recognize, such as “OpenCRAVAT”

You will have to add the MCP to a new chat using the + icon in the lower left of the chat box.

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

By default, your MCP endpoint will be: 

```
http://localhost:8787/sse
```

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
