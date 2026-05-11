import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

const LTX_BASE_URL = "https://api.ltx.video/v1";

const MODELS = ["ltx-2-3-pro", "ltx-2-3"] as const;
const RESOLUTIONS = [
  "1920x1080",
  "1280x720",
  "854x480",
  "1080x1920",
  "720x1280",
] as const;

function getApiKey(): string {
  const key = process.env.LTX_API_KEY;
  if (!key) throw new Error("LTX_API_KEY environment variable is not set");
  return key;
}

async function saveVideoResponse(
  response: Response,
  prefix: string
): Promise<{ filePath: string; requestId: string }> {
  const requestId = response.headers.get("x-request-id") ?? "unknown";
  const buffer = await response.arrayBuffer();
  const filePath = join(tmpdir(), `${prefix}-${Date.now()}.mp4`);
  await writeFile(filePath, Buffer.from(buffer));
  return { filePath, requestId };
}

export function registerLtxVideoTools(server: McpServer) {
  server.tool(
    "ltx-text-to-video",
    "Generate a video from a text prompt using the LTX Video API",
    {
      prompt: z.string().describe("Text description of the video to generate"),
      model: z.enum(MODELS).optional().default("ltx-2-3-pro"),
      duration: z
        .number()
        .int()
        .min(1)
        .max(30)
        .optional()
        .default(8)
        .describe("Duration in seconds"),
      resolution: z.enum(RESOLUTIONS).optional().default("1280x720"),
    },
    async ({ prompt, model, duration, resolution }) => {
      const apiKey = getApiKey();

      const response = await fetch(`${LTX_BASE_URL}/text-to-video`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt, model, duration, resolution }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          content: [
            {
              type: "text",
              text: `LTX API error (${response.status}): ${errorText}`,
            },
          ],
          isError: true,
        };
      }

      const { filePath, requestId } = await saveVideoResponse(
        response,
        "ltx-text"
      );

      return {
        content: [
          {
            type: "text",
            text: `Video generated successfully.\n\nFile: ${filePath}\nRequest ID: ${requestId}\nModel: ${model}\nDuration: ${duration}s\nResolution: ${resolution}`,
          },
        ],
      };
    }
  );

  server.tool(
    "ltx-image-to-video",
    "Animate a static image into a video using the LTX Video API",
    {
      image_uri: z
        .string()
        .url()
        .describe("URL of the source image to animate"),
      prompt: z
        .string()
        .describe("Text description of the motion or scene to generate"),
      model: z.enum(MODELS).optional().default("ltx-2-3-pro"),
      duration: z
        .number()
        .int()
        .min(1)
        .max(30)
        .optional()
        .default(8)
        .describe("Duration in seconds"),
      resolution: z.enum(RESOLUTIONS).optional().default("1280x720"),
    },
    async ({ image_uri, prompt, model, duration, resolution }) => {
      const apiKey = getApiKey();

      const response = await fetch(`${LTX_BASE_URL}/image-to-video`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image_uri, prompt, model, duration, resolution }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          content: [
            {
              type: "text",
              text: `LTX API error (${response.status}): ${errorText}`,
            },
          ],
          isError: true,
        };
      }

      const { filePath, requestId } = await saveVideoResponse(
        response,
        "ltx-img"
      );

      return {
        content: [
          {
            type: "text",
            text: `Video generated successfully.\n\nFile: ${filePath}\nRequest ID: ${requestId}\nSource image: ${image_uri}\nModel: ${model}\nDuration: ${duration}s\nResolution: ${resolution}`,
          },
        ],
      };
    }
  );
}
