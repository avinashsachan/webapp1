const timestampInput = document.querySelector("#timestamp-input");
const dateInput = document.querySelector("#date-input");
const output = document.querySelector("#conversion-output");
const outputValue = document.querySelector("#output-value");
const outputDetail = document.querySelector("#output-detail");

function showResult(value, detail, isError = false) {
  output.classList.toggle("has-error", isError);
  outputValue.textContent = value;
  outputDetail.textContent = detail;
}

function dateToInputValue(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function timestampToDate() {
  const raw = timestampInput.value.trim();
  const value = Number(raw);
  if (!raw || !Number.isFinite(value)) {
    showResult("Invalid timestamp", "Enter a number in seconds or milliseconds.", true);
    return;
  }

  const milliseconds = Math.abs(value) >= 1e11 ? value : value * 1000;
  const date = new Date(milliseconds);
  if (Number.isNaN(date.getTime())) {
    showResult("Invalid timestamp", "The value is outside the supported date range.", true);
    return;
  }

  dateInput.value = dateToInputValue(date);
  showResult(date.toLocaleString(), `${Math.round(milliseconds / 1000)} seconds since 1 January 1970.`);
}

function dateToTimestamp() {
  if (!dateInput.value) {
    showResult("Select a date", "Choose a date and time to convert.", true);
    return;
  }

  const date = new Date(dateInput.value);
  const seconds = Math.floor(date.getTime() / 1000);
  timestampInput.value = String(seconds);
  showResult(String(seconds), date.toLocaleString());
}

document.querySelector("#to-date-button").addEventListener("click", timestampToDate);
document.querySelector("#to-timestamp-button").addEventListener("click", dateToTimestamp);
document.querySelector("#now-button").addEventListener("click", () => {
  const now = Math.floor(Date.now() / 1000);
  timestampInput.value = String(now);
  timestampToDate();
});

timestampInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") timestampToDate();
});

dateInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") dateToTimestamp();
});
