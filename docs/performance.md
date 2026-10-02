# Minecraft lag reduction

Open **Server → Settings → Lag azaltma**. The module reads the authenticated node settings bridge, polls every 15 seconds, and displays only running-server metrics younger than 60 seconds. An outdated agent disables profile controls.

The Linux agent samples the verified Minecraft JVM (including a Java child launched by Forge's run.sh). CPU is the JVM's share of total node capacity, not a single-core saturation measure. Memory is process RSS compared with the configured heap budget; RSS includes native JVM memory and can exceed that budget. The first CPU sample is withheld until a second counter is available. Metrics are sent using the existing authenticated server-metrics ingest.

Paper/Purpur query `tps` (one-minute TPS) and `mspt` (five-second mean), Spigot queries `tps`, and modern Minecraft 1.20.3+ uses `tick query` for mean tick time. Console queries are read-only. Unsupported commands, missing control channels, and unreadable responses yield null, never a synthetic 20 TPS. The target tick rate returned by vanilla is not reported as measured TPS. The module does not open RCON or install plugins.

## Profiles

| Profile | Maximum view distance | Maximum simulation distance |
| --- | --- | --- |
| Balanced | 8 | 6 |
| Low resource | 6 | 4 |

These are conservative product presets, not a guarantee of lag elimination. Existing lower distances are preserved. Simulation distance is also capped at the resulting view distance. Reducing distances reduces visible terrain and the area where distant farms, redstone, and entities tick. Paper world-specific settings, plugin overrides, and startup arguments may override server.properties; profile application reports a file change, not a verified runtime improvement.

Apply only while Minecraft is fully stopped. The agent backs up the two original properties under `DATA_DIR/performance-backups/<server-id>.json`, outside the server's editable file tree, before atomically replacing server.properties. Restore touches only those two keys; other settings changed afterwards remain intact. Originally absent properties are removed on restore. A distance edited after application causes rollback to refuse overwriting it. Restore the active backup before selecting another profile. Starting Minecraft activates the resulting configuration. No entities, worlds, or player data are deleted.

Profile permissions use the existing settings permission (`manager` or assigned `canReset`). Changes are queued and audited; queue acceptance is not shown as application success. The agent checks the running process again when executing the command.

## Update the installed Oracle agent

Vercel deploys the panel only. The installed agent now needs **all three compiled files**, not just index.js: `index.js`, `performance.js`, `performance-metrics.js`.

For the existing `/opt/blockctrl/agent` installation, run on the VPS:

```bash
update_dir=$(mktemp -d /tmp/blockctrl-agent-update.XXXXXX)
git clone --depth 1 https://github.com/omerakyar87-rgb/minecrfat-server.git "$update_dir/repo"
cd "$update_dir/repo/agent"
npx --yes pnpm@10.34.5 install --frozen-lockfile
npx --yes pnpm@10.34.5 build
```

For a guarded update that builds, backs up all files, and restores them if the service fails to start, run `bash "$update_dir/repo/scripts/update-installed-agent.sh"` instead of the manual steps below.

Only after the build succeeds:

```bash
sudo cp -a /opt/blockctrl/agent/dist "/opt/blockctrl/agent/dist.backup.$(date +%s)"
sudo systemctl stop blockctrl-agent.service
sudo install -o blockctrl -g blockctrl -m 0644 dist/index.js dist/performance.js dist/performance-metrics.js /opt/blockctrl/agent/dist/
sudo systemctl start blockctrl-agent.service
systemctl is-active blockctrl-agent.service
sudo journalctl -u blockctrl-agent.service -n 30 --no-pager
```

Keep the existing environment file and service configuration. Agent restarts do not automatically restart Minecraft. If installation fails, copy the backed-up dist contents back and start the service. After updating, check a running server for CPU/RSS and available tick metrics; stop it to apply a profile, start it again, and compare performance under similar player load.

Primary references: [Paper server.properties](https://docs.papermc.io/paper/reference/server-properties/), [Paper performance commands](https://docs.papermc.io/paper/reference/commands/), [Minecraft 1.20.3 tick query](https://www.minecraft.net/tr-tr/article/minecraft-java-edition-1-20-3). Use Spark for detailed cause analysis on compatible servers.
