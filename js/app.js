const host = "http://192.168.1.81:11000";
const player = new NodePlayer(host);

const debugOutput = document.getElementById("debug-output");

function renderDebug(text) {
  debugOutput.textContent = text;
}

async function debugStatus(timeout = 100, etag = null) {
  const xml = await player.fetch(`/Status?timeout=${timeout}`);

  renderDebug(xml);

  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");

  const statusNode = doc.querySelector("status");
  console.log(statusNode);

  console.info("etag:", statusNode.getAttribute("etag"));
  console.info("album:", statusNode.querySelector("album").textContent);
  console.info(
    "artist:",
    statusNode.querySelector("artist").childNodes[0].nodeValue
  );
}

debugStatus();
