export const defaultAnnotators = [
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
]

export type Variant = {
	chromosome: string,
	position: number,
	referenceAllele: string,
	alternateAllele: string,
}

export type AnnotateInput = 
  | { variant: Variant }
  | { hgvs: string }
  | { rsid: string }
  | { caid: string };

const baseURL = new URL('https://run.opencravat.org');
const annotateURL = new URL(baseURL.origin + '/api/annotate');
export const annotate = async (input: AnnotateInput): Promise<unknown> => {
	const url = new URL(annotateURL);
	if ('variant' in input) {
		url.searchParams.set('chrom', input.variant.chromosome);
		url.searchParams.set('pos', input.variant.position.toString());
		url.searchParams.set('ref_base', input.variant.referenceAllele);
		url.searchParams.set('alt_base', input.variant.alternateAllele);
	} else if ('rsid' in input) {
		url.searchParams.set('dbsnp', input.rsid);
	} else if ('caid' in input) {
		url.searchParams.set('clingen', input.caid);
	} else if ('hgvs' in input) {
		url.searchParams.set('hgvs', input.hgvs);
	}
	url.searchParams.set('assembly', 'hg38');
	const finalURL = `${url.toString()}&annotators=${defaultAnnotators.join(',')}`
	console.log(finalURL);
	const response = await fetch(finalURL);
	const data = await response.json();
	return data;
}