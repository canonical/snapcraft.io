const LATEST = 'latest';
export default function initChannelMap(el, packageName, channelMapData) {
  const channelMapEl = document.querySelector(el);

  document.querySelector('.js-open-channel-map').addEventListener('click', () => {
    channelMapEl.style.display = 'block';
  });

  document.querySelector('.js-hide-channel-map').addEventListener('click', () => {
    channelMapEl.style.display = 'none';
  });

  const architectures = Object.keys(channelMapData);
  const arch = architectures[0];
  if (!arch) {
    return;
  }

  const tracks = Object.keys(channelMapData[arch]);
  const track = channelMapData[arch][LATEST] ? LATEST : tracks[0];

  if (!track) {
    return;
  }

  const channels = channelMapData[arch][track];
  const channelMap = {};

  channels.forEach(channel => {
    channelMap[channel.channel] = channel;
  });

  const archSelect = document.getElementById("js-channel-map-architecture-select");
  const trackSelect = document.getElementById("js-channel-map-track-select");

  archSelect.innerHTML = `<option value="${arch}">${arch}</option>`;
  archSelect.disabled = 'disabled';

  trackSelect.innerHTML = `<option value="${track}">${track}</option>`;
  trackSelect.disabled = 'disabled';

  ['stable', 'candidate', 'beta', 'edge'].forEach((risk, i, risks) => {
    const channelEl = document.getElementById(`js-channel-map-${risk}`);
    const channelData = channelMap[risk];

    // show install instructions
    channelEl.querySelector('input').value = `sudo snap install ${packageName} ${risk !== 'stable' ? `--${risk}` : '' }`;

    const versionEl = channelEl.querySelector('.p-form-help-text');
    // show version
    if (channelData) {
      versionEl.innerHTML = `Version: ${channelData.version}`;
    } else {
      let fallbackRisk;
      for (let j = 0; j < i; j++) {
        if (channelMap[risks[j]]) {
          fallbackRisk = risks[j];
        }
      }

      if (fallbackRisk) {
        versionEl.innerHTML = `No release in ${risk} channel, using ${fallbackRisk} release.`;
      } else {
        versionEl.innerHTML = `No release in ${risk} channel.`;
      }
    }

  });
}
