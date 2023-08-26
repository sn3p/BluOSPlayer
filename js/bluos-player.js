/**
 * @class BluOSPlayer
 * @classdesc Audio player for BluOS players.
 *
 * See Node API docs for more info:
 * https://content-bluesound-com.s3.amazonaws.com/uploads/2022/07/BluOS-Custom-Integration-API-v1.5.pdf
 *
 * @constructor
 * @param {HTMLElement} element - The player element.
 * @param {string} hostname - The hostname or IP address of the Node.
 */

class BluOSPlayer {
  constructor(element, hostname) {
    this.element = element;

    this.api = new BluOSInterface(hostname);

    // https://github.com/NaturalIntelligence/fast-xml-parser
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "",
      attributesGroupName: "@",
    });

    // Used to get the dominant color from cover images
    this.colorThief = new ColorThief();

    this.status = {};
    this.etag = null;
    this.playTimer = null;

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

    this.time = this.element.querySelector(".player__time");
    this.timeCurrent = this.time.querySelector(".player__time--current");
    this.timeDuration = this.time.querySelector(".player__time--duration");

    this.progressBar = new ProgressBar(
      this.time.querySelector(".progress-bar")
    );
    this.progressBar.addEventListener("scrub-end", (event) => {
      const { value } = event.detail;
      const { totlen } = this.status;
      const seek = Math.round((value / 100) * totlen);
      this.seek(seek);
    });
  }

  setupControls() {
    const element = this.element.querySelector(".player__controls");
    const classPrefix = ".player__button--";

    // Old
    this.controls = { element };
    ["play", "pause", "stop", "prev", "next"].forEach((name) => {
      const el = element.querySelector(classPrefix + name);
      el.addEventListener("click", this[name].bind(this));
      this.controls[name] = el;
    });

    // New
    const playback = this.element.querySelector(".player__playback");
    ["play-pause"].forEach((name) => {
      const el = playback.querySelector(classPrefix + name);
      el.addEventListener("click", this[name].bind(this));
      this.controls[name] = el;
    });

    // Volume
    const volume = element.querySelector(".player__volume");
    volume.addEventListener("change", (event) => {
      const volume = Number(event.target.value);
      this.volume(volume);
    });
    this.controls.volume = volume;
  }

  // Listening to the player
  // TODO: Get status diff?
  // TODO: Check for SyncStatus?
  async longpoll() {
    const xml = await this.api.status({ timeout: 100, etag: this.etag });
    // Parse XML to JSON
    this.status = this.xmlParser.parse(xml).status;
    // Get etag from status
    this.etag = this.status["@"].etag;
    console.debug(this.status);

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

  updatePlayer() {
    // Clear current playback timer
    this.stopPlayTimer();

    // Update player UI
    this.updateNowPlaying();
    this.updateAlbumArt();
    this.updateVolume();
    this.updateTime();
    this.updateControls();

    // Start playback timer
    if (this.status.state === "play" || this.status.state === "stream") {
      this.startPlayTimer();
    }
  }

  // Updates playback state every second
  startPlayTimer() {
    this.playTimer = setInterval(() => {
      this.status.secs++;
      this.updateTime();
    }, 1000);
  }

  stopPlayTimer() {
    clearInterval(this.playTimer);
  }

  // DOCS: title1, title2 and title3 MUST be used as the text of any UI that displays
  //   three lines of now-playing metadata. Do not use values such as album, artist and name.
  updateNowPlaying() {
    const { title1, title2, title3 } = this.status;

    this.infoTitle.textContent = title1;
    this.infoArtist.textContent = title2;
    this.infoAlbum.textContent = title3;
  }

  async updateAlbumArt() {
    const { image } = this.status;
    // Prepend base URL if image is a "local" path
    const url = new URL(image, this.api.baseUrl).toString();

    // Set cover image
    this.coverImage.src = url;
    this.element.style.setProperty(
      "--player-background-image",
      `url("${url}")`
    );

    // Get dominant color from cover image and set as background
    const tempImage = new Image();
    tempImage.crossOrigin = "Anonymous";
    tempImage.onload = () => {
      const color = this.colorThief.getColor(tempImage);

      this.element.style.setProperty(
        "--player-background-color",
        `rgb(${color.join(",")})`
      );
    };
    tempImage.src = url;
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
  updateTime() {
    let { secs, totlen } = this.status;
    // secs = Math.min(secs, totlen);

    if (typeof secs === "number") {
      this.timeCurrent.textContent = this.displayTime(secs);
    } else {
      this.timeCurrent.textContent = "0:00";
    }

    if (typeof totlen === "number") {
      this.timeDuration.textContent = this.displayTime(totlen);
    } else {
      this.timeDuration.textContent = "∞";
    }

    // Do not update progress bar if scrubbing
    if (this.progressBar.scrubbing) {
      return;
    }

    // Update progress bar
    // if (typeof canSeek === 1) {
    if (typeof secs === "number" && typeof totlen === "number") {
      this.progressBar.value = (secs / totlen) * 100;
    } else {
      this.progressBar.value = 0;
    }
  }

  displayTime(seconds) {
    seconds = Math.floor(seconds);
    let h = Math.floor(seconds / 3600);
    let m = Math.floor(seconds / 60) % 60;
    let s = seconds % 60;

    let time = [];
    if (h > 0) {
      time.push(h);
      time.push(m.toString().padStart(2, "0"));
    } else {
      time.push(m);
    }
    time.push(s.toString().padStart(2, "0"));

    return time.join(":");
  }

  updateControls() {
    const { state } = this.status;
    const isPlaying = ["play", "stream"].includes(state);

    this.controls["play-pause"].classList.toggle("is-playing", isPlaying);
  }

  /*
  Playback
  */

  ["play-pause"](event) {
    this.stopPlayTimer();

    if (["play", "stream"].includes(this.status.state)) {
      return this.api.pause();
    } else {
      return this.api.play();
    }
  }

  play() {
    this.stopPlayTimer();
    return this.api.play();
  }

  pause(toggle) {
    this.stopPlayTimer();
    return this.api.pause();
  }

  seek(seconds) {
    // if (this.status.canSeek !== 1) {
    //   return false;
    // }

    this.stopPlayTimer();
    return this.api.seek(seconds);
  }

  stop() {
    this.stopPlayTimer();
    return this.api.stop();
  }

  prev() {
    this.stopPlayTimer();
    return this.api.prev();
  }

  next() {
    this.stopPlayTimer();
    return this.api.next();
  }

  volume(level) {
    return this.api.volume(level);
  }
}
