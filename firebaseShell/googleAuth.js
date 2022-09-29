/* global
    drawNetwork,
    ICON_DATA,
    clientPicturedWithSVG,
    clientTakerSubjectSVG,
    totalPWSVG,
    totalTSSVG,
    CREDENTIALS,
    drawNetwork
    drawTop3Stats
    columnOneColors,
    columnTwoColors,
    columnThreeColors
    drawTreeMap
    drawBarGraph
*/
const CLIENT_NAME = 'me';
$(document).ready(() => {
  $('.hdPwdInput').hide();
  $('.scroller').hide();
});
/**
 * Sample JavaScript code for photoslibrary.mediaItems.get
 * See instructions for running APIs Explorer code samples locally:
 * https://developers.google.com/explorer-help/code-samples#javascript
 */
const authenticate = () => gapi.auth2.getAuthInstance()
  .signIn({ scope: 'https://www.googleapis.com/auth/photoslibrary https://www.googleapis.com/auth/photoslibrary.readonly https://www.googleapis.com/auth/photoslibrary.readonly.appcreateddata' })
  .then(
    () => { console.log('Sign-in successful'); },
    (err) => { console.error('Error signing in', err); },
  );

const loadIconPhotos = async () => {
  console.log('GAPI client loaded for API');
  return gapi.client.photoslibrary.albums.list({})
    .then((albumsResponse) => {
      const { albums } = albumsResponse.result;
      albums.forEach((album) => {
        if (album.title === 'iconPhotos') { // load icon album
          return gapi.client.photoslibrary.mediaItems.search({
            albumId: album.id,
            pageSize: 13,
          }).then((mediaResponse) => {
            // do stuff here
            const { mediaItems } = mediaResponse.result;
            mediaItems.forEach((mediaItem) => {
              ICON_DATA.push({
                name: mediaItem.description,
                url: mediaItem.baseUrl,
              });
            });
            drawNetwork(CLIENT_NAME, 'picturedWith', clientPicturedWithSVG, 'clientPicturedWith');
            drawNetwork(CLIENT_NAME, 'takerSubject', clientTakerSubjectSVG, 'clientTakerSubject');
            drawNetwork('totalPW', 'picturedWith', totalPWSVG, 'totalPW');
            drawNetwork('totalTS', 'takerSubject', totalTSSVG, 'totalTS');

            drawTop3Stats(CLIENT_NAME, 'picturedWith', 'picturedWithTop3', columnOneColors);
            drawTop3Stats(CLIENT_NAME, 'subjectTaker', 'asSubjectTop3', columnTwoColors);
            drawTop3Stats(CLIENT_NAME, 'takerSubject', 'asPhototakerTop3', columnThreeColors);

            drawTreeMap(CLIENT_NAME);
            drawBarGraph(CLIENT_NAME, 'photoTaker');

            // TODO
            while ('nextPageToken' in mediaResponse) {
              console.log('todo');
            }
          }, (err) => {
            console.error('Error loading album client for API', err);
          });
        }
      });
      $('.loader').fadeOut();
      $('.hdPwdInput').fadeIn(1000);
    }, (err) => {
      console.error('Execute error', err);
    });
};

const loadClient = async () => {
  gapi.client.setApiKey(CREDENTIALS.apiKey);
  return gapi.client.load('https://photoslibrary.googleapis.com/$discovery/rest?version=v1')
    .then(
      () => {
        loadIconPhotos();
      },
      (err) => {
        console.error('Error loading GAPI client for API', err);
      },
    );
};

gapi.load('client:auth2', () => {
  gapi.auth2.init({ client_id: CREDENTIALS.clientID });
});

$('#authenticateButton').click(() => {
  authenticate().then(loadClient);
  $('#authenticateButton').fadeOut();
  $('.loader').fadeIn();
});
