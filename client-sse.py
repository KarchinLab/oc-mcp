import asyncio
from contextlib import AsyncExitStack
from mcp import ClientSession
from mcp.client.sse import sse_client
from anthropic import Anthropic
import sys
from dotenv import load_dotenv
import logging

logging.basicConfig(
    filename="app.log",            # log file name
    filemode="a",                  # append mode; use "w" to overwrite each run
    level=logging.INFO,            # minimum severity to log
    format="%(asctime)s [%(levelname)s] %(message)s"
)


load_dotenv()  # load environment variables from .env

class MCPSSEClient:
    def __init__(self):
        self.session = None
        self.exit_stack = AsyncExitStack()
        self.anthropic = Anthropic()

    async def connect(self, server_url):
        # Connect directly to /sse endpoint
        sse_url = server_url.rstrip('/') + '/sse'
        
        sse_transport = await self.exit_stack.enter_async_context(
            sse_client(sse_url)
        )
        self.read, self.write = sse_transport
        
        self.session = await self.exit_stack.enter_async_context(
            ClientSession(self.read, self.write)
        )
        
        await self.session.initialize()
        
        response = await self.session.list_tools()
        print(f"Connected. Tools: {[tool.name for tool in response.tools]}")

    async def process_query(self, query):
        messages = [{"role": "user", "content": query}]

        response = await self.session.list_tools()
        tools = [{
            "name": tool.name,
            "description": tool.description,
            "input_schema": tool.inputSchema
        } for tool in response.tools]

        # Call Claude with tools
        response = self.anthropic.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1000,
            messages=messages,
            tools=tools
        )

        result = []
        
        for content in response.content:
            if content.type == 'text':
                result.append(content.text)
            elif content.type == 'tool_use':
                # Call the tool
                tool_result = await self.session.call_tool(content.name, content.input)
                
                # Send tool result back to Claude
                messages.append({
                    "role": "assistant",
                    "content": [{
                        "type": "tool_use",
                        "id": content.id,
                        "name": content.name,
                        "input": content.input
                    }]
                })
                
                messages.append({
                    "role": "user",
                    "content": [{
                        "type": "tool_result",
                        "tool_use_id": content.id,
                        "content": str(tool_result.content)
                    }]
                })
                
                # Get Claude's final response
                response = self.anthropic.messages.create(
                    model="claude-sonnet-4-20250514",
                    max_tokens=1000,
                    messages=messages,
                    tools=tools
                )
                
                for resp_content in response.content:
                    if resp_content.type == 'text':
                        result.append(resp_content.text)

        return "\n".join(result)

    async def cleanup(self):
        await self.exit_stack.aclose()

async def main():
    server_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"
    
    client = MCPSSEClient()
    await client.connect(server_url)
    
    while True:
        query = input("\n> ")
        if query == 'quit':
            break
        response = await client.process_query(query)
        print(response)
    
    await client.cleanup()

if __name__ == "__main__":
    asyncio.run(main())