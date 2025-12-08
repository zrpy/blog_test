const fs = require("fs");
const marked = require("marked");
const hljs = require("highlight.js");

marked.setOptions({
  highlight: (code) => hljs.highlightAuto(code).value
});

const template = fs.readFileSync("template.html", "utf-8");

if (!fs.existsSync("public")) fs.mkdirSync("public");

const mdFiles = fs.readdirSync(".").filter(f => f.endsWith(".md"));

for (const file of mdFiles) {
  const name = file.replace(".md", "");
  const md = fs.readFileSync(file, "utf-8");
  const htmlContent = marked.parse(md);

  const output = template
    .replace("{{TITLE}}", name)
    .replace("{{CONTENT}}", htmlContent);

  fs.writeFileSync(`public/${name}.html`, output);
  console.log(`Generated: public/${name}.html`);
}
