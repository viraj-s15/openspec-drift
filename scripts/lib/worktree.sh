# Sourced by scripts that run a tool against a branch in a throwaway worktree.
# make_worktree <path> <ref> creates it, and the calling script removes it on exit, even after a failed step.
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

make_worktree() {
  worktree_path="$1"
  rm -rf "$worktree_path"
  git -C "$repo_root" worktree prune
  mkdir -p "$(dirname "$worktree_path")"
  git -C "$repo_root" -c advice.detachedHead=false worktree add -q --detach "$worktree_path" "$2"
  ln -s "$repo_root/node_modules" "$worktree_path/node_modules"
  trap 'git -C "$repo_root" worktree remove --force "$worktree_path" 2>/dev/null' EXIT
}
