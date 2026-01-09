import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import { z } from "zod";
import { parse, stringify } from 'yaml'

// Define our MCP agent with tools
export class MyMCP extends McpAgent {
	server = new McpServer({
		name: "OpenCRAVAT",
		version: "1.0.0",
		description: "Access OpenCRAVAT for genomic variant annotation. Query clinical significance, population frequencies, functional predictions, and more from 100+ annotation sources. Supports variants by chromosome position, rsID, or ClinGen Allele ID.",
	});

	async init() {

		this.server.tool(
			"list_annotators",
			"Lists all available OpenCRAVAT annotators with their titles, descriptions, versions, and tags.",
			{},
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
			"get_fields",
			"Get the fields returned for an annotator including data type, name, human readable title, and description (if available)",
			{
				annotator: z.string(),
			},
			async ({ annotator, }) => {
				const manifestURL = 'https://store.opencravat.org/manifest.yml';
				const manifestResponse = await fetch(manifestURL);
				const yamlText = await manifestResponse.text();
				const manifest = parse(yamlText);
				const latestVersion = manifest[annotator].latest_version;
				const moduleURL = `https://store.opencravat.org/modules/${annotator}/${latestVersion}/${annotator}.yml`
				const moduleResponse = await fetch(moduleURL);
				const module = parse(await moduleResponse.text());
				const columns = {};
				for (let column of module.output_columns) {
					columns[column.name] = {
						title: column.title,
						type: column.type,
						desc: column.desc ?? null,
					}
				}
				return { content: [{ type: "text", text: JSON.stringify(columns, null, 2)}]}
			}
		);

		this.server.tool(
			"annotate_allele",
			"Annotate a genomic allele (chromosome, position, reference base, alternate base",
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
			"Annotate a dbSNP RSID",
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
			"Annotate a ClinGen Allele Registry ID",
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
