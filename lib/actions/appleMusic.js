'use strict';

function getMetadata(id, parentUri, type, title) {
  return `<DIDL-Lite xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/"
  xmlns:r="urn:schemas-rinconnetworks-com:metadata-1-0/" xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/">
  <item id="${id}" parentID="${parentUri}" restricted="true"><dc:title>"${title}"</dc:title><upnp:class>${type}</upnp:class>
  <desc id="cdudn" nameSpace="urn:schemas-rinconnetworks-com:metadata-1-0/">SA_RINCON52231_X_#Svc52231-0-Token</desc></item></DIDL-Lite>`;
}

function getSongUri(id) {
  return `x-sonos-http:${id}.mp4?sid=204&flags=8224&sn=4`;
}

function getAlbumUri(id) {
  return `x-rincon-cpcontainer:0004206c${id}`;
}

function getPlaylistUri(id) {
  return `x-rincon-cpcontainer:1006206c${id}`;
}

function getStationUri(id) {
  return `x-sonosapi-radio:radio%3ara.${id}?sid=204&flags=44&sn=15`;
}

const uriTemplates = {
  song: getSongUri,
  album: getAlbumUri,
  playlist: getPlaylistUri,
  station: getStationUri,
};

const CLASSES = {
  song: 'object.item.audioItem.musicTrack',
  album: 'object.item.audioItem.musicAlbum',
  playlist: 'object.container.playlistContainer.#PlaylistView',
  station: 'object.item.audioItem.audioBroadcast#BrowseItem',
};

const METADATA_URI_STARTERS = {
  song: '00032020',
  album: '0004206c',
  playlist: '1006206c',
  station: '000c002c'
};

const PARENTS = {
  song: '0004206calbum%3a',
  album: '00020000album%3a',
  playlist: '1006206cplaylist%3a',
  station: '000c002cradio%3'
};

function appleMusic(player, values) {
  const action = values[0];
  const trackID = values[1];
  const title = values[2];
  const type = trackID.split(':')[0];
  let nextTrackNo = 0;

  const metadataID = METADATA_URI_STARTERS[type] + encodeURIComponent(trackID);
  const metadata = getMetadata(metadataID, PARENTS[type], CLASSES[type], title);
  const uri = uriTemplates[type](encodeURIComponent(trackID));

  if (action === 'queue') {
    return player.coordinator.addURIToQueue(uri, metadata);
  } else if (action === 'now') {
    nextTrackNo = player.coordinator.state.trackNo + 1;
    let promise = Promise.resolve();
    if (player.coordinator.avTransportUri.startsWith('x-rincon-queue') === false) {
      promise = promise.then(() => player.coordinator.setAVTransport(`x-rincon-queue:${player.coordinator.uuid}#0`));
    }
    return promise.then(() => player.coordinator.addURIToQueue(uri, metadata, true, nextTrackNo))
      .then(() => { if (nextTrackNo !== 1) player.coordinator.nextTrack(); })
      .then(() => player.coordinator.play());
  } else if (action === 'next') {
    nextTrackNo = player.coordinator.state.trackNo + 1;
    return player.coordinator.addURIToQueue(uri, metadata, true, nextTrackNo);
  }

  return null;
}

module.exports = function appleMusicAction(api) {
  api.registerAction('applemusic', appleMusic);
};
