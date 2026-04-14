#!/usr/bin/env python3
"""
PreToolUse hook for Bash.

Refuses git commits made directly on `master` or `main`, enforcing
CLAUDE.md Rule 3 ("Protected Branches") at the harness level so the
rule cannot be forgotten.

Allows `git commit` on any other branch (feature/*, bugfix/*, hotfix/*).
Allows all non-commit Bash commands (this hook only intervenes on commits).

Exit codes:
  0 — allow the command
  2 — block the command (stderr is shown to the user/Claude)
"""
import json
import subprocess
import sys

PROTECTED_BRANCHES = {"master", "main"}


def main() -> int:
    try:
        payload = json.loads(sys.stdin.read())
    except (json.JSONDecodeError, ValueError):
        # Malformed input — don't block, just continue.
        return 0

    if payload.get("tool_name") != "Bash":
        return 0

    command = (payload.get("tool_input") or {}).get("command", "")
    if not command:
        return 0

    # Only act on git commit invocations. Naive prefix check is sufficient
    # because the deny-list catches `--no-verify` etc. at the permission layer.
    if not command.lstrip().startswith("git commit"):
        return 0

    try:
        branch = subprocess.check_output(
            ["git", "branch", "--show-current"],
            text=True,
            stderr=subprocess.DEVNULL,
        ).strip()
    except (subprocess.CalledProcessError, FileNotFoundError):
        # Not in a git repo or git missing — nothing to enforce.
        return 0

    if branch in PROTECTED_BRANCHES:
        sys.stderr.write(
            f"BLOCKED by .claude/hooks/check-branch.py: refusing to commit on "
            f"protected branch '{branch}'.\n"
            f"CLAUDE.md Rule 3 — branch off first:\n"
            f"  git checkout -b feature/<id>-<desc>\n"
        )
        return 2

    return 0


if __name__ == "__main__":
    sys.exit(main())
