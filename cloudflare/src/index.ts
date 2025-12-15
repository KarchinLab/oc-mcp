import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import { z } from "zod";
import { parse, stringify } from 'yaml'

// Define our MCP agent with tools
export class MyMCP extends McpAgent {
	server = new McpServer({
		name: "OpenCRAVAT",
		version: "1.0.0",
	});

	async init() {

		this.server.tool(
			"list_annotators",
			{
				
			},
			async ({ }) => {
				const manifestURL = 'https://store.opencravat.org/manifest.yml';
				const response = await fetch(manifestURL);
				const yamlText = await response.text();
				const manifest = parse(yamlText);
				const annotators = {};
				for (let moduleName in manifest) {
					let ocModule = manifest[moduleName];
					if (ocModule.type === 'annotator') {
						annotators[moduleName] = {
							title: ocModule.title,
							description: ocModule.description,
							version: ocModule.latest_version,
							tags: ocModule.tags,
							dataSourceVersion: ocModule.datasource,
						}
					}
				}
				return { content: [{ type: "text", text: JSON.stringify(annotators, null, 2)}]}
			}
		);

		this.server.tool(
			"annotate_allele",
			{
				chromosome: z.string(),
				position: z.number(),
				referenceBase: z.string(),
				alternateBase: z.string(),
				annotators: z.array(z.string()),
			},
			async ({ chromosome, position, referenceBase, alternateBase, annotators, }) => {
				const apiBase = 'https://run.opencravat.org';
				const annotatorsArg = annotators.join(',');
				const url = `${apiBase}/api/annotate?chrom=${chromosome}&pos=${position}&ref_base=${referenceBase}&alt_base=${alternateBase}&annotators=${annotatorsArg}`;
				const response = await fetch(url);
				const data = await response.json();
				
				return { content: [{ type: "text", text: JSON.stringify(data, null, 2)}]}
			}
		);

		this.server.tool(
			"annotate_rsid",
			{
				rsid: z.string(),
				annotators: z.array(z.string()),
			},
			async ({ rsid, annotators, }) => {
				const apiBase = 'https://run.opencravat.org';
				const annotatorsArg = annotators.join(',');
				const url = `${apiBase}/api/annotate?dbsnp=${rsid}&annotators=${annotatorsArg}`;
				const response = await fetch(url);
				const data = await response.json();
				
				return { content: [{ type: "text", text: JSON.stringify(data, null, 2)}]}
			}
		);

		this.server.tool(
			"annotate_caid",
			{
				caid: z.string(),
				annotators: z.array(z.string()),
			},
			async ({ caid, annotators, }) => {
				const apiBase = 'https://run.opencravat.org';
				const annotatorsArg = annotators.join(',');
				const url = `${apiBase}/api/annotate?clingen=${caid}&annotators=${annotatorsArg}`;
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
