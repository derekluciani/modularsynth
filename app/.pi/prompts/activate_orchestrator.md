---
description: Investigate or implement Modular Synth work using its GitHub Project workflow.
argument-hint: "[work request]"
---

Read `.pi/agents/orchestrator.md` from `app/` (or `app/.pi/agents/orchestrator.md` from the repository root) and adopt that role in this root Pi session. Do not spawn the orchestrator as a worker. If the root session does not match the orchestrator's configured `model` and `thinkingLevel`, ask the user to set them in Pi.

Work request: ${@:-No request was supplied. Ask what to investigate or implement.}

Use `@narumitw/pi-subagents` v3 for worker dispatch. It does not discover `.pi/agents/` or load roles by name. Before starting implementation, confirm `subagent_spawn`, `subagent_wait`, `subagent_send`, and `subagent_cancel` are available. If not, report the missing extension tools instead of combining the roles.

1. Read the `coder` or `code-reviewer` role file under `app/.pi/agents/`. Put its instructions and the issue-specific handoff into the `subagent_spawn` `task`. Include absolute workspace paths and pass the role's `tools` list as a string array.
2. Split the role's `model: provider/model-id` at the first `/`. Pass the exact `provider` and `model` as separate arguments, along with the role's `thinkingLevel`. If the configured pair is unavailable to the child, report it instead of falling back to a different model.
3. If the role declares `skills`, resolve each path relative to the `app/` containing that role file and pass the absolute paths as the `subagent_spawn` `skills` array. Tell the worker where the attachments live so it can read opt-in skills directly. Omit `skills` for roles without that field. Project-local attachments require Pi project trust; report an attachment error instead of retrying without the skills.
4. Use `subagent_wait` with the returned `jobId` when you need the result. If it returns `reason: "subagent_message"`, handle the message within the existing scope (answer a worker request with `subagent_send` and its `requestId`), then wait again on the same job. A wait timeout doesn’t stop the job: keep waiting or explicitly call `subagent_cancel` if the work should stop. Do not start another worker until the current job reaches a terminal state.
