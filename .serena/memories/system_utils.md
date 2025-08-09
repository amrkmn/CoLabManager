The development environment is Windows, so you should use PowerShell commands. Here are some common commands:
- **List files and directories:** `ls` or `Get-ChildItem`
- **Change directory:** `cd <directory>`
- **Create a directory:** `mkdir <directory>`
- **Create a file:** `New-Item <file>`
- **Remove a file:** `rm <file>` or `Remove-Item <file>`
- **Remove a directory:** `rmdir <directory>` or `Remove-Item -Recurse -Force <directory>`
- **Find text in files:** `grep` (if installed, e.g., via Git for Windows) or `Select-String -Path <file> -Pattern <pattern>`
- **Git commands:** `git status`, `git add .`, `git commit -m "message"`, `git push`