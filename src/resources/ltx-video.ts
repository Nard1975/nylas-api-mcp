import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerLtxVideoResources(server: McpServer) {
  server.resource(
    "ltx-video-overview",
    "ltx://overview",
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/markdown",
          text: `# LTX Video API Overview

The LTX Video API allows you to generate high-quality AI videos from text prompts or static images.

## Authentication

All requests require a Bearer token:

\`\`\`
Authorization: Bearer YOUR_API_KEY
\`\`\`

Set the \`LTX_API_KEY\` environment variable to use the MCP tools.

## Base URL

\`https://api.ltx.video/v1\`

## Available Tools

- **ltx-text-to-video** — Generate a video from a text prompt
- **ltx-image-to-video** — Animate a static image into a video

## Models

| Model | Description |
|-------|-------------|
| \`ltx-2-3-pro\` | Highest quality, recommended for production |
| \`ltx-2-3\` | Faster generation |

## Supported Resolutions

- \`1920x1080\` (1080p landscape)
- \`1280x720\` (720p landscape)
- \`854x480\` (480p landscape)
- \`1080x1920\` (1080p portrait)
- \`720x1280\` (720p portrait)

## Response

Generated videos are returned as MP4 files and saved to the system temp directory. The response includes:
- **File path** — local path to the saved MP4
- **Request ID** — \`x-request-id\` header for tracking and support

## Quick Start

\`\`\`bash
# Text-to-video
curl -X POST https://api.ltx.video/v1/text-to-video \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "A majestic eagle soaring through clouds at sunset",
    "model": "ltx-2-3-pro",
    "duration": 8,
    "resolution": "1920x1080"
  }' \\
  -o video.mp4

# Image-to-video
curl -X POST https://api.ltx.video/v1/image-to-video \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "image_uri": "https://example.com/photo.jpg",
    "prompt": "Clouds drifting as the sun sets slowly",
    "model": "ltx-2-3-pro",
    "duration": 8,
    "resolution": "1920x1080"
  }' \\
  -o video.mp4
\`\`\``,
        },
      ],
    })
  );
}
