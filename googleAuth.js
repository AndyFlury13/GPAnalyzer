/**
 * Sample JavaScript code for photoslibrary.mediaItems.get
 * See instructions for running APIs Explorer code samples locally:
 * https://developers.google.com/explorer-help/code-samples#javascript
 */
const authenticate = () => {
    return gapi.auth2.getAuthInstance()
        .signIn({scope: "https://www.googleapis.com/auth/photoslibrary https://www.googleapis.com/auth/photoslibrary.readonly https://www.googleapis.com/auth/photoslibrary.readonly.appcreateddata"})
        .then(() => { console.log("Sign-in successful"); },
            (err) => { console.error("Error signing in", err); });
}
const loadClient = async () => {
    gapi.client.setApiKey(CREDENTIALS.apiKey);
    return gapi.client.load("https://photoslibrary.googleapis.com/$discovery/rest?version=v1")
        .then(loadIconPhotos, (err) => { 
            console.error("Error loading GAPI client for API", err); 
        });
}

const loadIconPhotos = async () => { 
    console.log("GAPI client loaded for API"); 
    return gapi.client.photoslibrary.albums.list({})
        .then((response) => {
            const albums = response.result.albums;
            for (let album_i=0; album_i < albums.length; album_i++) {
                var album = albums[album_i];
                if (album['title'] == 'iconPhotos') { // load icon album
                    return gapi.client.photoslibrary.mediaItems.search({
                        'albumId': album.id,
                        'pageSize': 13
                    }).then((response) => {
                         // do stuff here
                        const mediaItems = response.result.mediaItems;
                        for (let icon_i = 0; icon_i < mediaItems.length; icon_i++) {
                            const mediaItem = mediaItems[icon_i];
                            ICON_DATA.push({
                                'name': mediaItem.description,
                                'url': mediaItem.baseUrl
                            });
                        }
                        drawNetwork(CLIENT_NAME, 'picturedWith', clientPicturedWithSVG, 'clientPicturedWithGraph', 'clientPicturedWith');
                        drawNetwork(CLIENT_NAME, 'takerSubject', clientTakerSubjectSVG, 'clientTakerSubjectGraph', 'clientTakerSubject');
                        drawNetwork('total', 'picturedWIth', totalPicturedWithSVG, 'null', 'null');
                        // TODO
                        while ('nextPageToken' in response) {
                            console.log('todo');
                        }
                    }, (err) => {
                        console.error("Error loading album client for API", err); 
                    })
                }
            }
        }, (err) => {
            console.error("Execute error", err);
        });
}
gapi.load("client:auth2", () => {
    gapi.auth2.init({client_id: CREDENTIALS.clientID});
});

$("#authenticateButton").click(() => {
    authenticate().then(loadClient)
});