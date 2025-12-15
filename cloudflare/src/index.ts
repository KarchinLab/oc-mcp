import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import { z } from "zod";

// Define our MCP agent with tools
export class MyMCP extends McpAgent {
	server = new McpServer({
		name: "Authless Calculator",
		version: "1.0.0",
	});

	async init() {

		this.server.tool(
			"annotate_allele",
			{
				chromosome: z.string(),
				position: z.number(),
				referenceBase: z.string(),
				alternateBase: z.string(),
				
			},
			async ({ chromosome, position, referenceBase, alternateBase}) => {
				const apiBase = 'https://run.opencravat.org';
				const url = `${apiBase}/api/annotate?chrom=${chromosome}&pos=${position}&ref_base=${referenceBase}&alt_base=${alternateBase}&annotators=clinvar,go,gnomad4`;
				const response = await fetch(url);
				const data = await response.json();
				
				return { content: [{ type: "text", text: JSON.stringify(data, null, 2)}]}
			}
		);

		this.server.tool(
			"annotate_rsid",
			{
				rsid: z.string(),
				
			},
			async ({ rsid}) => {
				const apiBase = 'https://run.opencravat.org';
				const url = `${apiBase}/api/annotate?dbsnp=${rsid}&annotators=clinvar,go,gnomad4`;
				const response = await fetch(url);
				const data = await response.json();
				
				return { content: [{ type: "text", text: JSON.stringify(data, null, 2)}]}
			}
		);

		this.server.tool(
			"annotate_caid",
			{
				caid: z.string(),
				
			},
			async ({ caid}) => {
				const apiBase = 'https://run.opencravat.org';
				const url = `${apiBase}/api/annotate?clingen=${caid}&annotators=clinvar,go,gnomad4`;
				const response = await fetch(url);
				const data = await response.json();
				
				return { content: [{ type: "text", text: JSON.stringify(data, null, 2)}]}
			}
		);
	}
}

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		if (url.pathname === "/sse" || url.pathname === "/sse/message") {
			return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
		}

		if (url.pathname === "/mcp") {
			return MyMCP.serve("/mcp").fetch(request, env, ctx);
		}

		return new Response("Not found", { status: 404 });
	},
};
