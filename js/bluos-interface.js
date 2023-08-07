/**
 * @class BluOSInterface
 * @classdesc Interface with the BluOS API.
 *   See https://content-bluesound-com.s3.amazonaws.com/uploads/2022/07/BluOS-Custom-Integration-API-v1.5.pdf
 *
 * @constructor
 * @param {String} hostname - The Node player hostname or IP address (without protocol and port)
 * @param {Object} [options] - The options object.
 */
class BluOSInterface {
  constructor(hostname, options = {}) {
    this.options = Object.assign(
      {
        port: "11000",
      },
      options
    );

    this.hostname = hostname;
    this.baseUrl = `http://${this.hostname}:${this.options.port}`;
  }

  async query(query, params) {
    const url = new URL(query, this.baseUrl);

    // Set params as search params
    const searchParams = new URLSearchParams(params);
    searchParams.forEach((value, key) => url.searchParams.set(key, value));

    try {
      const response = await fetch(url);
      return await response.text();
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * Send a /Status request to the player.
   *
   * @example
   * status();
   * status({ etag: "1234567890", timeout: 80 });
   * await status();
   *
   * @param {Object} [params] - Query params to send with the request.
   * @param {Number} [params.timeout] - Optional parameter used with long polling.
   *    Recommended polling interval is 100 seconds and should be limited to a rate
   *    of 60 seconds or so and never faster than 10 seconds.
   * @param {String} [params.etag] - Optional parameter used with long polling.
   *    This is the etag attribute from the previous /Status call response.
   * @returns {Promise|String} - Promise with the XML response or XML string when using `await`.
   */
  status(params) {
    return this.query("/Status", params);
  }

  /**
   * Send a /Pause request to the player.
   *
   * @example
   * play();
   * await play();
   *
   * @param {Object} [params] - Query params to send with the request.
   * @param {Number} [params.seek] - Jump to specified position (seconds) in the current track.
   *    Only valid if /Status response includes <totlen>. Cannot be used with inputType and index parameters.
   * @param {String} [params.url] - URL of streamed custom audio. It has to be URL encoded.
   * @returns {Promise|String} - Promise with the XML response or XML string when using `await`.
   */
  play(params) {
    return this.query("/Play", params);
  }

  /**
   * Send a /Pause request to the player.
   *
   * @example <caption>Pause playback</caption>
   * pause();
   * await pause();
   * @example <caption>Toggle playback</caption>
   * pause({ toggle: true });
   * pause(true);
   * pause(1);
   *
   * @param {Object|Boolean|Number} [toggle] - Toggle query param to send with the request.
   * @returns {Promise|String} - Promise with the XML response or XML string when using `await`.
   */
  pause(toggle) {
    let params =
      typeof toggle === "object" ? toggle : { toggle: toggle ? 1 : 0 };

    return this.query("/Pause", params);
  }

  /**
   * Jump to specific position (seconds) in the current track.
   * Convenience method equal to `play({ seek: seconds })`.
   *
   * @param {Number} seconds - Number of seconds to seek to.
   * @returns {Promise|String} - Promise with the XML response or XML string when using `await`.
   */
  seek(seconds) {
    if (typeof seconds !== "number") {
      console.warn("seek() requires a number of seconds");
      return false;
    }

    return this.query(`/Play?seek=${seconds}`);
  }

  /**
   * Send a /Stop request to the player.
   *
   * @returns {Promise|String} - Promise with the XML response or XML string when using `await`.
   */
  stop() {
    return this.query("/Stop");
  }

  /**
   * Send a /Back request to the player.
   *
   * @returns {Promise|String} - Promise with the XML response or XML string when using `await`.
   */
  prev() {
    return this.query("/Back");
  }

  /**
   * Send a /Skip request to the player.
   *
   * @returns {Promise|String} - Promise with the XML response or XML string when using `await`.
   */
  next() {
    return this.query("/Skip");
  }

  /**
   * Send a /Volume request to the player.
   *
   * @example
   * volume(25);
   * volume({ level: 25 });
   * volume({ mute: 1 });
   *
   * @param {Object|Number} [params] - Query params to send with the request or volume level.
   * @param {Number} [params.level] - Set the absolute volume level of the player between 0-100.
   * @param {Number} [params.tell_slaves] - Applies to grouped players. If set to 0,
   *    only the currently selected player changes volume. If set to 1, then all players
   *    in the group change volume.
   * @param {Number} [params.mute] - If set to 0, the player is muted. If set to 1, the player is unmuted.
   * @param {Number} [params.abs_db] - Set the volume using a dB scale.
   * @param {Number} [params.db] - Do a relative volume change using a dB volume scale. db can be a positive or negative number.
   * @returns {Promise|String} - Promise with the XML response or XML string when using `await`.
   */
  volume(params) {
    if (typeof params === "number") {
      params = { level: params };
    }

    return this.query("/Volume", params);
  }

  /**
   * Mute or unmute the player.
   * Convenience method equal to `volume({ mute: [0|1] })`.
   *
   * @param {Boolean|Number} [mute] - Toggle query param to send with the request.
   * @returns {Promise|String} - Promise with the XML response or XML string when using `await`.
   */
  mute(mute = true) {
    mute = mute ? 1 : 0;

    return this.query("/Volume", { mute: mute });
  }
}
