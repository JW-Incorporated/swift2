/*
 * Provider-readiness handshake for the /embed/* wrapper pages. The wrapper
 * frames the real provider player; this script relays the PROVIDER's own
 * ready / error signal to the parent as { type: 'embed-ready' | 'embed-error' }.
 * The parent verifies event.source (this window) and event.origin. The payload
 * carries no data, so the '*' target (the app host is a null origin) leaks
 * nothing.
 *   youtube: IFrame API postMessage protocol (enablejsapi=1): onReady / onError
 *   spotify: the embed's own { type: 'ready' } message
 */
(function () {
  var script = document.currentScript;
  var provider = script && script.getAttribute('data-provider');
  var frame = document.querySelector('iframe');
  if (!frame || !provider) return;
  var done = false;

  function tell(type) {
    if (done) return;
    if (type === 'embed-ready') done = true;
    parent.postMessage({ type: type, provider: provider }, '*');
  }

  window.addEventListener('message', function (e) {
    if (e.source !== frame.contentWindow) return;
    var data = e.data;
    if (provider === 'youtube') {
      if (e.origin !== 'https://www.youtube-nocookie.com' && e.origin !== 'https://www.youtube.com') return;
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch (_) {
          return;
        }
      }
      if (!data) return;
      if (data.event === 'onError') tell('embed-error');
      else if (data.event === 'onReady' || (data.event === 'infoDelivery' && data.info && 'playerState' in data.info))
        tell('embed-ready');
    } else if (provider === 'spotify') {
      if (e.origin !== 'https://open.spotify.com') return;
      if (data && data.type === 'ready') tell('embed-ready');
    }
  });

  if (provider === 'youtube') {
    var tries = 0;
    var listen = function () {
      if (done || tries++ > 10) return;
      try {
        frame.contentWindow.postMessage(
          JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }),
          'https://www.youtube-nocookie.com',
        );
      } catch (_) {}
      setTimeout(listen, 1000);
    };
    frame.addEventListener('load', listen);
  }
})();
