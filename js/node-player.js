/**
 * @class NodePlayer
 *
 * See Node API docs for more info:
 * https://content-bluesound-com.s3.amazonaws.com/uploads/2022/07/BluOS-Custom-Integration-API-v1.5.pdf
 *
 * TODO:
 * - API class for device commands
 * - Player class for player commands (with getters/setters)
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

    // Start longpolling
    this.longpoll();
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

  // Start listening to the player
  // TODO: Check for SyncStatus?
  async longpoll() {
    const xml = await this.status({ timeout: 100, etag: this.etag });

    // Set etag for next request (longpolling)
    const etag = xml.querySelector("status").getAttribute("etag");
    // console.debug(etag, this.etag === etag ? "(not changed)" : "(changed)");
    this.etag = etag;

    // Update player
    this.updatePlayer(xml);

    // start longpoll again
    // TODO: Handle timeout/errors?
    // DOCS: When long-polling is being used then a client must not make two consecutive
    //  requests for the same resource less than one second apart, even if the first
    //  request returns in less than one second.
    this.longpoll();
  }

  async status(params = {}) {
    // Build query
    const urlParams = new URLSearchParams(params);
    const query = `/Status?${urlParams.toString()}`;

    // Get XML
    const xml = await this.query(query);
    return this.parseXML(xml);
  }

  // TODO: skip update if etag hasn't changed?
  updatePlayer(xml) {
    // Set track info
    const title = this.statusValue(xml, "title1");
    if (title) {
      const artist = this.statusValue(xml, "title2");
      const album = this.statusValue(xml, "title3");
      this.setInfo(title, artist, album);
    }

    // Set album art
    const image = this.statusValue(xml, "image");
    if (image) {
      this.setAlbumArt(image);
    }

    // Set playback state
    // DOCS: Clients are required to increment the playback position, when
    //  state is play or stream, based on the interval since the response.
    const secs = this.statusValue(xml, "secs");
    const totlen = this.statusValue(xml, "totlen");
    if (secs && totlen) {
      this.setPlaybackState(secs, totlen);
    }

    // Set volume
    const volume = this.statusValue(xml, "volume");
    if (volume) {
      this.controls.volume.disabled = false;
      this.controls.volume.value = volume;
    } else {
      this.controls.volume.disabled = true;
    }
  }

  // TODO: Multiple values at once?
  statusValue(xml, name) {
    return xml.querySelector(name)?.textContent;
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
