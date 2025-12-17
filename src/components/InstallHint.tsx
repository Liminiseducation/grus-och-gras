// Previously provided an automatic beforeinstallprompt hint. Per product
// decision, automatic install UI has been removed in favor of a manual
// user-invoked help. Keep a no-op component here to avoid accidental
// rendering changes elsewhere in the codebase.

export default function InstallHint() {
  return null;
}
