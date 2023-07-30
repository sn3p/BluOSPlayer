/**
 * @class NodePlayer
 *
 * See Node API docs for more info:
 * https://content-bluesound-com.s3.amazonaws.com/uploads/2022/07/BluOS-Custom-Integration-API-v1.5.pdf
 *
 * @constructor
 * @param {HTMLElement} element - The player element.
 * @param {string} host - The host or IP address of the Node.
 */

class NodePlayer {
  constructor(element, host) {
    this.element = element;
    this.host = host;

    this.setupUI();
    this.setupControls();

    // Get player status
    // this.status({ timeout: 100, etag: "123" });
    this.status();
  }

  setupUI() {
    this.info = this.element.querySelector(".player__info");
    this.infoTitle = this.info.querySelector(".player__info--title");
    this.infoArtist = this.info.querySelector(".player__info--artist");
    this.infoAlbum = this.info.querySelector(".player__info--album");

    this.cover = this.element.querySelector(".player__cover");
    this.coverImage = this.cover.querySelector(".player__cover--image");
    this.coverImage.addEventListener("load", (event) => {
      const color = new ColorThief().getColor(event.target);

      this.element.style.setProperty(
        "--player-background-color",
        `rgb(${color.join(",")})`
      );
    });

    this.time = this.element.querySelector(".player__time");
    this.timeProgress = this.time.querySelector(".player__time--progress");
  }

  setupControls() {
    const element = this.element.querySelector(".player__controls");
    const classPrefix = ".player__button--";

    this.controls = { element };

    ["play", "pause", "stop", "prev", "next"].forEach((name) => {
      const el = element.querySelector(classPrefix + name);
      el.addEventListener("click", this[name].bind(this));
      this.controls[name] = el;
    });

    // Volume
    const volume = element.querySelector(".player__volume");
    volume.addEventListener("change", (event) =>
      this.volume(event.target.value)
    );
    this.controls.volume = volume;
  }

  // TODO:
  // - Handle timeout and etag
  // - Get diff of changes
  async status(params = {}) {
    const urlParams = new URLSearchParams(params);
    const query = `/Status?${urlParams.toString()}`;

    const xml = await this.query(query);

    const doc = this.parseXML(xml);
    const statusNode = doc.querySelector("status");

    // console.debug("etag:", statusNode.getAttribute("etag"));

    // Set track info
    const title = this.statusValue(doc, "title1");
    const artist = this.statusValue(doc, "title2");
    const album = this.statusValue(doc, "title3");
    this.setInfo(title, artist, album);

    // Set album art
    const image = this.statusValue(doc, "image");
    this.setAlbumArt(image);

    // Set playback state
    const secs = this.statusValue(doc, "secs");
    const totlen = this.statusValue(doc, "totlen");
    this.setPlaybackState(secs, totlen);

    // Set volume
    this.controls.volume.disabled = false;
    this.controls.volume.value = statusNode.querySelector("volume").textContent;
  }

  // TODO: Multiple values at once
  statusValue(doc, name) {
    return doc.getElementsByTagName(name)[0]?.textContent;
  }

  setInfo(title, artist, album) {
    this.infoTitle.textContent = title;
    this.infoArtist.textContent = artist;
    this.infoAlbum.textContent = album;
  }

  setAlbumArt(url) {
    this.coverImage.src = url;
    this.coverImage.alt = "Cover art";
    this.element.style.setProperty(
      "--player-background-image",
      `url("${url}")`
    );
  }

  setPlaybackState(secs, totlen) {
    console.log(secs, totlen, (secs / totlen) * 60);
    const progress = (secs / totlen) * 100;
    this.timeProgress.value = progress;
  }

  /*
  Playback
  */

  play(seek, url) {
    this.query("/Play");
  }

  pause(toggle) {
    this.query("/Pause");
  }

  stop() {
    this.query("/Stop");
  }

  prev() {
    this.query("/Back");
  }

  next() {
    this.query("/Skip");
  }

  volume(level) {
    this.query(`/Volume?level=${level}`);
  }

  async query(query) {
    try {
      const response = await fetch(host + query);
      const xml = await response.text();
      console.debug(xml);
      return xml;
    } catch (error) {
      console.error(error);
    }
  }

  parseXML(xml) {
    const parser = new DOMParser();
    return parser.parseFromString(xml, "application/xml");
  }
}
