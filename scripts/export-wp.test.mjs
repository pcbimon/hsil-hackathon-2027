import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assetRefs, bodyOf, convertBody, cssAssetRefs, extractMeta, phpString, renderMeta } from './export-wp.mjs';

const asset = (p) => `<?php echo esc_url( int_landing_asset( '${p}' ) ); ?>`;
const lang = (l) => `<?php echo esc_url( int_landing_lang_url( '${l}' ) ); ?>`;

test('rewrites asset src/href for TH and EN prefixes', () => {
  assert.equal(convertBody('<img src="assets/a.png" alt="">', { prefix: '' }), `<img src="${asset('assets/a.png')}" alt="">`);
  assert.equal(convertBody('<a href="../assets/b.pdf">x</a>', { prefix: '../' }), `<a href="${asset('assets/b.pdf')}">x</a>`);
});

test('leaves anchors, mailto, tel and https links untouched', () => {
  const html = '<a href="#main">a</a><a href="mailto:x@y.z">b</a><a href="tel:+66">c</a><a href="https://x.org/">d</a>';
  assert.equal(convertBody(html, { prefix: '' }), html);
});

test('rewrites data-lang-link hrefs', () => {
  assert.equal(
    convertBody('<a href="en/" data-lang-link="en" hreflang="en">EN</a>', { prefix: '' }),
    `<a href="${lang('en')}" data-lang-link="en" hreflang="en">EN</a>`,
  );
  assert.equal(
    convertBody('<a href="../" data-lang-link="th" hreflang="th">TH</a>', { prefix: '../' }),
    `<a href="${lang('th')}" data-lang-link="th" hreflang="th">TH</a>`,
  );
});

test('fails on a language link without data-lang-link', () => {
  assert.throws(() => convertBody('<a href="en/" hreflang="en">EN</a>', { prefix: '' }), /language link without data-lang-link/);
  assert.throws(() => convertBody('<a href="../">TH</a>', { prefix: '../' }), /language link without data-lang-link/);
  assert.doesNotThrow(() => convertBody('<a href="https://news.example/th" hreflang="th">x</a>', { prefix: '../' }));
});

test('fails on root-relative paths but allows protocol-relative', () => {
  assert.throws(() => convertBody('<img src="/assets/a.png">', { prefix: '' }), /root-relative/);
  assert.throws(() => convertBody('<a href="/en/">x</a>', { prefix: '' }), /root-relative/);
  assert.doesNotThrow(() => convertBody('<img src="//cdn.example/a.png">', { prefix: '' }));
});

test('fails on inline script or style in body', () => {
  assert.throws(() => convertBody('<script>alert(1)</script>', { prefix: '' }), /inline <script>/);
  assert.throws(() => convertBody('<style>p{}</style>', { prefix: '' }), /inline <style>/);
  assert.doesNotThrow(() => convertBody('<script src="js/x.js"></script>', { prefix: '' }));
});

test('fails on a missing asset', () => {
  assert.throws(() => convertBody('<img src="assets/nope.png">', { prefix: '', exists: () => false }), /missing file assets\/nope.png/);
});

test('bodyOf returns the trimmed inner body', () => {
  assert.equal(bodyOf('<html><body class="x">\n\n<p>a</p>\n\n</body></html>'), '<p>a</p>');
});

test('extracts meta from head and converts preload paths', () => {
  const html = `<head><title>T &amp; A</title><meta name="description" content="It&#39;s D">
<link rel="preload" href="../assets/hero.webp" as="image">
<link href="https://fonts.googleapis.com/css2?family=A&amp;display=swap" rel="stylesheet">
<link rel="stylesheet" href="../css/styles.css"></head><body></body>`;
  assert.deepEqual(extractMeta(html, { prefix: '../' }), {
    title: 'T & A',
    description: "It's D",
    fonts: 'https://fonts.googleapis.com/css2?family=A&display=swap',
    preload: ['assets/hero.webp'],
    image: '',
  });
  assert.throws(() => extractMeta('<head></head>', { prefix: '' }), /no <title>/);
});

const ogHead = (img) => `<head><title>T</title><meta name="description" content="D">
<meta property="og:image" content="${img}">
<link href="https://fonts.googleapis.com/css2?family=A" rel="stylesheet"></head>`;

test('extracts og:image as a landing-relative path', () => {
  assert.equal(extractMeta(ogHead('../assets/og-image.jpg'), { prefix: '../', exists: () => true }).image, 'assets/og-image.jpg');
  assert.equal(extractMeta(ogHead('assets/og-image.jpg'), { prefix: '', exists: () => true }).image, 'assets/og-image.jpg');
});

test('fails when og:image is missing on disk or not under assets/', () => {
  assert.throws(() => extractMeta(ogHead('assets/nope.jpg'), { prefix: '', exists: () => false }), /og:image file missing: assets\/nope.jpg/);
  assert.throws(() => extractMeta(ogHead('https://x.org/a.jpg'), { prefix: '', exists: () => true }), /og:image must be/);
});

test('renders meta with PHP single-quoted escaping', () => {
  assert.equal(phpString("a'b\\c"), "'a\\'b\\\\c'");
  const php = renderMeta({ title: "It's", description: 'd', fonts: 'f', preload: ['assets/x.webp'], image: 'assets/og.jpg' }, 'index.html');
  assert.match(php, /'title' {7}=> 'It\\'s',/);
  assert.match(php, /'preload' {5}=> array\( 'assets\/x.webp' \),/);
  assert.match(php, /'image' {7}=> 'assets\/og.jpg',/);
});

test('resolves stylesheet url() relative to css/', () => {
  assert.deepEqual(cssAssetRefs('a{background:url("../assets/hero.webp")} b{background:url(data:x)} c{x:url(#f)}'), ['assets/hero.webp']);
});

test('collects og:image from head as a referenced asset', () => {
  assert.deepEqual(assetRefs('<meta property="og:image" content="../assets/og.jpg"><img src="../assets/a.png">', '../'), ['assets/og.jpg', 'assets/a.png']);
});
