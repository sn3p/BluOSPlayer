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

    this.controls = {
      element,
      play,
      pause,
    };

    play.addEventListener("click", this.play.bind(this));
    pause.addEventListener("click", this.pause.bind(this));
  }

  async play(seek, url) {
    const xml = await player.query(`/Play`);
    console.log(xml);
  }

  async pause(toggle) {
    const xml = await player.query(`/Pause`);
    console.log(xml);
  }

  async query(params) {
    try {
      const response = await fetch(host + params);
      const xml = await response.text();
      return xml;
    } catch (error) {
      console.error(error);
    }
  }
}
