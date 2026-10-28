# SAGA Landing Page

A static, production-ready marketing page for **SAGA** by **ApnaSheher**, covering property and car rentals with a unified, trustworthy experience.

## Run locally
- Clone or download the repository.
- Open `index.html` directly in your browser, or serve the root with any static server (e.g., `python -m http.server`).

## Deploy on GitHub Pages
- Make the repository public and push the contents to the `main` branch.
- In the repository settings, enable GitHub Pages with the source set to the root (`/`).
- Ensure the included `CNAME` file is present and contains `spot.apnasheher.com`.

## DNS configuration
- Create a **CNAME** record with your DNS provider:
  - **Host**: `spot`
  - **Value**: `<github-username>.github.io`
- GitHub Pages will provision HTTPS automatically once DNS is active and the `CNAME` file is detected.

## Individual property links

`/property/?propertyId=<encoded-id>` serves a real static directory-index page on GitHub
Pages. It offers an app-open action, a Google Play install button, and a copyable property
reference without fetching listing data. See [PROPERTY_SHARING.md](PROPERTY_SHARING.md)
for the Android contract, tests, and deployment sequence.
