from typing import Any
import httpx
from mcp.server.fastmcp import FastMCP
import requests
import logging
import json
import cravat

logging.basicConfig(
    filename="tool.log",            # log file name
    filemode="a",                  # append mode; use "w" to overwrite each run
    level=logging.INFO,            # minimum severity to log
    format="%(asctime)s [%(levelname)s] %(message)s"
)
# Initialize FastMCP server
mcp = FastMCP("open-cravat", host='0.0.0.0')

# Constants
OC_API_BASE = "https://run.opencravat.org"

@mcp.tool()
async def get_allele(chrom: str, pos: int, ref_base: str, alt_base: str, annotators: list[str] = ['clinvar', 'go', 'gnomad4']) -> str:
    try:
        annotators_param = ','.join(annotators)
        url = f"{OC_API_BASE}/api/annotate?chrom={chrom}&pos={pos}&ref_base={ref_base}&alt_base={alt_base}&annotators={annotators_param}"
        logging.info(url)
        response = requests.get(url)
        logging.info(response)
        data = response.json()
        out = json.dumps(data)
        logging.info(out)
        return '\n'+out+'\n'
    except Exception as e:
        logging.exception(f'Error in get_variant: {e}')
        raise

@mcp.tool()
async def get_rsid(rsid: str, annotators: list[str] = ['clinvar', 'go', 'gnomad4']) -> str:
    try:
        annotators_param = ','.join(annotators)
        url = f"{OC_API_BASE}/api/annotate?dbsnp={rsid}&annotators={annotators_param}"
        logging.info(url)
        response = requests.get(url)
        logging.info(response)
        data = response.json()
        out = json.dumps(data)
        logging.info(out)
        return '\n'+out+'\n'
    except Exception as e:
        logging.exception(f'Error in get_variant: {e}')
        raise

@mcp.tool()
async def get_caid(caid: str, annotators: list[str] = ['clinvar', 'go', 'gnomad4']) -> str:
    try:
        annotators_param = ','.join(annotators)
        url = f"{OC_API_BASE}/api/annotate?clingen={caid}&annotators={annotators_param}"
        logging.info(url)
        response = requests.get(url)
        logging.info(response)
        data = response.json()
        out = json.dumps(data)
        logging.info(out)
        return '\n'+out+'\n'
    except Exception as e:
        logging.exception(f'Error in get_variant: {e}')
        raise

@mcp.tool()
async def list_annotators() -> list[str]:
    annotator_names = cravat.admin_util.list_local()
    return annotator_names

@mcp.tool()
async def describe_annotator(annotator:str) -> str:
    minfo = cravat.admin_util.get_local_module_info(annotator)
    return minfo.description

@mcp.tool()
def add(a: int, b: int) -> int:
    """Add two numbers"""
    return a + b

@mcp.resource("greeting://{name}")
def get_greeting(name: str) -> str:
    """Get a personalized greeting"""
    return f"Hello, {name}!"

if __name__ == "__main__":
    import sys
    # Initialize and run the server
    if len(sys.argv) > 1 and sys.argv[1] == 'sse':
        mcp.run(transport='sse')
    else:
        mcp.run(transport='stdio')
