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

    // https://github.com/NaturalIntelligence/fast-xml-parser
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "",
      attributesGroupName: "@",
    });

    this.etag = null;
    this.status = {};

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
    this.timeCurrent = this.time.querySelector(".player__time--current");
    this.timeDuration = this.time.querySelector(".player__time--duration");
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

  // Listening to the player
  // TODO: Get status diff?
  // TODO: Check for SyncStatus?
  async longpoll() {
    const xml = await this.getStatus({ timeout: 100, etag: this.etag });
    // Parse XML to JSON
    this.status = this.xmlParser.parse(xml).status;
    // Get etag from status
    this.etag = this.status["@"].etag;
    console.debug(this.etag, this.status);

    // Update player
    // TODO: skip update if etag hasn't changed?
    this.updatePlayer();

    // start longpoll again
    // TODO: Handle timeout/errors?
    // DOCS: When long-polling is being used then a client must not make two consecutive
    //  requests for the same resource less than one second apart, even if the first
    //  request returns in less than one second.
    this.longpoll();
  }

  async getStatus(params = {}) {
    // Build query
    const urlParams = new URLSearchParams(params);
    const query = `/Status?${urlParams.toString()}`;
    return await this.query(query);
  }

  updatePlayer() {
    this.updateNowPlaying();
    this.updateAlbumArt();
    this.updateVolume();
    this.updatePlaybackState();
  }

  // DOCS: title1, title2 and title3 MUST be used as the text of any UI that displays
  //   three lines of now-playing metadata. Do not use values such as album, artist and name.
  updateNowPlaying() {
    const { title1, title2, title3 } = this.status;

    this.infoTitle.textContent = title1;
    this.infoArtist.textContent = title2;
    this.infoAlbum.textContent = title3;
  }

  updateAlbumArt() {
    const { image } = this.status;

    this.coverImage.src = image;
    this.coverImage.alt = "Cover art";
    this.element.style.setProperty(
      "--player-background-image",
      `url("${image}")`
    );
  }

  updateVolume() {
    const { volume } = this.status;

    if (typeof volume == "number") {
      this.controls.volume.disabled = false;
      this.controls.volume.value = volume;
    } else {
      this.controls.volume.disabled = true;
    }
  }

  // DOCS: Clients are required to increment the playback position, when
  //  state is play or stream, based on the interval since the response.
  updatePlaybackState() {
    const { secs, totlen } = this.status;

    if (typeof secs === "number") {
      this.timeCurrent.textContent = secs;
    } else {
      this.timeCurrent.textContent = "0:00";
    }

    if (typeof totlen === "number") {
      this.timeDuration.textContent = totlen;
    } else {
      this.timeDuration.textContent = "∞";
    }

    if (typeof secs === "number" && typeof totlen === "number") {
      this.timeProgress.value = (secs / totlen) * 100;
    } else {
      this.timeProgress.value = 0;
    }
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
      // console.debug(xml);
      return xml;
    } catch (error) {
      console.error(error);
    }
  }
}
