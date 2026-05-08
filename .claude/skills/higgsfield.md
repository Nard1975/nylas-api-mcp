# Higgsfield AI — Skill

Higgsfield is an AI media generation platform. Use the `mcp__higgsfield__*` tools to generate images and videos, manage uploads, train Soul Characters, and create Marketing Studio ads.

## Workflow Overview

### 1. Check balance / workspace
- `balance` — view available credits and subscription plan
- `list_workspaces` — list all accessible workspaces (`is_selected` marks the active one)
- `select_workspace` — switch active workspace; pass `clear: true` to return to default

### 2. Explore models
Always call `models_explore` before generating to discover valid model IDs, supported aspect ratios, duration ranges, and media roles.

```
models_explore { action: "recommend", query: "<goal>", type: "image"|"video" }
models_explore { action: "list", type: "image"|"video" }
models_explore { action: "get", model_id: "<id>" }
```

### 3. Upload reference media (when needed)
1. `media_upload` — get presigned upload URL(s)
2. Run the returned `curl` command(s) to PUT bytes to each `upload_url`
3. `media_confirm` — confirm the upload(s) and receive `media_id` UUID(s)
4. Pass `media_id` as `value` in the `medias[]` array of generation calls

### 4. Generate images
**Default model selection:**
| Goal | Model |
|------|-------|
| Commercial / product / ads | `marketing_studio_image` |
| Text-only character / avatar | `soul_cast` |
| Reusable Soul Character (trained) | `soul_2` + `soul_id` |
| One-off character with reference | `soul_2` or `nano_banana_2` |
| Top quality / 4K / text & diagrams | `nano_banana_2` |

```
generate_image {
  params: {
    model: "<model_id>",
    prompt: "<description>",
    aspect_ratio: "<ratio>",   // from models_explore
    count: 1-4,
    medias: [{ value: "<media_id or job_id or https URL>", role: "<role>" }]
  }
}
```

### 5. Generate videos
**Default model selection:**
| Goal | Model |
|------|-------|
| Commercial / product / ads | `marketing_studio_video` |
| Reference-driven, strong identity | `seedance_2_0` |
| Multi-shot, audio, motion transfer | `kling3_0` |

For **Marketing Studio URL-driven videos**: call `show_marketing_studio { action: "fetch", url: "<url>" }` first, then pass `model: "marketing_studio_video"` and the resulting URL to `generate_video`.

For **uploaded-image product videos**: call `show_marketing_studio { type: "product", medias: [...], action: "create" }` first — it auto-creates the product and returns `next_step`; pass that `next_step` straight to `generate_video`.

```
generate_video {
  params: {
    model: "<model_id>",
    prompt: "<description>",
    duration: <seconds>,       // from models_explore duration_range
    aspect_ratio: "<ratio>",
    medias: [{ value: "<media_id or job_id or https URL>", role: "<role>" }]
  }
}
```

### 6. Soul Characters (reusable trained identities)
Use `show_characters` only when the user explicitly asks to train a reusable Soul / digital twin.

```
show_characters { action: "list" }                          // browse library
show_characters { action: "train", name: "<name>",          // train new (5-20 images required)
  images: ["<media_id>", ...] }
show_characters { action: "status", soul_id: "<id>" }       // check training status
```

After the Soul is ready, generate with `model: "soul_2"` and pass `soul_id` as a top-level param.

### 7. Marketing Studio
```
show_marketing_studio { action: "list", type: "product"|"webproduct"|"avatar" }
show_marketing_studio { action: "fetch", url: "<product or site URL>" }
show_marketing_studio { action: "presets" }
show_marketing_studio { action: "create", type: "product", medias: [...] }
```

- `product` — a specific physical/sellable item to feature in the video
- `webproduct` — a website / app / service to advertise as a whole (use for App Store / Google Play pages)
- Hooks and settings are read-only; list them with `type: "hook"` / `type: "setting"` and pass selected IDs to `generate_video`

### 8. Browse results and media
```
show_generations { type: "image"|"video", size: 24 }   // paginated history
show_medias { type: "image"|"video"|"audio" }           // uploaded media library
job_display { ids: ["<job_id>", ...] }                  // re-display specific results
transactions { size: 10 }                               // credit history
```

## Key Rules
- Always call `models_explore` to get constraints before generating — never guess aspect ratios or durations
- Upload files with `media_upload` → curl PUT → `media_confirm`; pass the returned UUID as `value` in `medias[]`
- Use `job_id` from a prior generation as `value` in subsequent generation `medias[]` to reuse results
- Do not train a Soul for a generic "create a character" request — use one-off generation with `soul_2` or `nano_banana_2`; only train when the user explicitly wants a reusable identity
- For hooks/settings in Marketing Studio, always list options first before calling `generate_video`
- `show_generations` is for browsing history only — do not use it as a polling mechanism after generation
