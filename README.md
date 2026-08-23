# DNC Website, deploy guide

This folder is the complete, self-contained DNC website, ready to publish on Netlify. No build step, no dependencies. Every page has its images and styles embedded, so the files here are all that is needed.

## What is in here

- 10 pages: index.html (home), about, what-we-do, approach, panjiia, impact, insights, partners, careers, contact.
- sitemap.xml, robots.txt, llms.txt (for search engines and AI systems).
- netlify.toml (publish settings and basic security headers).

## Deploy in two minutes (drag and drop)

1. Go to https://app.netlify.com and sign in (or create a free account).
2. On the "Sites" screen, drag this entire "DNC Website" folder onto the "Deploy" drop zone (the area that says "drag and drop your site folder here").
3. Netlify publishes it and gives you a temporary address like random-name.netlify.app. Open it to check everything works.

That is it. The site is live.

## Point dakantembe.com at it

1. In Netlify, open the site, then Domain settings, then "Add a custom domain", and enter dakantembe.com.
2. Netlify shows the DNS records to set. In your domain registrar (currently Wix DNS), update the records as instructed. Usually this means pointing the domain to Netlify's name servers, or adding the A record and CNAME Netlify gives you.
3. Netlify issues a free HTTPS certificate automatically once DNS resolves. This can take up to a few hours.

Note: the domain is currently managed by Wix. You will move the DNS to Netlify (or add Netlify's records at Wix). No content is lost; only where the domain points changes.

## Updating the site later

Replace the files in this folder with new versions and drag the folder onto Netlify again, or connect the folder to a Git repository for automatic deploys. The editable source lives in DNC/Active/Brand & Marketing/Website/dnc_site_v2.

## Notes

- The logo and favicon load from a hosted URL, so they work anywhere.
- All internal links use .html filenames and resolve correctly on Netlify.
- Contact email across the site: info@dakantembe.com
