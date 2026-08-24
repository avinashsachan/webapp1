const expressionElement = document.querySelector("#expression");
const resultElement = document.querySelector("#result");
const keys = document.querySelectorAll(".key");

let current = "0";
let stored = null;
let operator = null;
let waitingForOperand = false;
let expression = "";

const operatorLabels = { "/": "÷", "*": "×", "-": "−", "+": "+" };

function formatNumber(value) {
  if (!Number.isFinite(Number(value))) return "Error";
  const [integer, decimal] = String(value).split(".");
  const formattedInteger = Number(integer).toLocaleString("en-US");
  return decimal === undefined ? formattedInteger : `${formattedInteger}.${decimal}`;
}

function render() {
  resultElement.textContent = formatNumber(current);
  expressionElement.textContent = expression || "\u00a0";
}

function inputDigit(digit) {
  if (current === "Error" || waitingForOperand) {
    current = digit;
    waitingForOperand = false;
  } else {
    current = current === "0" ? digit : current + digit;
  }
  render();
}

function inputDecimal() {
  if (current === "Error" || waitingForOperand) {
    current = "0.";
    waitingForOperand = false;
  } else if (!current.includes(".")) {
    current += ".";
  }
  render();
}

function calculate(first, second, selectedOperator) {
  const left = Number(first);
  const right = Number(second);
  if (selectedOperator === "+") return left + right;
  if (selectedOperator === "-") return left - right;
  if (selectedOperator === "*") return left * right;
  if (selectedOperator === "/") return right === 0 ? NaN : left / right;
  return right;
}

function chooseOperator(nextOperator) {
  const inputValue = Number(current);
  if (current === "Error") return;

  if (stored !== null && operator && !waitingForOperand) {
    const calculated = calculate(stored, inputValue, operator);
    current = String(calculated);
    stored = calculated;
  } else {
    stored = inputValue;
  }

  operator = nextOperator;
  waitingForOperand = true;
  expression = `${formatNumber(stored)} ${operatorLabels[nextOperator]}`;
  render();
}

function equals() {
  if (operator === null || stored === null || current === "Error") return;
  const second = Number(current);
  const answer = calculate(stored, second, operator);
  expression = `${formatNumber(stored)} ${operatorLabels[operator]} ${formatNumber(second)} =`;
  current = String(answer);
  stored = null;
  operator = null;
  waitingForOperand = true;
  render();
}

function clear() {
  current = "0";
  stored = null;
  operator = null;
  waitingForOperand = false;
  expression = "";
  render();
}

function toggleSign() {
  if (current !== "0" && current !== "Error") current = String(Number(current) * -1);
  render();
}

function percent() {
  if (current !== "Error") current = String(Number(current) / 100);
  render();
}

function handleValue(value) {
  if (/\d/.test(value)) inputDigit(value);
  else if (value === ".") inputDecimal();
  else chooseOperator(value);
}

function pressKey(key) {
  key.classList.add("is-pressed");
  window.setTimeout(() => key.classList.remove("is-pressed"), 120);
}

keys.forEach((key) => {
  key.addEventListener("click", () => {
    const value = key.dataset.value;
    if (value) handleValue(value);
    else if (key.dataset.action === "equals") equals();
    else if (key.dataset.action === "clear") clear();
    else if (key.dataset.action === "sign") toggleSign();
    else if (key.dataset.action === "percent") percent();
  });
});

document.addEventListener("keydown", (event) => {
  const key = event.key;
  const matchingKey = [...keys].find(
    (button) => button.dataset.value === key || (key === "Enter" && button.dataset.action === "equals") ||
      (key === "Escape" && button.dataset.action === "clear"),
  );
  if (matchingKey) pressKey(matchingKey);

  if (/^\d$/.test(key) || key === ".") handleValue(key);
  else if (["+", "-", "*", "/"].includes(key)) handleValue(key);
  else if (key === "Enter" || key === "=") equals();
  else if (key === "Escape" || key === "Delete") clear();
  else if (key === "%") percent();
  else if (key === "Backspace" && current !== "Error" && !waitingForOperand) {
    current = current.length > 1 ? current.slice(0, -1) : "0";
    render();
  }
});

render();
