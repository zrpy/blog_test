const fs = require('fs');
const path = require('path');
const marked = require('marked');
const hljs = require('highlight.js');
const yaml = require('js-yaml');

marked.setOptions({
  highlight: (code) => hljs.highlightAuto(code).value
});

function readFrontMatter(text){
  const fmRegex = /^---\n([\s\S]*?)\n---\n?/;
  const m = text.match(fmRegex);
  if(!m) return {fm:null, body:text};
  try{
    const fm = yaml.load(m[1]);
    const body = text.slice(m[0].length);
    return {fm, body};
  }catch(e){
    console.warn('YAML parse error', e);
    return {fm:null, body:text};
  }
}

const template = fs.readFileSync('template.html','utf8');
const indexTemplate = fs.readFileSync('index_template.html','utf8');

if(!fs.existsSync('public')) fs.mkdirSync('public');
if(!fs.existsSync('public','mode')){} // noop
if(!fs.existsSync('public/posts')) fs.mkdirSync('public/posts',{recursive:true});

let articles = [];

// scan root .md and articles/ directory
const mdPaths = [];

// root md
for(const f of fs.readdirSync('.')){
  if(f.endsWith('.md')) mdPaths.push(f);
}
// articles directory
if(fs.existsSync('articles')) {
  for(const f of fs.readdirSync('articles')){
    if(f.endsWith('.md')) mdPaths.push(path.join('articles', f));
  }
}

for(const mdPath of mdPaths){
  const raw = fs.readFileSync(mdPath, 'utf8');
  const {fm, body} = readFrontMatter(raw);
  const html = marked.parse(body);
  const slug = path.basename(mdPath, '.md');
  const title = (fm && fm.title) ? fm.title : slug;
  const date = (fm && fm.date) ? fm.date : (new Date()).toISOString().slice(0,10);
  const tags = (fm && fm.tags) ? fm.tags : [];
  const thumbnail = (fm && fm.thumbnail) ? fm.thumbnail : 'https://via.placeholder.com/800x450?text='+encodeURIComponent(title);
  const excerpt = (fm && fm.excerpt) ? fm.excerpt : body.replace(/\n/g,' ').slice(0,160);

  // generate article HTML
  const contentWrapped = html;
  const output = template
    .replace(/{{TITLE}}/g, escapeHtml(title))
    .replace(/{{CONTENT}}/g, contentWrapped)
    .replace(/{{DESCRIPTION}}/g, escapeHtml(excerpt))
    .replace(/{{THUMBNAIL}}/g, thumbnail);

  const outPath = path.join('public','posts', slug + '.html');
  fs.writeFileSync(outPath, output, 'utf8');
  console.log('Generated', outPath);

  articles.push({
    title, date, tags, excerpt: excerpt.slice(0,120),
    thumbnail, url: 'posts/' + slug + '.html'
  });
}

// sort by date desc
articles.sort((a,b) => (a.date < b.date) ? 1 : -1);

// generate index.html
const indexHtml = indexTemplate.replace('{{ARTICLES_JSON}}', JSON.stringify(articles, null, 2));
fs.writeFileSync(path.join('public','index.html'), indexHtml, 'utf8');
console.log('Generated public/index.html');

function escapeHtml(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
