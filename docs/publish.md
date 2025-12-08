# Publishing to GitHub

## Prerequisites

Install GitHub CLI:
```bash
brew install gh
```

## Authentication

```bash
gh auth login
```

## Publish Script

Use the provided script:
```bash
./scripts/publish.sh
```

Or manually:
```bash
git add -A
git commit -m "Reorganize: move demos to demo/, docs to docs/, rename files"
git push origin main
gh repo view --web
```

## Repository Structure

After reorganization:
- All demos in `demo/`
- All docs in `docs/`
- File names: 3-12 chars, no dashes/underscores
- Makefile targets match file names

## GitHub Actions

Workflow file: `.github/workflows/publish.yml`

Runs on push to main branch:
- Installs dependencies
- Runs tests
- Builds project

