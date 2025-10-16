import asyncio
from typing import Optional
from contextlib import AsyncExitStack

from mcp import ClientSession
from mcp.client.sse import sse_client

from anthropic import Anthropic
from dotenv import load_dotenv

import logging
import sys

load_dotenv()  # load environment variables from .env

logging.basicConfig(
    filename="app.log",
    filemode="a",
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

class MCPSSEClient:
    def __init__(self):
        self.session: Optional[ClientSession] = None
        self.exit_stack = AsyncExitStack()
        self.anthropic = Anthropic()

    async def connect(self, server_url: str = "http://localhost:8000"):
        """Connect to an MCP server via SSE/HTTP
        
        Args:
            server_url: Base URL of the SSE server (e.g., 'http://localhost:8000')
        """
        # Ensure we have the base URL without /sse suffix
        base_url = server_url.rstrip('/').removesuffix('/sse')
        
        print(f"Connecting to SSE server at: {base_url}")
        
        try:
            # The sse_client will handle the /sse endpoint and session negotiation
            sse_transport = await self.exit_stack.enter_async_context(
                sse_client(base_url+'/sse')
            )
            self.read, self.write = sse_transport
            
            # Create client session
            self.session = await self.exit_stack.enter_async_context(
                ClientSession(self.read, self.write)
            )
            
            # Initialize the connection
            await self.session.initialize()
            
            # List available tools
            response = await self.session.list_tools()
            tools = response.tools
            
            print(f"✓ Connected successfully!")
            print(f"Available tools: {[tool.name for tool in tools]}")
            
            # Print tool descriptions
            for tool in tools:
                print(f"  - {tool.name}: {tool.description}")
                
        except Exception as e:
            print(f"Failed to connect: {e}")
            raise

    async def process_query(self, query: str) -> str:
        """Process a query using Claude and available MCP tools"""
        
        if not self.session:
            return "Error: Not connected to MCP server"
        
        messages = [
            {
                "role": "user",
                "content": query
            }
        ]

        # Get available tools from MCP server
        response = await self.session.list_tools()
        available_tools = [{
            "name": tool.name,
            "description": tool.description,
            "input_schema": tool.inputSchema
        } for tool in response.tools]

        # Initial Claude API call with tools
        response = self.anthropic.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1000,
            messages=messages,
            tools=available_tools
        )

        # Process response and handle tool calls
        final_text = []

        for content in response.content:
            if content.type == 'text':
                final_text.append(content.text)
                
            elif content.type == 'tool_use':
                tool_name = content.name
                tool_args = content.input
                
                # Log the tool call
                print(f"  → Calling tool: {tool_name}")
                logging.info(f"Tool call: {tool_name} with args: {tool_args}")
                
                try:
                    # Execute tool call via MCP
                    result = await self.session.call_tool(tool_name, tool_args)
                    logging.info(f"Tool result: {result.content}")
                    
                    # Show tool usage in output
                    final_text.append(f"\n[Used {tool_name} to fetch data]")
                    
                    # Prepare messages for Claude with tool result
                    messages.append({
                        "role": "assistant",
                        "content": [
                            {
                                "type": "text",
                                "text": content.text if hasattr(content, 'text') and content.text else ""
                            },
                            {
                                "type": "tool_use",
                                "id": content.id,
                                "name": tool_name,
                                "input": tool_args
                            }
                        ]
                    })
                    
                    messages.append({
                        "role": "user",
                        "content": [
                            {
                                "type": "tool_result",
                                "tool_use_id": content.id,
                                "content": str(result.content)
                            }
                        ]
                    })
                    
                    # Get Claude's response after tool use
                    response = self.anthropic.messages.create(
                        model="claude-sonnet-4-20250514",
                        max_tokens=1000,
                        messages=messages,
                        tools=available_tools
                    )
                    
                    # Add Claude's interpretation of the tool results
                    for resp_content in response.content:
                        if resp_content.type == 'text':
                            final_text.append(resp_content.text)
                            
                except Exception as e:
                    error_msg = f"Error calling tool {tool_name}: {e}"
                    print(f"  ✗ {error_msg}")
                    logging.error(error_msg)
                    final_text.append(f"\n[{error_msg}]")

        return "\n".join(final_text)

    async def chat_loop(self):
        """Run an interactive chat loop"""
        print("\n" + "="*50)
        print("MCP SSE Client - Chat Interface")
        print("="*50)
        print("Type your queries or 'quit' to exit")
        print("Type 'tools' to list available tools")
        print("-"*50)
        
        while True:
            try:
                query = input("\n> ").strip()
                
                if query.lower() == 'quit':
                    print("Goodbye!")
                    break
                
                if query.lower() == 'tools':
                    if self.session:
                        response = await self.session.list_tools()
                        print("\nAvailable tools:")
                        for tool in response.tools:
                            print(f"  • {tool.name}")
                            print(f"    {tool.description}")
                            if tool.inputSchema:
                                print(f"    Parameters: {tool.inputSchema}")
                    else:
                        print("Not connected to server")
                    continue
                    
                if not query:
                    continue
                    
                print("\nProcessing...")
                response = await self.process_query(query)
                print("\n" + response)
                    
            except KeyboardInterrupt:
                print("\nUse 'quit' to exit")
            except Exception as e:
                print(f"\nError: {str(e)}")
                logging.exception(f"Error in chat loop: {e}")
    
    async def cleanup(self):
        """Clean up resources"""
        await self.exit_stack.aclose()

async def main():
    # Parse command line arguments
    server_url = "http://localhost:8000"
    
    if len(sys.argv) > 1:
        server_url = sys.argv[1]
        # Ensure it's a valid URL
        if not (server_url.startswith('http://') or server_url.startswith('https://')):
            print("Error: Server URL must start with http:// or https://")
            print(f"Usage: {sys.argv[0]} [server_url]")
            print(f"Example: {sys.argv[0]} http://localhost:8000")
            sys.exit(1)
    
    print(f"MCP SSE Client")
    print(f"Server: {server_url}")
    
    client = MCPSSEClient()
    
    try:
        # Connect to server
        await client.connect(server_url)
        
        # Run interactive chat
        await client.chat_loop()
        
    except Exception as e:
        print(f"Fatal error: {e}")
        logging.exception(f"Fatal error: {e}")
    finally:
        await client.cleanup()

if __name__ == "__main__":
    asyncio.run(main())