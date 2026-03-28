use crate::types::{
    DownloadRequest, DownloadResult, MarketStatus, MarketStatusType, RemoteSkill, RemoteSkillView,
    RemoteSkillsResponse, RemoteSkillsViewResponse,
};
use crate::utils::download::{download_bytes, download_skill_to_dir};
use serde::Deserialize;
use std::collections::HashMap;
use std::path::PathBuf;

const USER_AGENT: &str = "skills-manager-gui/0.1";
const SKILLS_HUB_INDEX_URL: &str =
    "https://raw.githubusercontent.com/qufei1993/skills-hub/main/featured-skills.json";

#[derive(Deserialize, Debug)]
struct SkillsHubResponse {
    #[allow(dead_code)]
    updated_at: Option<String>,
    #[allow(dead_code)]
    total: Option<u64>,
    skills: Vec<SkillsHubSkill>,
}

#[derive(Deserialize, Debug)]
struct SkillsHubSkill {
    slug: String,
    name: String,
    summary: String,
    #[serde(default)]
    downloads: u64,
    #[serde(default)]
    stars: u64,
    #[serde(default)]
    category: String,
    #[serde(default)]
    tags: Vec<String>,
    source_url: String,
}

fn map_claude_skill(skill: RemoteSkill, market_id: &str, market_label: &str) -> RemoteSkillView {
    RemoteSkillView {
        id: format!("{}:{}", market_id, skill.id),
        name: skill.name,
        namespace: skill.namespace,
        source_url: skill.source_url,
        description: skill.description,
        author: skill.author,
        installs: skill.installs,
        stars: skill.stars,
        market_id: market_id.to_string(),
        market_label: market_label.to_string(),
    }
}

fn build_github_source_url(owner: &str, repo: &str) -> String {
    format!("https://github.com/{owner}/{repo}")
}

fn get_value_string(value: &serde_json::Value, keys: &[&str]) -> Option<String> {
    for key in keys {
        if let Some(found) = value.get(*key) {
            if let Some(s) = found.as_str() {
                return Some(s.to_string());
            }
        }
    }
    None
}

fn get_value_u64(value: &serde_json::Value, keys: &[&str]) -> Option<u64> {
    for key in keys {
        if let Some(found) = value.get(*key) {
            if let Some(n) = found.as_u64() {
                return Some(n);
            }
            if let Some(n) = found.as_i64() {
                if n >= 0 {
                    return Some(n as u64);
                }
            }
        }
    }
    None
}

fn extract_github_owner(source_url: &str) -> String {
    source_url
        .strip_prefix("https://github.com/")
        .and_then(|rest| rest.split('/').next())
        .unwrap_or_default()
        .to_string()
}

fn matches_skills_hub_query(skill: &SkillsHubSkill, query: &str) -> bool {
    let trimmed = query.trim();
    if trimmed.is_empty() {
        return true;
    }

    let keyword = trimmed.to_ascii_lowercase();
    let tags_text = skill.tags.join(" ");
    [
        skill.name.as_str(),
        skill.slug.as_str(),
        skill.summary.as_str(),
        skill.category.as_str(),
        tags_text.as_str(),
    ]
    .iter()
    .any(|value| value.to_ascii_lowercase().contains(&keyword))
}

fn parse_skillsllm(
    buf: &[u8],
    market_id: &str,
    market_label: &str,
) -> Result<(Vec<RemoteSkillView>, u64), String> {
    let value: serde_json::Value = serde_json::from_slice(buf).map_err(|err| err.to_string())?;

    let list = value.get("skills").and_then(|v| v.as_array());

    let mut skills = Vec::new();
    if let Some(items) = list {
        for item in items {
            let github_owner =
                get_value_string(item, &["githubOwner", "github_owner", "owner", "repoOwner"]);
            let github_repo =
                get_value_string(item, &["githubRepo", "github_repo", "repo", "repoName"]);
            let source_url =
                get_value_string(item, &["githubUrl", "sourceUrl", "source_url", "repoUrl"])
                    .or_else(|| match (github_owner.as_deref(), github_repo.as_deref()) {
                        (Some(o), Some(r)) => Some(build_github_source_url(o, r)),
                        _ => None,
                    })
                    .unwrap_or_default();

            let name = get_value_string(item, &["name", "title"])
                .or_else(|| github_repo.clone())
                .unwrap_or_else(|| "skill".to_string());
            let description =
                get_value_string(item, &["description", "summary"]).unwrap_or_default();
            let author = get_value_string(item, &["githubOwner", "github_owner", "author"])
                .unwrap_or_default();
            let namespace = get_value_string(item, &["namespace"])
                .or_else(|| github_owner.clone())
                .unwrap_or_default();
            let stars = get_value_u64(item, &["stars", "githubStars", "github_stars"]).unwrap_or(0);
            let installs = get_value_u64(item, &["installs", "downloads"]).unwrap_or(0);
            let raw_id = get_value_string(item, &["id", "slug"])
                .or_else(|| match (github_owner.as_deref(), github_repo.as_deref()) {
                    (Some(o), Some(r)) => Some(format!("{o}/{r}")),
                    _ => None,
                })
                .unwrap_or_else(|| name.clone());

            skills.push(RemoteSkillView {
                id: format!("{}:{}", market_id, raw_id),
                name,
                namespace,
                source_url,
                description,
                author,
                installs,
                stars,
                market_id: market_id.to_string(),
                market_label: market_label.to_string(),
            });
        }
    }

    let total = value
        .get("pagination")
        .and_then(|p| get_value_u64(p, &["total", "count"]))
        .unwrap_or(skills.len() as u64);

    Ok((skills, total))
}

fn parse_skillsmp(
    buf: &[u8],
    market_id: &str,
    market_label: &str,
) -> Result<(Vec<RemoteSkillView>, u64), String> {
    let value: serde_json::Value = serde_json::from_slice(buf).map_err(|err| err.to_string())?;

    let list = value
        .get("data")
        .and_then(|d| d.get("skills"))
        .and_then(|v| v.as_array());

    let mut skills = Vec::new();
    if let Some(items) = list {
        for item in items {
            let source_url = get_value_string(item, &["githubUrl", "sourceUrl", "source_url"])
                .unwrap_or_default();
            let author = get_value_string(item, &["author"]).unwrap_or_default();
            let namespace = get_value_string(item, &["namespace"]).unwrap_or_default();
            let name = get_value_string(item, &["name", "title", "slug"])
                .unwrap_or_else(|| "skill".to_string());
            let description =
                get_value_string(item, &["description", "summary"]).unwrap_or_default();
            let installs = get_value_u64(item, &["downloads", "installs"]).unwrap_or(0);
            let stars = get_value_u64(item, &["stars", "githubStars", "github_stars"]).unwrap_or(0);
            let raw_id = get_value_string(item, &["id", "slug"]).unwrap_or_else(|| name.clone());

            skills.push(RemoteSkillView {
                id: format!("{}:{}", market_id, raw_id),
                name,
                namespace,
                source_url,
                description,
                author,
                installs,
                stars,
                market_id: market_id.to_string(),
                market_label: market_label.to_string(),
            });
        }
    }

    let total = value
        .get("data")
        .and_then(|d| d.get("pagination"))
        .and_then(|p| get_value_u64(p, &["total", "count"]))
        .unwrap_or(skills.len() as u64);

    Ok((skills, total))
}

fn parse_skills_hub(
    buf: &[u8],
    market_id: &str,
    market_label: &str,
    query: &str,
    limit: u64,
    offset: u64,
) -> Result<(Vec<RemoteSkillView>, u64), String> {
    let response: SkillsHubResponse = serde_json::from_slice(buf).map_err(|err| err.to_string())?;
    let filtered: Vec<SkillsHubSkill> = response
        .skills
        .into_iter()
        .filter(|skill| matches_skills_hub_query(skill, query))
        .collect();
    let total = filtered.len() as u64;

    let skills = filtered
        .into_iter()
        .skip(offset as usize)
        .take(limit as usize)
        .map(|skill| RemoteSkillView {
            id: format!("{}:{}", market_id, skill.slug),
            name: skill.name,
            namespace: skill.category,
            source_url: skill.source_url.clone(),
            description: skill.summary,
            author: extract_github_owner(&skill.source_url),
            installs: skill.downloads,
            stars: skill.stars,
            market_id: market_id.to_string(),
            market_label: market_label.to_string(),
        })
        .collect();

    Ok((skills, total))
}

fn push_status(
    statuses: &mut Vec<MarketStatus>,
    id: &str,
    name: &str,
    status: MarketStatusType,
    error: Option<String>,
) {
    statuses.push(MarketStatus {
        id: id.to_string(),
        name: name.to_string(),
        status,
        error,
    });
}

#[tauri::command]
pub async fn search_marketplaces(
    query: String,
    limit: u64,
    offset: u64,
    api_keys: HashMap<String, String>,
    enabled_markets: HashMap<String, bool>,
) -> Result<RemoteSkillsViewResponse, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let mut skills: Vec<RemoteSkillView> = Vec::new();
        let mut total: u64 = 0;
        let mut market_statuses: Vec<MarketStatus> = Vec::new();

        let trimmed = query.trim();
        let query_param = if trimmed.is_empty() {
            String::new()
        } else {
            format!("q={}", urlencoding::encode(trimmed))
        };

        let limit = if limit == 0 { 20 } else { limit };

        let claude_market_id = "claude-plugins";
        let claude_market_label = "Claude Plugins";
        if *enabled_markets.get(claude_market_id).unwrap_or(&true) {
            let mut url = String::from("https://claude-plugins.dev/api/skills?");
            if !query_param.is_empty() {
                url.push_str(&query_param);
                url.push('&');
            }
            url.push_str(&format!("limit={limit}&offset={offset}"));

            match download_bytes(&url, &[("Accept", "application/json"), ("User-Agent", USER_AGENT)]) {
                Ok(buf) => {
                    if let Ok(parsed) = serde_json::from_slice::<RemoteSkillsResponse>(&buf) {
                        total += parsed.total;
                        skills.extend(
                            parsed
                                .skills
                                .into_iter()
                                .map(|skill| map_claude_skill(skill, claude_market_id, claude_market_label)),
                        );
                        push_status(
                            &mut market_statuses,
                            claude_market_id,
                            claude_market_label,
                            MarketStatusType::Online,
                            None,
                        );
                    } else {
                        push_status(
                            &mut market_statuses,
                            claude_market_id,
                            claude_market_label,
                            MarketStatusType::Error,
                            Some("Failed to parse response".to_string()),
                        );
                    }
                }
                Err(err) => {
                    println!("Error fetching from Claude Plugins: {err}");
                    push_status(
                        &mut market_statuses,
                        claude_market_id,
                        claude_market_label,
                        MarketStatusType::Error,
                        Some(err),
                    );
                }
            }
        } else {
            push_status(
                &mut market_statuses,
                claude_market_id,
                claude_market_label,
                MarketStatusType::Online,
                None,
            );
        }

        let skillsllm_market_id = "skillsllm";
        let skillsllm_market_label = "SkillsLLM";
        if *enabled_markets.get(skillsllm_market_id).unwrap_or(&true) {
            let mut skillsllm_url = String::from("https://api.skills-llm.com/skill?sort=stars");
            if !query_param.is_empty() {
                skillsllm_url.push('&');
                skillsllm_url.push_str(&query_param);
            }
            skillsllm_url.push_str(&format!("&limit={limit}&offset={offset}"));

            match download_bytes(
                &skillsllm_url,
                &[
                    ("Accept", "application/json"),
                    ("X-GitHub-Api-Version", "2022-11-28"),
                    ("User-Agent", USER_AGENT),
                ],
            ) {
                Ok(buf) => {
                    if let Ok((parsed_skills, parsed_total)) =
                        parse_skillsllm(&buf, skillsllm_market_id, skillsllm_market_label)
                    {
                        total += parsed_total;
                        skills.extend(parsed_skills);
                        push_status(
                            &mut market_statuses,
                            skillsllm_market_id,
                            skillsllm_market_label,
                            MarketStatusType::Online,
                            None,
                        );
                    } else {
                        push_status(
                            &mut market_statuses,
                            skillsllm_market_id,
                            skillsllm_market_label,
                            MarketStatusType::Error,
                            Some("Failed to parse response".to_string()),
                        );
                    }
                }
                Err(err) => {
                    println!("Error fetching from SkillsLLM: {err}");
                    push_status(
                        &mut market_statuses,
                        skillsllm_market_id,
                        skillsllm_market_label,
                        MarketStatusType::Error,
                        Some(err),
                    );
                }
            }
        } else {
            push_status(
                &mut market_statuses,
                skillsllm_market_id,
                skillsllm_market_label,
                MarketStatusType::Online,
                None,
            );
        }

        let skills_hub_market_id = "skills-hub";
        let skills_hub_market_label = "Skills Hub";
        if *enabled_markets.get(skills_hub_market_id).unwrap_or(&true) {
            match download_bytes(
                SKILLS_HUB_INDEX_URL,
                &[("Accept", "application/json"), ("User-Agent", USER_AGENT)],
            ) {
                Ok(buf) => match parse_skills_hub(
                    &buf,
                    skills_hub_market_id,
                    skills_hub_market_label,
                    trimmed,
                    limit,
                    offset,
                ) {
                    Ok((parsed_skills, parsed_total)) => {
                        total += parsed_total;
                        skills.extend(parsed_skills);
                        push_status(
                            &mut market_statuses,
                            skills_hub_market_id,
                            skills_hub_market_label,
                            MarketStatusType::Online,
                            None,
                        );
                    }
                    Err(err) => push_status(
                        &mut market_statuses,
                        skills_hub_market_id,
                        skills_hub_market_label,
                        MarketStatusType::Error,
                        Some(err),
                    ),
                },
                Err(err) => {
                    println!("Error fetching from Skills Hub: {err}");
                    push_status(
                        &mut market_statuses,
                        skills_hub_market_id,
                        skills_hub_market_label,
                        MarketStatusType::Error,
                        Some(err),
                    );
                }
            }
        } else {
            push_status(
                &mut market_statuses,
                skills_hub_market_id,
                skills_hub_market_label,
                MarketStatusType::Online,
                None,
            );
        }

        let skillsmp_market_id = "skillsmp";
        let skillsmp_market_label = "SkillsMP";
        if *enabled_markets.get(skillsmp_market_id).unwrap_or(&false) {
            if let Some(api_key) = api_keys.get(skillsmp_market_id).filter(|key| !key.is_empty()) {
                let skillsmp_page = (offset / limit).saturating_add(1);
                let skillsmp_url = format!(
                    "https://skillsmp.com/api/v1/skills/search?q={}&page={skillsmp_page}&limit={limit}",
                    urlencoding::encode(trimmed)
                );

                let auth_header = format!("Bearer {api_key}");
                match download_bytes(
                    &skillsmp_url,
                    &[
                        ("Accept", "application/json"),
                        ("User-Agent", USER_AGENT),
                        ("Authorization", &auth_header),
                    ],
                ) {
                    Ok(buf) => {
                        if let Ok((parsed_skills, parsed_total)) =
                            parse_skillsmp(&buf, skillsmp_market_id, skillsmp_market_label)
                        {
                            total += parsed_total;
                            skills.extend(parsed_skills);
                            push_status(
                                &mut market_statuses,
                                skillsmp_market_id,
                                skillsmp_market_label,
                                MarketStatusType::Online,
                                None,
                            );
                        } else {
                            push_status(
                                &mut market_statuses,
                                skillsmp_market_id,
                                skillsmp_market_label,
                                MarketStatusType::Error,
                                Some("Failed to parse response".to_string()),
                            );
                        }
                    }
                    Err(err) => {
                        println!("Error fetching from SkillsMP: {err}");
                        push_status(
                            &mut market_statuses,
                            skillsmp_market_id,
                            skillsmp_market_label,
                            MarketStatusType::Error,
                            Some(err),
                        );
                    }
                }
            } else {
                push_status(
                    &mut market_statuses,
                    skillsmp_market_id,
                    skillsmp_market_label,
                    MarketStatusType::NeedsKey,
                    None,
                );
            }
        } else {
            push_status(
                &mut market_statuses,
                skillsmp_market_id,
                skillsmp_market_label,
                MarketStatusType::NeedsKey,
                None,
            );
        }

        Ok(RemoteSkillsViewResponse {
            skills,
            total,
            limit,
            offset,
            market_statuses,
        })
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub async fn download_marketplace_skill(
    request: DownloadRequest,
) -> Result<DownloadResult, String> {
    if request.install_base_dir.trim().is_empty() {
        return Err("安装目录不能为空".to_string());
    }

    let source_url = request.source_url.clone();
    let skill_name = request.skill_name.clone();
    let install_base_dir = PathBuf::from(&request.install_base_dir);

    let result = tauri::async_runtime::spawn_blocking(move || {
        download_skill_to_dir(&source_url, &skill_name, &install_base_dir, false)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e| e.to_string())?;

    Ok(DownloadResult {
        installed_path: result.display().to_string(),
    })
}

#[tauri::command]
pub async fn update_marketplace_skill(request: DownloadRequest) -> Result<DownloadResult, String> {
    if request.install_base_dir.trim().is_empty() {
        return Err("安装目录不能为空".to_string());
    }
    if request.source_url.trim().is_empty() {
        return Err("缺少有效的源码地址 (Source URL)，无法更新".to_string());
    }

    let source_url = request.source_url.clone();
    let skill_name = request.skill_name.clone();
    let install_base_dir = PathBuf::from(&request.install_base_dir);

    let result = tauri::async_runtime::spawn_blocking(move || {
        download_skill_to_dir(&source_url, &skill_name, &install_base_dir, true)
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e| e.to_string())?;

    Ok(DownloadResult {
        installed_path: result.display().to_string(),
    })
}

#[cfg(test)]
mod tests {
    use super::parse_skills_hub;

    #[test]
    fn filters_and_maps_skills_hub_results() {
        let raw = br#"
        {
          "updated_at": "2026-03-27T01:05:42.621Z",
          "total": 2,
          "skills": [
            {
              "slug": "docx",
              "name": "docx",
              "summary": "Manipulate Word documents",
              "downloads": 0,
              "stars": 10,
              "category": "ai-assistant",
              "tags": ["agent-skills", "documents"],
              "source_url": "https://github.com/anthropics/skills/tree/main/skills/docx"
            },
            {
              "slug": "bug-hunter",
              "name": "bug-hunter",
              "summary": "Debug production issues",
              "downloads": 3,
              "stars": 20,
              "category": "development",
              "tags": ["debugging"],
              "source_url": "https://github.com/acme/skills/tree/main/skills/bug-hunter"
            }
          ]
        }
        "#;

        let (skills, total) = parse_skills_hub(raw, "skills-hub", "Skills Hub", "doc", 20, 0).unwrap();
        assert_eq!(total, 1);
        assert_eq!(skills.len(), 1);
        assert_eq!(skills[0].id, "skills-hub:docx");
        assert_eq!(skills[0].author, "anthropics");
        assert_eq!(skills[0].market_label, "Skills Hub");
    }
}
