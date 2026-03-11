export default {
  app: {
    tabs: {
      local: "已有 Skills",
      market: "Market",
      ide: "IDE 浏览",
      settings: "设置"
    },
    header: {
      language: "语言",
      theme: "主题",
      themeLight: "浅色",
      themeDark: "深色"
    }
  },
  sidebar: {
    local: "本地技能",
    market: "市场",
    ide: "IDE 管理",
    settings: "设置",
    version: "版本",
    github: "GitHub 仓库",
    collapse: "收起侧边栏",
    expand: "展开侧边栏"
  },
  settings: {
    title: "设置",
    about: {
      title: "关于",
      version: "版本",
      checkUpdate: "检查更新",
      github: "GitHub"
    },
    update: {
      currentVersion: "当前版本",
      checking: "检查中...",
      checkForUpdates: "检查更新",
      downloading: "正在下载...",
      downloadAndInstall: "下载并安装",
      installAndRestart: "安装并重启",
      upToDate: "已是最新版本",
      newVersionAvailable: "发现新版本 {version}"
    },
    appearance: {
      title: "外观",
      theme: "主题",
      language: "语言",
      light: "浅色",
      dark: "深色",
      system: "跟随系统"
    }
  },
  market: {
    title: "商店检索",
    searchPlaceholder: "输入关键字搜索技能...",
    search: "搜索",
    searching: "搜索中...",
    refresh: "刷新",
    refreshing: "刷新中...",
    resultsTitle: "搜索结果",
    loadingHint: "正在加载技能列表...",
    emptyHint: "未找到匹配的技能。",
    meta: "作者 {author} • ⭐️ {stars} • ⬇️ {installs}",
    update: "更新",
    updated: "已更新",
    updating: "正在更新...",
    download: "下载",
    downloaded: "已下载",
    queued: "排队中",
    unavailable: "暂不可用",
    source: "来源：{source}",
    loadMore: "加载更多"
  },
  local: {
    title: "已有 Skills",
    hint: "导入本地 Skill 需要选择包含 SKILL.md 的 Skill 文件夹。",
    total: "总数 {count}",
    filteredTotal: "显示 {shown} / {total}",
    selectAll: "全选",
    searchPlaceholder: "搜索名称、描述或路径",
    scanning: "正在扫描本地 Skills...",
    emptyHint: "暂无本地 Skill，请尝试从市场下载。",
    searchEmptyHint: "没有匹配的 Skill",
    install: "安装到编辑器",
    installSelected: "批量安装到编辑器 ({count})",
    import: "导入本地 Skill",
    openDir: "打开目录",
    deleteOne: "删除",
    deleteSelected: "删除选中 ({count})",
    deleteSelectedCount: "已选 {count} 个 Skill",
    deleteAll: "全部删除",
    selectSkillDir: "选择 Skill 目录",
    processing: "处理中...",
    linked: "已关联",
    unused: "未关联"
  },
  ide: {
    title: "IDE 浏览",
    switchHint: "切换 IDE 查看其技能列表。",
    total: "当前列表 {count}",
    addHint: "添加自定义 IDE（名称 + 相对路径或绝对路径，支持 WSL 路径如 \\\\wsl$\\Ubuntu\\home\\user\\.claude\\skills）。",
    namePlaceholder: "IDE 名称",
    dirPlaceholder: "例如 .myide/skills",
    addButton: "添加 IDE",
    deleteButton: "删除",
    loading: "加载中...",
    emptyHint: "该 IDE 暂无 skills",
    sourceLink: "链接",
    sourceLocal: "本地",
    unmanaged: "未托管",
    openDir: "打开目录",
    adopt: "纳入统一管理",
    uninstall: "卸载"
  },
  installModal: {
    title: "选择安装目标 IDE",
    selectAll: "全选",
    cancel: "取消",
    confirm: "确认安装",
    needSelect: "请选择至少一个 IDE"
  },
  uninstallModal: {
    title: "确认卸载",
    hint: "将移除该 IDE 下的技能目录或软链接，无法恢复。",
    deleteTitle: "确认删除本地 Skill",
    deleteHint: "将从 Skills Manager 本地仓库删除所选 Skill，无法恢复。",
    cancel: "取消",
    confirm: "确认卸载",
    deleteConfirm: "确认删除"
  },
  loading: {
    title: "处理中"
  },
  messages: {
    downloaded: "已下载至 {path}",
    updated: "已更新至 {path}",
    installed: "已安装至 {ide}",
    installing: "正在安装...",
    uninstalling: "正在卸载...",
    deleting: "正在删除...",
    importing: "正在导入...",
    adopting: "正在纳入统一管理...",
    handled: "已处理 {linked} 个目标，跳过 {skipped} 个目标。",
    imported: "成功导入 {success} 个 Skill，失败 {failed} 个。"
  },
  errors: {
    searchFailed: "搜索失败，请重试。",
    downloadFailed: "下载失败。",
    updateFailed: "更新失败。",
    scanFailed: "扫描本地 Skill 失败。",
    installFailed: "安装失败。",
    uninstallFailed: "卸载失败。",
    deleteFailed: "删除失败。",
    importFailed: "导入失败。",
    openDirFailed: "打开目录失败。",
    adoptFailed: "纳入统一管理失败。",
    fillIde: "请填写编辑器名称和目录。",
    ideExists: "IDE 名称已存在",
    selectValidIde: "请选择有效的 IDE",
    selectAtLeastOne: "请选择至少一个 IDE",
    invalidPath: "路径必须是相对路径或有效的绝对路径（支持 WSL 路径如 \\\\wsl$\\...）。"
  },
  update: {
    available: "发现新版本: {version}",
    view: "查看更新",
    install: "立即更新"
  },
  marketSettings: {
    title: "市场管理",
    online: "在线",
    unavailable: "暂不可用",
    needsKey: "需要 API Key",
    apiKey: "API Key",
    apiKeyPlaceholder: "请输入 API Key",
    cancel: "取消",
    save: "保存"
  },
  download: {
    title: "正在下载",
    pending: "等待中...",
    downloading: "下载中...",
    done: "完成",
    error: "下载失败",
    retry: "重试"
  }
};
