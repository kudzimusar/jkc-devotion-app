# Transformed Life: AI Integration Manual (MCP)

Welcome! This document outlines how to connect AI assistants (like Claude Desktop) to the `Transformed Life` Model Context Protocol (MCP) Server. The MCP server acts as the central hub for AI to query devotions, fetch weekly overviews, and integrate context-aware spiritual guidance directly bounded securely by the application's single source of truth.

## Connection Guide for Claude Desktop

To connect Claude Desktop to your local development server or your production build, you will update your `claude_desktop_config.json` file.

**Local Development configuration:**

1. Locate your Claude Desktop configuration file:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\\Claude\\claude_desktop_config.json`
2. Add the `transformed-life` MCP server passing the `X-API-KEY` (or the environment fallback) through the environment logic.
   
```json
{
  "mcpServers": {
    "transformed-life": {
      "command": "npx",
      "args": [
        "tsx",
        "/absolute/path/to/jkc-devotion-app/src/mcp-server/index.ts",
        "stdio"
      ],
      "env": {
        "MCP_API_KEY": "dev_bypass_key"
      }
    }
  }
}
```
*Note: Make sure to replace `/absolute/path/to/jkc-devotion-app` with your actual local path to this repository.*

3. Restart Claude Desktop. The hammer icon for tools should indicate the integration is active.

---

## 3 Example AI Prompts

Once connected, you can use these prompts to guide the AI to interact nicely with the service:

1. **"Read today's declaration and explain it to a teenager."**
   _The AI will query the `daily://devotional` resource and simplify the theological concept of the daily declaration to an engaging, age-appropriate explanation._

2. **"Search devotions for the phrase 'forgive' and summarize the top 3 results."**
   _The AI will use the `search_devotions` tool to search the knowledge base for devotionals related to forgiveness, avoiding hallucinations._

3. **"Get the weekly overview for week 2 in March."**
   _The AI will trigger the `get_weekly_overview(week_number: 2)` tool, returning the week's overall theme and the structured collection of devotions for deep research context._
