const jsonInput = document.querySelector("#json-input");
const yamlOutput = document.querySelector("#yaml-output");
const output = document.querySelector("#conversion-output");
const outputValue = document.querySelector("#output-value");
const outputDetail = document.querySelector("#output-detail");
const copyBtn = document.querySelector("#copy-btn");

function showResult(value, detail, isError = false) {
  output.classList.toggle("has-error", isError);
  outputValue.textContent = value;
  outputDetail.textContent = detail;
}

function quote(value) {
  return JSON.stringify(value);
}

function scalar(value) {
  if (value === null) return "null";
  if (typeof value === "string") return quote(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

function key(value) {
  return /^[A-Za-z_][A-Za-z0-9_-]*$/.test(value) ? value : quote(value);
}

function toYaml(value, level = 0) {
  const indent = "  ".repeat(level);
  if (value === null || typeof value !== "object") return scalar(value);

  const entries = Array.isArray(value) ? value : Object.entries(value);
  if (entries.length === 0) return Array.isArray(value) ? "[]" : "{}";

  return entries.map((entry) => {
    if (Array.isArray(value)) {
      const item = entry;
      if (item !== null && typeof item === "object" && Object.keys(item).length > 0) {
        const nested = toYaml(item, level + 1);
        const lines = nested.split("\n");
        return `${indent}- ${lines[0].trimStart()}\n${lines.slice(1).join("\n")}`;
      }
      return `${indent}- ${toYaml(item, level + 1)}`;
    }

    const [name, item] = entry;
    if (item !== null && typeof item === "object" && Object.keys(item).length > 0) {
      return `${indent}${key(name)}:\n${toYaml(item, level + 1)}`;
    }
    return `${indent}${key(name)}: ${toYaml(item, level + 1)}`;
  }).join("\n");
}

function stripComment(value) {
  let quoteChar = null;
  for (let i = 0; i < value.length; i += 1) {
    if ((value[i] === "\"" || value[i] === "'") && value[i - 1] !== "\\") {
      quoteChar = quoteChar === value[i] ? null : (quoteChar || value[i]);
    }
    if (value[i] === "#" && !quoteChar && (i === 0 || /\s/.test(value[i - 1]))) return value.slice(0, i).trimEnd();
  }
  return value;
}

function parseScalar(value) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("\"") || trimmed.startsWith("'")) {
    if (trimmed.startsWith("\"")) return JSON.parse(trimmed);
    return trimmed.slice(1, -1).replace(/''/g, "'");
  }
  if (trimmed === "null" || trimmed === "~") return null;
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:e[+-]?\d+)?$/i.test(trimmed)) return Number(trimmed);
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) return JSON.parse(trimmed);
  return trimmed;
}

function splitPair(value) {
  let quoteChar = null;
  for (let i = 0; i < value.length; i += 1) {
    if ((value[i] === "\"" || value[i] === "'") && value[i - 1] !== "\\") quoteChar = quoteChar === value[i] ? null : (quoteChar || value[i]);
    if (value[i] === ":" && !quoteChar) return [value.slice(0, i).trim(), value.slice(i + 1).trim()];
  }
  return null;
}

function fromYaml(raw) {
  const lines = raw.split(/\r?\n/).map((line, index) => {
    if (/\t/.test(line)) throw new Error(`Tabs are not supported (line ${index + 1}).`);
    const text = stripComment(line.trimStart());
    return { indent: line.length - line.trimStart().length, text };
  }).filter((line) => line.text);
  if (!lines.length) return null;
  let position = 0;

  function parseBlock(indent) {
    if (!lines[position] || lines[position].indent !== indent) throw new Error(`Unexpected indentation near line ${position + 1}.`);
    return lines[position].text.startsWith("-") ? parseSequence(indent) : parseMapping(indent);
  }

  function parseValue(value, indent) {
    if (value) return parseScalar(value);
    if (lines[position] && lines[position].indent > indent) return parseBlock(lines[position].indent);
    return null;
  }

  function parseMapping(indent, target = {}) {
    while (position < lines.length && lines[position].indent === indent && !lines[position].text.startsWith("-")) {
      const line = lines[position++];
      const pair = splitPair(line.text);
      if (!pair || !pair[0]) throw new Error(`Expected a key/value pair near line ${position}.`);
      target[String(parseScalar(pair[0]))] = parseValue(pair[1], indent);
    }
    return target;
  }

  function parseSequence(indent) {
    const result = [];
    while (position < lines.length && lines[position].indent === indent && lines[position].text.startsWith("-")) {
      const remainder = lines[position++].text.slice(1).trim();
      if (!remainder) {
        result.push(parseValue("", indent));
        continue;
      }
      const pair = splitPair(remainder);
      if (!pair) {
        result.push(parseScalar(remainder));
        continue;
      }
      const item = {};
      item[String(parseScalar(pair[0]))] = parseValue(pair[1], indent + 2);
      if (lines[position] && lines[position].indent === indent + 2 && !lines[position].text.startsWith("-")) parseMapping(indent + 2, item);
      result.push(item);
    }
    return result;
  }

  const result = parseBlock(lines[0].indent);
  if (position !== lines.length) throw new Error(`Unexpected indentation near line ${position + 1}.`);
  return result;
}

function convertJson() {
  const raw = jsonInput.value.trim();
  if (!raw) {
    yamlOutput.value = "";
    showResult("Empty input", "Enter JSON to convert into YAML.", true);
    return;
  }

  try {
    const value = JSON.parse(raw);
    yamlOutput.value = toYaml(value);
    showResult("Valid JSON", "Converted successfully to YAML.");
  } catch (error) {
    yamlOutput.value = "";
    showResult("Invalid JSON", error.message || "Check the JSON syntax and try again.", true);
  }
}

function convertYaml() {
  const raw = jsonInput.value.trim();
  if (!raw) {
    yamlOutput.value = "";
    showResult("Empty input", "Enter YAML to convert into JSON.", true);
    return;
  }
  try {
    yamlOutput.value = JSON.stringify(fromYaml(raw), null, 2);
    showResult("Valid YAML", "Converted successfully to formatted JSON.");
  } catch (error) {
    yamlOutput.value = "";
    showResult("Invalid YAML", error.message || "Check the YAML syntax and try again.", true);
  }
}

async function copyOutput() {
  if (!yamlOutput.value) return;
  try {
    await navigator.clipboard.writeText(yamlOutput.value);
  } catch {
    yamlOutput.focus();
    yamlOutput.select();
    document.execCommand("copy");
    yamlOutput.setSelectionRange(0, 0);
  }
  const originalText = copyBtn.textContent;
  copyBtn.textContent = "Copied!";
  setTimeout(() => { copyBtn.textContent = originalText; }, 1500);
}

document.querySelector("#convert-btn").addEventListener("click", convertJson);
document.querySelector("#yaml-to-json-btn").addEventListener("click", convertYaml);
copyBtn.addEventListener("click", copyOutput);
document.querySelector("#sample-json-btn").addEventListener("click", () => {
  jsonInput.value = JSON.stringify({
    name: "GNOC Suite",
    version: 1,
    features: ["calculator", "timestamp", "base64"],
    browserOnly: true,
  }, null, 2);
  convertJson();
});

jsonInput.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") convertJson();
});
