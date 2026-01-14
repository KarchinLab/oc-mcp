import { parse, stringify } from 'yaml'

export const getManifest = async (): Promise<unknown> => {
	const manifestURL = 'https://store.opencravat.org/manifest.yml';
	const manifestResponse = await fetch(manifestURL);
	const manifest = parse(await manifestResponse.text());
	return manifest;
}

export const getModuleMetadata = async (
	annotator: string,
	version: string,
): Promise<unknown> => {
	const moduleURL = `https://store.opencravat.org/modules/${annotator}/${version}/${annotator}.yml`;
	const moduleResponse = await fetch(moduleURL);
	const module = parse(await moduleResponse.text());
	return module;
}