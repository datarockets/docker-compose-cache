## Commands

While agent is running in devcontainer, everything related to the code is happening in another smaller action container. Use bin scripts to run commands in action container.

- `bin/npm`
- `bin/npx`

## Formatting

After modifying any TypeScript, JavaScript, JSON, or Markdown files, run:

```bash
bin/npx prettier --write <relative paths to files>
```
