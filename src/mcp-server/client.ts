import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function main() {
    const transport = new StdioClientTransport({
        command: "./node_modules/.bin/tsx",
        args: ["src/mcp-server/index.ts", "stdio"],
        env: {
            ...process.env,
            MCP_API_KEY: "dev_bypass_key",
        }
    });

    const client = new Client(
        { name: "test-client", version: "1.0.0" },
        { capabilities: {} }
    );

    await client.connect(transport);
    console.log("Connected to MCP server");

    // Call the tool
    try {
        const response = await client.callTool({
            name: "search_devotions",
            arguments: { query: "forgive" }
        });
        console.log("Response from search_devotions:");
        console.log(JSON.stringify(response, null, 2));
    } catch (error) {
        console.error("Error calling search_devotions:", error);
    }

    // Gracefully close
    process.exit(0);
}

main().catch(console.error);
