# Workspace Studio: capabilities & limits for a NotebookLM → Make handoff

What Workspace Studio can and cannot do today for this use case, based on the live docs and what is visible in the Flows / Studio UI. ([studio.workspace.google](https://studio.workspace.google.com/))

---

## 1. Trigger: "New file added to Drive folder"

From the Discover gallery in Studio, there are templates that clearly use Drive-based starters, including: "Auto-create tasks when files are added to a folder" and "Notify me when a file is added to a folder." ([studio.workspace.google](https://studio.workspace.google.com/))

Those imply there is a Drive starter of the form "when a file is added to a folder," and each template prompts you to choose the target folder, so yes, you can specify a particular folder as part of the trigger configuration. ([sites.google](https://sites.google.com/view/workspace-flows/about))

**Net:** You do have a "file added to folder" type starter, and you can scope it to a specific Drive folder, which is what you need to watch a NotebookLM export directory or similar. ([sites.google](https://sites.google.com/view/workspace-flows/about))

---

## 2. HTTP / webhook action (critical for Make)

Workspace Studio supports an outbound webhook step called "Send a webhook." ([support.google](https://support.google.com/workspace-studio/answer/16521900?hl=en))

The webhook step lets you configure:

- **A static Webhook/API URL (required)** – any https URL, stored securely, no variables allowed in the URL. ([support.google](https://support.google.com/workspace-studio/answer/16521900?hl=en))
- **HTTP method** – GET, POST, PUT, PATCH, DELETE. ([support.google](https://support.google.com/workspace-studio/answer/16521900?hl=en))
- **Payload (optional)** – arbitrary text body; JSON is recommended, and you can inject variables into the payload. ([support.google](https://support.google.com/workspace-studio/answer/16521900?hl=en))
- **Optional follow-on steps** using the webhook response, which is exposed as a variable for later AI or routing steps. ([support.google](https://support.google.com/workspace-studio/answer/16521900?hl=en))

Because Make's "Custom webhook" module gives you a static URL, Studio can POST directly into a Make scenario as an outbound HTTP call. ([make](https://www.make.com/en/integrations/google-g-suite))

That means you can absolutely "hand off" from Studio to Nard Business OS (Make) at the last mile, sending whatever context you've collected in the flow as JSON. ([make](https://www.make.com/en/integrations/google-g-suite))

---

## 3. NotebookLM integration or connector

NotebookLM is now included as part of Workspace plans and can be added as a **source inside the Gemini app**, but that's a Gemini chat integration, not a Flows / Studio step. ([workspace.google](https://workspace.google.com/products/notebooklm/))

In the public Workspace Studio / Flows connector and extension docs, NotebookLM is not listed as a dedicated trigger or action (no "NotebookLM" connector entry alongside Gmail, Drive, Calendar, etc.). ([sites.google](https://sites.google.com/view/workspace-flows/connectors))

So today, there does not appear to be:

- A native "NotebookLM step" in Studio (no trigger or action branded as NotebookLM). ([sites.google](https://sites.google.com/view/workspace-flows/connectors))
- A marketplace connector entry for NotebookLM that you can add like Asana, Jira, Salesforce, etc. ([sites.google](https://sites.google.com/view/workspace-flows/connectors))

Practically, to involve NotebookLM in a workflow, you would either:

- Use Gemini chat with NotebookLM notebooks as sources, which is supported in Gemini but not exposed as a distinct Studio action yet. ([workspaceupdates.googleblog](https://workspaceupdates.googleblog.com/2026/01/take-notebooks-further-notebooklm-gemini.html))
- Or call any public NotebookLM / Workspace API or proxy endpoint via the generic webhook / HTTP step, if and when such an API is available to you. ([workspace.google](https://workspace.google.com/products/notebooklm/))

---

## 4. Third-party connectors (Make, custom HTTP, etc.)

The Workspace connector and extension platform for Studio currently highlights connectors like Asana, Confluence, HubSpot, Jira, Mailchimp, Monday.com, QuickBooks, Salesforce, and similar SaaS tools. ([sites.google](https://sites.google.com/view/workspace-flows/connectors))

Docs position Studio as connecting across Gmail, Drive, Chat, Calendar, and other Workspace apps, plus "popular third party apps" via connectors and Gemini extensions. ([sites.google](https://sites.google.com/view/workspace-flows/about))

Key points relative to the checklist:

- There is no first-party Make connector listed in the connector library / docs. ([make](https://www.make.com/en/integrations/google-g-suite))
- "Custom" HTTP is effectively covered via the "Send a webhook" step, which is explicitly described as sending an HTTP request to any URL you provide, with method and payload control. ([support.google](https://support.google.com/workspace-studio/answer/16521900?hl=en))
- Developers can build custom triggers and actions via Apps Script-backed Workspace add-ons and expose them into Studio as custom triggers / steps, but that is code-heavy and not a prebuilt Make integration. ([developers.google](https://developers.google.com/workspace/add-ons/concepts/workspace-triggers))

So: You can integrate with Make today via the webhook step (POST into a Make webhook), but not via a named Make connector tile. ([make](https://www.make.com/en/integrations/google-g-suite))

---

## 5. Can you close the loop inside Google vs. needing Make?

Putting it together:

- **New file trigger:** Yes, Studio supports a Drive starter for "file added to a folder," and you can select the folder, so you can cleanly start flows on new files in a specific directory. ([studio.workspace.google](https://studio.workspace.google.com/))
- **HTTP / webhook action:** Yes, Studio has a first-class "Send a webhook" step that can make outbound HTTP calls to a static URL with configurable method and JSON payload, which is exactly what you need to hit a Make custom webhook and hand off context. ([support.google](https://support.google.com/workspace-studio/answer/16521900?hl=en))
- **NotebookLM connector:** No dedicated NotebookLM connector / step is visible; NotebookLM is currently integrated into Gemini chat as a source, not as a separate Studio connector. ([workspaceupdates.googleblog](https://workspaceupdates.googleblog.com/2026/01/take-notebooks-further-notebooklm-gemini.html))
- **Third-party connectors:** There is a growing library of SaaS connectors, but no direct Make connector; custom HTTP is handled via the webhook step, and deeper custom triggers / actions are possible via Apps Script add-ons. ([sites.google](https://sites.google.com/view/workspace-flows/about))

**Implication for the architecture:**

You can get very close to "closed loop" in the Google ecosystem (Drive trigger → Gemini + Workspace actions → outbound webhook). ([studio.workspace.google](https://studio.workspace.google.com/))

For now, though, you still need Make (or another external orchestrator) for any steps that depend on:

- A real NotebookLM API workflow, or
- Complex cross-app logic outside what Studio's built-in connectors support. ([workspaceupdates.googleblog](https://workspaceupdates.googleblog.com/2026/01/take-notebooks-further-notebooklm-gemini.html))
