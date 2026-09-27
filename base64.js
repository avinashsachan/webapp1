const textInput = document.querySelector("#text-input");
const base64Input = document.querySelector("#base64-input");
const urlSafeCheckbox = document.querySelector("#url-safe-checkbox");
const output = document.querySelector("#conversion-output");
const outputValue = document.querySelector("#output-value");
const outputDetail = document.querySelector("#output-detail");
const copyBtn = document.querySelector("#copy-btn");
const encodeBtn = document.querySelector("#encode-btn");
const decodeBtn = document.querySelector("#decode-btn");
const sampleTextBtn = document.querySelector("#sample-text-btn");

let lastResult = "";

function showResult(value, detail, isError = false) {
  output.classList.toggle("has-error", isError);
  outputValue.textContent = value;
  outputDetail.textContent = detail;
  if (!isError) {
    lastResult = value;
  }
}

function utf8ToBase64(str, isUrlSafe = false) {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  const len = bytes.length;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  let base64 = btoa(binary);
  if (isUrlSafe) {
    base64 = base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  return { base64, byteCount: bytes.length };
}

function base64ToUtf8(base64Str) {
  let cleaned = base64Str.trim().replace(/\s+/g, "");
  // Convert URL-safe base64 to standard base64
  cleaned = cleaned.replace(/-/g, "+").replace(/_/g, "/");
  // Pad with '=' if needed
  while (cleaned.length % 4 !== 0) {
    cleaned += "=";
  }

  // Validate characters
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleaned)) {
    throw new Error("Contains invalid Base64 characters");
  }

  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  const decoder = new TextDecoder("utf-8", { fatal: true });
  return { text: decoder.decode(bytes), byteCount: bytes.length };
}

function handleEncode() {
  const text = textInput.value;
  if (!text) {
    showResult("Empty input", "Enter text to encode into Base64.", true);
    return;
  }

  try {
    const isUrlSafe = urlSafeCheckbox.checked;
    const { base64, byteCount } = utf8ToBase64(text, isUrlSafe);
    base64Input.value = base64;
    showResult(
      base64,
      `Encoded ${text.length} characters (${byteCount} bytes) ${isUrlSafe ? "in URL-safe format" : "in standard format"}.`
    );
  } catch (err) {
    showResult("Encoding error", err.message || "Failed to encode text.", true);
  }
}

function handleDecode() {
  const raw = base64Input.value;
  if (!raw.trim()) {
    showResult("Empty input", "Enter a Base64 string to decode into text.", true);
    return;
  }

  try {
    const { text, byteCount } = base64ToUtf8(raw);
    textInput.value = text;
    showResult(
      text,
      `Decoded successfully (${byteCount} bytes, ${text.length} characters).`
    );
  } catch (err) {
    showResult("Invalid Base64", "The input is not a valid Base64 string or valid UTF-8 sequence.", true);
  }
}

async function handleCopy() {
  if (!lastResult) {
    return;
  }

  try {
    await navigator.clipboard.writeText(lastResult);
    const originalText = copyBtn.textContent;
    copyBtn.textContent = "Copied!";
    setTimeout(() => {
      copyBtn.textContent = originalText;
    }, 1500);
  } catch {
    // Fallback if clipboard API is restricted
    const tempInput = document.createElement("textarea");
    tempInput.value = lastResult;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand("copy");
    document.body.removeChild(tempInput);
    const originalText = copyBtn.textContent;
    copyBtn.textContent = "Copied!";
    setTimeout(() => {
      copyBtn.textContent = originalText;
    }, 1500);
  }
}

encodeBtn.addEventListener("click", handleEncode);
decodeBtn.addEventListener("click", handleDecode);
copyBtn.addEventListener("click", handleCopy);

sampleTextBtn.addEventListener("click", () => {
  textInput.value = "Hello, GNOC Suite! 🚀";
  handleEncode();
});

urlSafeCheckbox.addEventListener("change", () => {
  if (textInput.value) {
    handleEncode();
  }
});
