const hostname = "192.168.1.81";
const element = document.querySelector(".player");
const player = new BluOSPlayer(element, hostname);

const debugOutput = document.getElementById("debug-output");
const debugDate = document.getElementById("debug-date");

function renderDebug(text) {
  debugOutput.textContent = text;
  debugDate.textContent = new Date().toUTCString();
}

async function debugStatus() {
  const xml = await player.api.status();

  renderDebug(xml);

  // const parser = new DOMParser();
  // const doc = parser.parseFromString(xml, "application/xml");
  // const statusNode = doc.querySelector("status");
  // console.log(statusNode);

  // // Examples of how to access the XML data
  // console.debug("etag:", statusNode.getAttribute("etag"));
  // console.debug("album:", doc.getElementsByTagName("album")[0]).textContent;
  // console.debug("album:", statusNode.querySelector("album").textContent);
  // console.debug(
  //   "artist:",
  //   statusNode.querySelector("artist").childNodes[0].nodeValue
  // );
}

async function debugSyncStatus() {
  const xml = await player.api.query(`/SyncStatus`);

  renderDebug(xml);
}

async function debugCustomQuery(event) {
  event.preventDefault();

  const query = event.target.query.value;
  const xml = await player.api.query(query);

  renderDebug(xml);
}

// Debugging
// debugStatus();
// window.debug.showModal();
