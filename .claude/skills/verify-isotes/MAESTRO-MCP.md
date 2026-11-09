# Verify isotes: the Maestro MCP server

Read when the session drives with the Maestro MCP server instead of the CLI. "One driver per session" in `SKILL.md` Drive still applies: MCP steps first, then CLI.

In an MCP session, also call MCP `list_devices`: the `SIM=` value from `scripts/sim-env.sh` should be `connected: true`. That only means booted; it answers even when the MCP driver is dead. A dead driver shows on the first `run` or `inspect_screen` as "Device became unreachable" → use the CLI for the rest of the session.

**Step by step (MCP server `maestro`):** `list_devices` → `run` with inline YAML (`appId: com.anonymous.isotes`, then `---` and commands such as `tapOn`, `openLink`, `assertVisible`) on that device. To check one value, `assertVisible` it in a `run`; `inspect_screen` returns the whole unfiltered tree (~7 KB on a trip's expense tab), so use it only to find selectors. `cheat_sheet` is ~20 KB: only when unsure of a command's arguments. Never use the AI commands (`assertWithAI`, `assertNoDefectsWithAI`, `extractTextWithAI`): they upload screenshots. When the server misbehaves, fall back to the CLI above and say so; don't retry the same call.

| Tool | Use | Prompts? |
|---|---|---|
| `list_devices`, `run`, `inspect_screen`, `cheat_sheet` | as above | no (allow-listed) |
| `take_screenshot` | visual checks only (Evidence) | yes, on purpose |
| `open_maestro_viewer` | not used | yes |
| `list_cloud_devices`, `run_on_cloud`, `get_cloud_run_status`, `describe_cloud_run` | not used: `run_on_cloud` uploads the app and flows | yes |
