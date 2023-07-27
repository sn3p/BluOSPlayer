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

    this.initControls();
  }

  initControls() {
    const element = this.element.querySelector(".player__controls");
    const classPrefix = ".player__button--";

    const play = element.querySelector(classPrefix + "play");
    const pause = element.querySelector(classPrefix + "pause");
    const stop = element.querySelector(classPrefix + "stop");
    const prev = element.querySelector(classPrefix + "prev");
    const next = element.querySelector(classPrefix + "next");

    this.controls = {
      element,
      play,
      pause,
      stop,
      prev,
      next,
    };

    play.addEventListener("click", this.play.bind(this));
    pause.addEventListener("click", this.pause.bind(this));
    stop.addEventListener("click", this.stop.bind(this));
    prev.addEventListener("click", this.prev.bind(this));
    next.addEventListener("click", this.next.bind(this));
  }

  async play(seek, url) {
    this.query("/Play");
  }

  async pause(toggle) {
    this.query("/Pause");
  }

  async stop() {
    this.query("/Stop");
  }

  async prev() {
    this.query("/Back");
  }

  async next() {
    this.query("/Skip");
  }

  async query(params) {
    try {
      const response = await fetch(host + params);
      const xml = await response.text();
      console.debug(xml);
      return xml;
    } catch (error) {
      console.error(error);
    }
  }
}
