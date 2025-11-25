# SAGA Landing Page

A static, production-ready marketing page for **SAGA** by **ApnaSheher**, covering property and car rentals with a unified, trustworthy experience.

## Run locally
- Clone or download the repository.
- Open `index.html` directly in your browser, or serve the root with any static server (e.g., `python -m http.server`).

## Deploy on GitHub Pages
- Make the repository public and push the contents to the `main` branch.
- In the repository settings, enable GitHub Pages with the source set to the root (`/`).
- Ensure the included `CNAME` file is present and contains `saga.apnasheher.com`.

## DNS configuration
- Create a **CNAME** record with your DNS provider:
  - **Host**: `saga`
  - **Value**: `<github-username>.github.io`
- GitHub Pages will provision HTTPS automatically once DNS is active and the `CNAME` file is detected.
