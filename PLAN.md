# 🪐 GitPulse — Master Blueprint & Collaborator Dossier

This document contains everything you need to copy-paste when switching over to **GitPulse**: all 3 contributor profiles, exact co-author git trailers, the architectural blueprint, and the commit roadmap to unlock **Pair Extraordinaire (Silver `x2` & Gold)**.

---

## 👥 1. The 3 Collaborator Profiles

Keep these exact usernames and emails ready:

| Role | GitHub Username | Email | Purpose |
| :--- | :--- | :--- | :--- |
| **Project Lead & Owner** | `@Vivek-k001` | `vk3699010@gmail.com` | Repo Owner, primary committer |
| **DevOps & Architecture** | `@Vivek-devopsys` | `vivek.devopsys@gmail.com` | Co-Author, PR reviewer |
| **Frontend & 3D WebGL** | `@guywhonameddonglee` | `pitbullnamedcupcake03@gmail.com` | Co-Author, UI contributor |

---

## 📋 2. Exact Co-Author Commit Trailer (Copy-Paste)

Whenever committing in `GitPulse`, **leave an empty line** after the commit subject/description and append this exact block:

```text
Co-authored-by: Vivek-devopsys <vivek.devopsys@gmail.com>
Co-authored-by: guywhonameddonglee <pitbullnamedcupcake03@gmail.com>
```

### Full Commit Command Example:
```bash
git commit -m "feat(galaxy): implement Three.js 3D language orb and orbit controls

Co-authored-by: Vivek-devopsys <vivek.devopsys@gmail.com>
Co-authored-by: guywhonameddonglee <pitbullnamedcupcake03@gmail.com>"
```

> [!IMPORTANT]
> GitHub requires the empty line directly above `Co-authored-by:` for the parser to register the co-authors on the default branch (`main`).

---

## 🎯 3. Badge Objective: Pair Extraordinaire (🫛)

- **Current Status**: 🥉 Bronze / Base (1 co-authored commit)
- **Target 1 (Silver / `x2`)**: **10 co-authored commits** on `main`
- **Target 2 (Gold / `x3`)**: **24 to 48 co-authored commits** on `main`

---

## 🏗️ 4. GitPulse Architecture & Feature Plan

GitPulse is a 100% client-side, zero-telemetry 3D repository inspector that queries GitHub's public REST API (`https://api.github.com`).

### Core Modules:
1. **🪐 3D Codebase Galaxy (Three.js)**:
   - Queries `GET /repos/{owner}/{repo}/languages`.
   - Generates an interactive rotating 3D particle orb in WebGL.
   - Language colors match official GitHub language colors with particle density scaled by byte count.
   - Interactive orbit controls (drag to rotate, pinch/wheel to zoom).

2. **🕒 24×7 Commit Punchcard Heatmap**:
   - Queries `GET /repos/{owner}/{repo}/stats/punch_card`.
   - Renders a 7-day × 24-hour bubble grid revealing peak engineering hours and weekly cadence.

3. **👥 Contributor Constellation Network (D3.js)**:
   - Queries `GET /repos/{owner}/{repo}/contributors`.
   - Physics-driven force-directed graph with contributor avatars as nodes connected by gravitational pull based on commit volume.

4. **🏷️ README Share Card & Social Badge Studio**:
   - Generates high-DPI raster preview cards and Markdown embed snippets (`![GitPulse](...)`) for direct pasting into repository READMEs.

5. **⚡ GitHub Rate-Limit Token Modal**:
   - Allows users to optionally provide a personal access token (stored strictly in `localStorage`) to bypass the 60 req/hr public rate limit.

---

## 🛣️ 5. Step-by-Step Commit Roadmap (12 Co-Authored Commits)

By following this roadmap, you hit **12 co-authored commits** on `main`, immediately blowing past the **10-commit threshold** for **Silver `x2`**:

1. `chore: initialize repository scaffold with MIT license and .gitignore`
2. `docs: add comprehensive README with architecture overview, demo badge and contributor list`
3. `feat(core): setup responsive obsidian layout, glassmorphic navbar and repository search bar`
4. `feat(api): create github rest client with caching and personal access token support`
5. `feat(galaxy): integrate Three.js canvas and interactive 3D particle universe`
6. `feat(galaxy): implement language-specific color mapping and orbit controls`
7. `feat(punchcard): add 24x7 commit distribution punchcard heatmap module`
8. `feat(network): implement D3.js force-directed contributor constellation graph`
9. `feat(cards): add 1-click high-DPI social card and markdown badge generator`
10. `feat(ui): add quick repository presets (e.g. torvalds/linux, facebook/react, OmniConvert)`
11. `ci: add GitHub Actions workflow for automated deployment to GitHub Pages`
12. `refactor: optimize WebGL draw calls and add keyboard navigation shortcuts`

---

## 🚀 6. Quick Start Commands When Switching

When you switch to the `GitPulse` folder in your terminal:

```bash
cd C:\Users\User\Documents\GitPulse
git remote -v
# Ensure remote is origin -> https://github.com/Vivek-k001/GitPulse.git
```
