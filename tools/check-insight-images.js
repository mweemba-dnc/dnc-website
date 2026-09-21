#!/usr/bin/env node
/*
 * DNC hard rule, Editorial Design Standard 2026-08-29:
 * every surface where a piece is seen BEFORE it is read must be a real
 * documentary photograph. That means the Insights listing card and the
 * Open Graph share image. Typographic-only or stat-only preview images,
 * and generated SVG thumbnails, are retired.
 *
 * This runs in the Netlify build. A failure stops the deploy, so a piece
 * that breaks the rule cannot reach the site.
 *
 * Retrofit allowlist: pieces published before the rule. Remove a slug from
 * this list once its card is rebuilt on a photograph. Do not add new slugs.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const LEGACY_CARD = new Set([
  'insight-food-loss-index.html',   // generated SVG thumbnail, predates the rule
]);
const LEGACY_OG = new Set([
  'insight-smallholders-invisible.html', // generic og-image.png, predates the rule
  'insight-food-loss-index.html',        // generic og-image.png, predates the rule
]);

// real pixel dimensions of a JPEG, read from its SOF marker, no dependencies
function jpegSize(file) {
  const b = fs.readFileSync(file);
  if (b[0] !== 0xFF || b[1] !== 0xD8) return null;
  let i = 2;
  while (i < b.length - 9) {
    if (b[i] !== 0xFF) { i++; continue; }
    const m = b[i + 1];
    if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC)
      return { height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) };
    i += 2 + b.readUInt16BE(i + 2);
  }
  return null;
}

const errors = [];
const warnings = [];
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

const insights = read('insights.html');

// every insight page the listing links to
const slugs = [...new Set([...insights.matchAll(/href="(insight-[a-z0-9-]+\.html)"/g)].map(m => m[1]))];
if (!slugs.length) errors.push('insights.html: no insight pages linked, the listing looks broken');

for (const slug of slugs) {
  // ---- 1. the listing card thumbnail ----
  const card = insights.match(new RegExp(`<a class="card" href="${slug.replace(/[.]/g, '\\.')}"[\\s\\S]*?</a>`));
  if (!card) { errors.push(`${slug}: linked from insights.html but no card markup found`); }
  else {
    const thumb = card[0].match(/<div class="lthumb"[\s\S]*?<\/div>/);
    const label = `${slug}: listing card`;
    if (!thumb) errors.push(`${label} has no .lthumb thumbnail`);
    else if (LEGACY_CARD.has(slug)) warnings.push(`${label} is a pre-rule treatment awaiting retrofit`);
    else if (/<svg/i.test(thumb[0]))
      errors.push(`${label} is a generated SVG. The hard rule requires a real documentary photograph.`);
    else {
      const img = thumb[0].match(/<img\b[^>]*>/i);
      if (!img) errors.push(`${label} has no <img>. The hard rule requires a real documentary photograph.`);
      else {
        const src = (img[0].match(/src="([^"]*)"/) || [])[1] || '';
        if (!/^data:image\/(jpeg|jpg)/i.test(src) && !/\.jpe?g$/i.test(src))
          errors.push(`${label} src is not a photograph (expected an inlined JPEG or a .jpg file, got "${src.slice(0, 40)}")`);
        const alt = (img[0].match(/alt="([^"]*)"/) || [])[1] || '';
        if (alt.trim().length < 15) errors.push(`${label} needs descriptive alt text (got "${alt}")`);
      }
    }
  }

  // ---- 2. the share image ----
  const page = read(slug);
  const label = `${slug}: share image`;
  const og = (page.match(/<meta property="og:image" content="([^"]*)"/) || [])[1];
  if (!og) errors.push(`${label} has no og:image`);
  else if (LEGACY_OG.has(slug)) warnings.push(`${label} is a pre-rule fallback awaiting retrofit`);
  else {
    const file = og.replace(/^https?:\/\/[^/]+\//, '');
    if (/^og-image\.(png|jpe?g)$/i.test(file))
      errors.push(`${label} falls back to the generic ${file}. Every Insight needs its own photograph at 1200x630.`);
    else if (!/\.jpe?g$/i.test(file))
      errors.push(`${label} is "${file}". A photographic share image is a JPEG; a PNG here usually means a rendered graphic.`);
    else if (!fs.existsSync(path.join(ROOT, file)))
      errors.push(`${label} points at ${file}, which is not in the repo`);
    const abs = path.join(ROOT, file);
    const dim = fs.existsSync(abs) ? jpegSize(abs) : null;
    if (!dim) warnings.push(`${label} could not be measured, dimensions not verified`);
    else {
      if (dim.width < 1200 || dim.height < 600)
        errors.push(`${label} is ${dim.width}x${dim.height}. A large share card needs at least 1200x600.`);
      for (const [tag, want] of [['og:image:width', dim.width], ['og:image:height', dim.height]]) {
        const got = (page.match(new RegExp(`<meta property="${tag}" content="([^"]*)"`)) || [])[1];
        if (got === undefined) errors.push(`${label} is missing ${tag}`);
        else if (Number(got) !== want)
          errors.push(`${label} declares ${tag}=${got} but the file is ${dim.width}x${dim.height}`);
      }
    }
    const tw = (page.match(/<meta name="twitter:image" content="([^"]*)"/) || [])[1];
    if (tw !== og) errors.push(`${label} twitter:image does not match og:image`);
  }
}

const say = s => process.stdout.write(s + '\n');
say(`\nDNC image rule: checked ${slugs.length} insight pages`);
warnings.forEach(w => say(`  pending retrofit: ${w}`));
if (errors.length) {
  say('\nBUILD STOPPED. The Editorial Design Standard hard rule (2026-08-29) is not met:\n');
  errors.forEach(e => say(`  x ${e}`));
  say('\nFix the image, or if this piece genuinely predates the rule add it to the retrofit');
  say('allowlist in tools/check-insight-images.js with a dated comment.\n');
  process.exit(1);
}
say('  all listing cards and share images are photograph-based\n');
