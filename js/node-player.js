/**
 * NodePlayer class.
 *
 * @constructor
 * @param {string} host - The host or IP address of the Node.
 */

class NodePlayer {
  constructor(host) {
    this.host = host;
  }

  async fetch(query) {
    try {
      const response = await fetch(host + query);
      const xml = await response.text();
      return xml;
    } catch (error) {
      console.error(error);
    }
  }
}
