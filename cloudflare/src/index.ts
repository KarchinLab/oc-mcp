import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import { z } from "zod";
import { parse, stringify } from 'yaml'

const annotators = [
  "abraom", "alfa", "alfa_african", "alfa_asian", "alfa_european",
  "alfa_latin_american", "alfa_other", "allofus250k", "aloft", "alphamissense",
  "arrvars", "bayesdel", "biogrid", "brca1_func_assay", "cadd",
  "cadd_exome", "cancer_genome_interpreter", "cancer_hotspots", "cardioboost", "ccr",
  "ccre_screen", "cedar", "cgc", "cgd", "cgl",
  "chasmplus", "chasmplus_mski", "civic", "civic_gene", "clingen",
  "clingen_allele_registry", "clinpred", "clinvar", "clinvar_T2T_hg38_comparator", "cscape",
  "cscape_coding", "dann", "dann_coding", "dbcid", "dbscsnv",
  "dbsnp", "dbsnp_common", "denovo", "dgi", "ditto",
  "encode_tfbs", "ensembl_regulatory_build", "esm1b", "esp6500", "ess_gene",
  "eve", "exac_gene", "fathmm", "fathmm_mkl", "fathmm_xf",
  "fitcons", "flank_seq", "funseq2", "genehancer", "genocanyon",
  "gerp", "geuvadis", "ghis", "gmvp", "gnomad4",
  "go", "grantham_scores", "grasp", "gtex", "gwas_catalog",
  "haploreg_afr", "haploreg_amr", "haploreg_asn", "haploreg_eur", "hg19",
  "hgdp", "hpo", "intact", "interpro", "linsight",
  "litvar_full", "loftool", "lrt", "mavedb", "metalr",
  "metarnn", "metasvm", "mirbase", "mistic", "mitomap",
  "mupit", "mutation_assessor", "mutationtaster", "mutpanning", "mutpred2",
  "mutpred_indel", "ncbigene", "ncer", "ncrna", "ndex",
  "ndex_chd", "ndex_signor", "omim", "oncokb", "pangalodb",
  "pangolin", "pharmgkb", "phastcons", "phdsnpg", "phi",
  "phylop", "polyphen2", "prec", "primateai", "provean",
  "pseudogene", "pubmed", "regeneron", "regulomedb", "repeat",
  "revel", "rvis", "segway", "sift", "siphy",
  "spliceai", "swissprot_binding", "swissprot_domains", "swissprot_ptm", "target",
  "thousandgenomes", "thousandgenomes_ad_mixed_american", "thousandgenomes_african", "thousandgenomes_east_asian", "thousandgenomes_european",
  "thousandgenomes_south_asian", "trinity", "ucscgenomebrowser", "uk10k_cohort", "uniprot",
  "uniprot_domain", "varity_r", "vest", "vista_enhancer"
];


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
			"List metadata about the OpenCRAVAT annotators that will be run.",
			{},
			async ({ }) => {
				const manifestURL = 'https://store.opencravat.org/manifest.yml';
				const response = await fetch(manifestURL);
				const yamlText = await response.text();
				const manifest = parse(yamlText);
				const out = {};
				for (let moduleName in manifest) {
					let ocModule = manifest[moduleName];
					if (ocModule.type === 'annotator' && annotators.includes(moduleName)) {
						out[moduleName] = {
							title: ocModule.title,
							description: ocModule.description,
							version: ocModule.latest_version,
							tags: ocModule.tags,
							dataSourceVersion: ocModule.datasource,
						}
					}
				}
				return { content: [{ type: "text", text: JSON.stringify(out, null, 2)}]}
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
			},
			async ({ chromosome, position, referenceBase, alternateBase, }) => {
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
			"Annotate a dbSNP rsID",
			{
				rsid: z.string(),
			},
			async ({ rsid, }) => {
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
			},
			async ({ caid, }) => {
				const apiBase = 'https://run.opencravat.org';
				const annotatorsArg = annotators.join(',');
				const url = `${apiBase}/api/annotate?clingen=${caid}&annotators=${annotatorsArg}`;
				const response = await fetch(url);
				const data = await response.json();
				
				return { content: [{ type: "text", text: JSON.stringify(data, null, 2)}]}
			}
		);

		this.server.tool(
			"protein_variant_to_genomic_hgvs",
			"Provide a protein-level missense notation varian (eg BRAF V600E) and get genomic hgvs changes that could cause it. Uses SynVar.",
			{
				gene: z.string(),
				proteinChange: z.string(),
			},
			async ({ gene, proteinChange, }) => {
				const refAA = proteinChange[0];
				const altAA = proteinChange[proteinChange.length-1];
				const position = parseInt(proteinChange.slice(1,-1));
				const synVarURL = new URL('https://synvar.sibils.org/generate/literature/fromMutation')
				synVarURL.searchParams.set('ref', gene);
				synVarURL.searchParams.set('variant', proteinChange);
				synVarURL.searchParams.set('level', 'protein');
				synVarURL.searchParams.set('format','json');
				const response = await fetch(synVarURL.toString());
				const data = await response.json();
				const genomicHGVS = [];
				for (let candidate of data['variant-list'].variant[0]['genome-level']['hgvs-list'].hgvs) {
					if (candidate['@assembly'] === 'GRCh38') {
						genomicHGVS.push(candidate.value);
					}
				}
				const out = {
					submitted: {
						gene: gene,
						position: position,
						refAA: refAA,
						altAA: altAA,
					},
					genomicHGVS: genomicHGVS,
					synVarURL: synVarURL,
					synVarResponse: data,
				}
				return { content: [{ type: "text", text: JSON.stringify(out, null, 2)}]}
			}
				
		)
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
