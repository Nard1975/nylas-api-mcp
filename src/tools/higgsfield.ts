import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { execFile } from "child_process";
import { promisify } from "util";
import { fileURLToPath } from "url";
import path from "path";

const execFileAsync = promisify(execFile);

// Resolve the higgsfield binary relative to this file (dist/tools/ → project root)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HF_BIN = path.resolve(__dirname, "../../node_modules/.bin/higgsfield");

function buildEnv(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env };
  // Allow callers to override the credentials file path via env
  if (process.env.HIGGSFIELD_CREDENTIALS_PATH) {
    env.HIGGSFIELD_CREDENTIALS_PATH = process.env.HIGGSFIELD_CREDENTIALS_PATH;
  }
  return env;
}

async function runHF(args: string[]): Promise<string> {
  const { stdout, stderr } = await execFileAsync(HF_BIN, [...args, "--json", "--no-color"], {
    env: buildEnv(),
    timeout: 300_000, // 5 min max for --wait jobs
  });
  return stdout || stderr;
}

function ok(text: string) {
  return { content: [{ type: "text" as const, text }] };
}

export function registerHiggsFieldTools(server: McpServer) {
  // List available generation models
  server.tool(
    "higgsfield-model-list",
    {
      type: z.enum(["image", "video"]).optional().describe("Filter by output type")
    },
    async ({ type }) => {
      const args = ["model", "list"];
      if (type === "image") args.push("--image");
      if (type === "video") args.push("--video");
      const output = await runHF(args);
      return ok(output);
    }
  );

  // Get detailed parameters for a specific model
  server.tool(
    "higgsfield-model-get",
    {
      modelId: z.string().describe("Model ID / job_set_type, e.g. nano_banana_2")
    },
    async ({ modelId }) => {
      const output = await runHF(["model", "get", modelId]);
      return ok(output);
    }
  );

  // Create an image or video generation job
  server.tool(
    "higgsfield-generate",
    {
      model: z.string().describe("Model ID / job_set_type to use"),
      prompt: z.string().describe("Text description of what to generate"),
      count: z.number().int().min(1).max(10).optional().describe("Number of outputs (1–10)"),
      duration: z.number().int().optional().describe("Duration in seconds (video models)"),
      aspectRatio: z.string().optional().describe("Aspect ratio, e.g. 16:9 or 1:1"),
      imageUrl: z.string().optional().describe("Reference image: local path or upload UUID"),
      startImageUrl: z.string().optional().describe("Start frame: local path or upload UUID"),
      endImageUrl: z.string().optional().describe("End frame: local path or upload UUID"),
      wait: z.boolean().optional().describe("Block until the job finishes and return result URLs")
    },
    async ({ model, prompt, count, duration, aspectRatio, imageUrl, startImageUrl, endImageUrl, wait }) => {
      const args = ["generate", "create", model, "--prompt", prompt];
      if (count !== undefined) args.push("--count", String(count));
      if (duration !== undefined) args.push("--duration", String(duration));
      if (aspectRatio) args.push("--aspect-ratio", aspectRatio);
      if (imageUrl) args.push("--image", imageUrl);
      if (startImageUrl) args.push("--start-image", startImageUrl);
      if (endImageUrl) args.push("--end-image", endImageUrl);
      if (wait) args.push("--wait");
      const output = await runHF(args);
      return ok(output);
    }
  );

  // Get the status or result of a generation job
  server.tool(
    "higgsfield-generate-get",
    {
      jobId: z.string().describe("Job ID returned by higgsfield-generate")
    },
    async ({ jobId }) => {
      const output = await runHF(["generate", "get", jobId]);
      return ok(output);
    }
  );

  // Poll a job until it finishes
  server.tool(
    "higgsfield-generate-wait",
    {
      jobId: z.string().describe("Job ID to wait for"),
      timeout: z.string().optional().describe("Max wait duration, e.g. 10m or 30s (default 5m)"),
      interval: z.string().optional().describe("Polling interval, e.g. 5s (default 5s)")
    },
    async ({ jobId, timeout, interval }) => {
      const args = ["generate", "wait", jobId];
      if (timeout) args.push("--wait-timeout", timeout);
      if (interval) args.push("--wait-interval", interval);
      const output = await runHF(args);
      return ok(output);
    }
  );

  // List recent generation jobs
  server.tool(
    "higgsfield-generate-list",
    {
      type: z.enum(["image", "video"]).optional().describe("Filter by output type"),
      size: z.number().int().min(1).max(100).optional().describe("Number of results to return")
    },
    async ({ type, size }) => {
      const args = ["generate", "list"];
      if (type === "image") args.push("--image");
      if (type === "video") args.push("--video");
      if (size !== undefined) args.push("--size", String(size));
      const output = await runHF(args);
      return ok(output);
    }
  );

  // Upload a local file for use as generation input
  server.tool(
    "higgsfield-upload",
    {
      filePath: z.string().describe("Local file path to upload (image, video, or audio)")
    },
    async ({ filePath }) => {
      const output = await runHF(["upload", "create", filePath]);
      return ok(output);
    }
  );

  // Check account balance and plan
  server.tool(
    "higgsfield-account-status",
    {},
    async () => {
      const output = await runHF(["account", "status"]);
      return ok(output);
    }
  );
}
