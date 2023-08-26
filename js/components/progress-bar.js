/**
 * @class ProgressBar
 *
 * @constructor
 * @param {HTMLElement} element - The progress bar element.
 */

class ProgressBar {
  constructor(element) {
    this.element = element;
    this.track = element.querySelector(".progress-bar__track");

    this.scrubbing = false;

    // Create binded event handlers so we can remove them later
    this.onMouseMoveHandler = this.onMouseMove.bind(this);

    // Add mousedown listener to start scrubbing
    this.element.addEventListener("mousedown", this.onMouseDown.bind(this));

    return this;
  }

  onMouseDown(event) {
    // Abort if mouse button was not the left mouse button
    if (event.button > 0) return;

    // Add mousemove listener to continue scrubbing
    document.addEventListener("mousemove", this.onMouseMoveHandler);

    // Add mouseup listener to stop scrubbing
    document.addEventListener("mouseup", this.onMouseUp.bind(this), {
      once: true,
    });

    this.element.classList.add("progress-bar--scrubbing");

    // Start scrubbing
    this.scrub(event);
    this.scrubbing = true;

    // Dispatch "scrub-start" event
    this.dispatchEvent(
      new CustomEvent("scrub-start", { detail: { value: this.value } })
    );
  }

  onMouseMove(event) {
    this.scrub(event);

    // Dispatch "scrub" event
    this.dispatchEvent(
      new CustomEvent("scrub", { detail: { value: this.value } })
    );
  }

  onMouseUp() {
    // Remove mousemove listerer to stop scrubbing
    document.removeEventListener("mousemove", this.onMouseMoveHandler);

    this.element.classList.remove("progress-bar--scrubbing");
    this.scrubbing = false;

    // Dispatch "scrub-end" event
    this.dispatchEvent(
      new CustomEvent("scrub-end", { detail: { value: this.value } })
    );
  }

  scrub(event) {
    const { left, width } = this.track.getBoundingClientRect();
    let decimal = (event.clientX - left) / width;
    decimal = Math.max(0, Math.min(1, decimal));
    this.value = decimal * 100;
  }

  /*
  Getter and setter for the progress bar value
  */

  get value() {
    const value = getComputedStyle(this.element).getPropertyValue(
      "--progress-bar-progress"
    );

    return parseInt(value, 10);
  }

  set value(percent) {
    this.element.style.setProperty("--progress-bar-progress", `${percent}%`);
  }

  /*
  Helpers for event listening and dispatching
  */

  addEventListener(type, listener, options) {
    this.element.addEventListener(type, listener, options);
  }

  removeEventListener(type, listener, options) {
    this.element.removeEventListener(type, listener, options);
  }

  dispatchEvent(event) {
    this.element.dispatchEvent(event);
  }
}
