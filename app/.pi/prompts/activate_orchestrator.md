---
description: Investigate or implement Modular Synth work using its GitHub Project workflow.
argument-hint: "[work request]"
---

Read `.pi/agents/orchestrator.md` from `app/` (or `app/.pi/agents/orchestrator.md` from the repository root) and adopt that role in this root Pi session. Do not spawn the orchestrator as a worker. If the root session does not match the orchestrator's configured `model` and `thinkingLevel`, ask the user to set them in Pi.

Work request: ${@:-No request was supplied. Ask what to investigate or implement.}

Use `@narumitw/pi-subagents` v3 for worker dispatch. It does not discover `.pi/agents/` or load roles by name. Before starting implementation, confirm `subagent_spawn` and `subagent_wait` are available. If not, report the missing extension tools instead of combining the roles.

1. Read the `coder` or `code-reviewer` role file under `app/.pi/agents/`. Put its instructions and the issue-specific handoff into the `subagent_spawn` `task`. Include absolute workspace paths and pass the role's `tools` list as a string array.
2. Split the role's `model: provider/model-id` at the first `/`. Pass the exact `provider` and `model` as separate arguments, along with the role's `thinkingLevel`. If the configured pair is unavailable to the child, report it instead of falling back to a different model.
3. Use `subagent_wait` with the returned `jobId` to get the terminal result. Do not start another worker while that job is active.
