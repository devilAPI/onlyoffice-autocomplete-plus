# Instructions for ONLYOFFICE Autocomplete Plus

## Build and Deployment Workflow

Always package and deploy the plugin into ONLYOFFICE after making changes or finishing a prompt:

1. **Repackage plugin:**
   ```bash
   rm -f deploy/autocomplete.plugin && zip -r deploy/autocomplete.plugin . -x 'deploy/*' 'tools/*' '.git/*' '.github/*' '.gitignore' 'LICENSE' 'IDEAS.md' 'GEMINI.md'
   ```

2. **Load into ONLYOFFICE:**
   ```bash
   unzip -o deploy/autocomplete.plugin -d "/home/devlapi/.local/share/onlyoffice/desktopeditors/sdkjs-plugins/{A103601F-FDA0-418A-BC37-A514031894C0}/"
   ```
