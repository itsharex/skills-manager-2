export default {
  app: {
    tabs: {
      local: "Local Skills",
      market: "Market",
      ide: "IDE Browser",
      settings: "Settings"
    },
    header: {
      language: "Language",
      theme: "Theme",
      themeLight: "Light",
      themeDark: "Dark"
    }
  },
  sidebar: {
    local: "Local Skills",
    market: "Market",
    ide: "IDE Management",
    settings: "Settings",
    version: "Version",
    github: "GitHub Repository",
    collapse: "Collapse sidebar",
    expand: "Expand sidebar"
  },
  settings: {
    title: "Settings",
    about: {
      title: "About",
      version: "Version",
      checkUpdate: "Check for Updates",
      github: "GitHub"
    },
    update: {
      currentVersion: "Current Version",
      checking: "Checking...",
      checkForUpdates: "Check for Updates",
      downloading: "Downloading...",
      downloadAndInstall: "Download and Install",
      installAndRestart: "Install and Restart",
      upToDate: "Up to date",
      newVersionAvailable: "New version {version} available"
    },
    appearance: {
      title: "Appearance",
      theme: "Theme",
      language: "Language",
      light: "Light",
      dark: "Dark",
      system: "System"
    }
  },
  market: {
    title: "Marketplace Search",
    searchPlaceholder: "Search skills (name / description / author)",
    search: "Search",
    searching: "Searching...",
    refresh: "Refresh",
    refreshing: "Loading",
    resultsTitle: "Results",
    loadingHint: "Loading...",
    emptyHint: "No results",
    download: "Download",
    downloaded: "Downloaded",
    downloading: "Downloading",
    queued: "In Queue",
    update: "Update",
    updated: "Updated",
    updating: "Updating...",
    source: "Source: {source}",
    loadMore: "Load More",
    unavailable: "Unavailable"
  },
  local: {
    title: "Local Skills",
    hint: "To import local skills, select the folder containing SKILL.md.",
    total: "Total {count}",
    filteredTotal: "Showing {shown} / {total}",
    selectAll: "Select all",
    searchPlaceholder: "Search name, description or path",
    scanning: "Scanning local skills...",
    emptyHint: "No local skills found. Try downloading some from the Market.",
    searchEmptyHint: "No matching skills",
    install: "Install to IDE",
    installSelected: "Batch install to IDE ({count})",
    import: "Import Local Skill",
    openDir: "Open Folder",
    deleteOne: "Delete",
    deleteSelected: "Delete selected ({count})",
    deleteSelectedCount: "{count} skills selected",
    deleteAll: "Delete all",
    selectSkillDir: "Select Skill Directory",
    processing: "Processing...",
    linked: "Linked",
    unused: "Not linked"
  },
  ide: {
    title: "IDE Browser",
    switchHint: "Switch IDE to view its skills.",
    total: "{count} skills",
    addHint: "Add custom IDE (name + relative or absolute path, supports WSL paths like \\\\wsl$\\Ubuntu\\home\\user\\.claude\\skills).",
    namePlaceholder: "IDE name",
    dirPlaceholder: "e.g. .myide/skills",
    addButton: "Add IDE",
    deleteButton: "Remove",
    loading: "Loading...",
    emptyHint: "No skills for this IDE",
    sourceLink: "Linked",
    sourceLocal: "Local",
    unmanaged: "Unmanaged",
    openDir: "Open Folder",
    adopt: "Manage Centrally",
    uninstall: "Uninstall"
  },
  installModal: {
    title: "Select target IDEs",
    selectAll: "Select all",
    cancel: "Cancel",
    confirm: "Install",
    needSelect: "Select at least one IDE"
  },
  uninstallModal: {
    title: "Confirm uninstall",
    hint: "This will remove the directory or symlink. This cannot be undone.",
    deleteTitle: "Confirm local skill deletion",
    deleteHint: "This will remove the selected skills from Skills Manager local storage. This cannot be undone.",
    cancel: "Cancel",
    confirm: "Uninstall",
    deleteConfirm: "Delete"
  },
  loading: {
    title: "Processing"
  },
  messages: {
    downloaded: "Downloaded to {path}",
    updated: "Updated to {path}",
    installed: "Installed to {ide}",
    installing: "Installing...",
    uninstalling: "Uninstalling...",
    deleting: "Deleting...",
    importing: "Importing...",
    adopting: "Adding to central management...",
    handled: "Handled {linked} targets, skipped {skipped} targets.",
    imported: "Successfully imported {success} skills, failed {failed}."
  },
  errors: {
    fillIde: "Please fill in IDE name and directory.",
    ideExists: "IDE name already exists",
    selectValidIde: "Select a valid IDE",
    selectAtLeastOne: "Select at least one IDE",
    searchFailed: "Search failed. Please try again.",
    downloadFailed: "Download failed.",
    updateFailed: "Update failed.",
    scanFailed: "Failed to scan local skills.",
    installFailed: "Installation failed.",
    uninstallFailed: "Uninstallation failed.",
    deleteFailed: "Deletion failed.",
    importFailed: "Import failed.",
    openDirFailed: "Failed to open folder.",
    adoptFailed: "Failed to add to central management.",
    invalidPath: "Path must be a relative path or a valid absolute path (including WSL paths like \\\\wsl$\\...)."
  },
  update: {
    available: "New version available: {version}",
    view: "View Release",
    install: "Update Now"
  },
  marketSettings: {
    title: "Market Settings",
    online: "Online",
    unavailable: "Unavailable",
    needsKey: "Needs API Key",
    apiKey: "API Key",
    apiKeyPlaceholder: "Enter API Key",
    cancel: "Cancel",
    save: "Save"
  },
  download: {
    title: "Downloading",
    pending: "Pending...",
    downloading: "Downloading...",
    done: "Done",
    error: "Download failed",
    retry: "Retry"
  }
};
