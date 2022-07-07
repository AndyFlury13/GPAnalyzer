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
const loadClient = () => {
    gapi.client.setApiKey(CREDENTIALS.apiKey);
    return gapi.client.load("https://photoslibrary.googleapis.com/$discovery/rest?version=v1")
        .then(() => { console.log("GAPI client loaded for API"); },
            (err) => { console.error("Error loading GAPI client for API", err); });
}

// Make sure the client is loaded and sign-in is complete before calling this method
gapi.load("client:auth2", () => {
    gapi.auth2.init({client_id: CREDENTIALS.clientID});
});

$("#authenticateButton").click(() => {
    authenticate().then(loadClient)
});

