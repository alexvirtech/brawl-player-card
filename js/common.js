// common.js — Shared helpers used by every mini-app

// Remember the last Player Tag so the child doesn't have to type it every time
function getLastTag() {
  return localStorage.getItem("brawl-tag") || ""
}

function saveTag(tag) {
  localStorage.setItem("brawl-tag", tag)
}

// Clean up a Player Tag: remove spaces, make uppercase, add # if missing
function cleanTag(tag) {
  tag = tag.trim().toUpperCase()
  if (tag && !tag.startsWith("#")) {
    tag = "#" + tag
  }
  return tag
}

// Prevent HTML injection from player names
function escapeHtml(text) {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}

// Set up the tag input: load saved tag, handle button click and Enter key
function setupTagInput(inputId, buttonId, onLoad) {
  const input = document.getElementById(inputId)
  const button = document.getElementById(buttonId)

  // Load the saved tag into the input
  const saved = getLastTag()
  if (saved) {
    input.value = saved
  }

  // When the button is clicked
  button.addEventListener("click", () => {
    const tag = cleanTag(input.value)
    if (!tag) {
      showError("Please enter a Player Tag!")
      return
    }
    input.value = tag
    saveTag(tag)
    onLoad(tag)
  })

  // Also load when Enter is pressed
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") button.click()
  })
}

// Show and hide the loading spinner
function showLoading() {
  document.getElementById("loading").classList.remove("hidden")
  document.getElementById("error").classList.add("hidden")
  document.getElementById("result").classList.add("hidden")
}

function hideLoading() {
  document.getElementById("loading").classList.add("hidden")
}

// Show a friendly error message
function showError(message) {
  hideLoading()
  const el = document.getElementById("error")
  el.textContent = message
  el.classList.remove("hidden")
}

// Show the result area
function showResult() {
  hideLoading()
  document.getElementById("result").classList.remove("hidden")
}
