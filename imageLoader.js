/* global  */
let LOCKED = false;

const loadImage = (photoDivName, imgID) => new Promise((resolve, reject) => {
  gapi.client.photoslibrary.mediaItems.get({ // initial load
    mediaItemId: imgID,
  }).then((response) => {
    $(`<img class='displayedPhoto' id='${response.result.id}' src='${response.result.baseUrl}'/>`).prependTo(`#${photoDivName}Photos`);
    $(`#${response.result.id}`).on('load', () => {
      $(`#${response.result.id}`).animate({
        opacity: 1,
      }, 400, () => {
        resolve();
      });
    });
  }, (err) => reject(err));
});

const removeImage = (pictureToRemoveID, timeToDisappear) => new Promise((resolve) => {
  // alert('starting to remove');
  LOCKED = true;
  $(`#${pictureToRemoveID}`).animate({
    opacity: 0,
  }, timeToDisappear, () => {
    // alert('remove');
    $(`#${pictureToRemoveID}`).remove();
    resolve();
  });
});

const slideshow = (photoDivName, imgIDs, slideshowOnContainer, IMG_CHANGE_CONTAINER) => new Promise(
  (resolve) => {
    let imgIDsI = 0;
    let timer = 0;
    const imageDisplayLength = 350;
    TRANSITION_OFF = false;
    let displayedImgID = imgIDs[imgIDsI];
    loadImage(photoDivName, displayedImgID);
    const imgCycler = setInterval(() => {
      let slideshowOn = slideshowOnContainer[0];
      if (!slideshowOn) {
        if (!LOCKED) {
          clearInterval(imgCycler);
          removeImage(displayedImgID, 200).then(() => {
            LOCKED = false;
            resolve(IMG_CHANGE_CONTAINER);
          });
        }
      } else if (timer > imageDisplayLength) {
        timer = 0;
        imgIDsI += 1;
        if (imgIDsI === imgIDs.length) {
          imgIDsI = 0;
        }
        removeImage(displayedImgID, 200).then(() => {
          displayedImgID = imgIDs[imgIDsI];
          slideshowOn = slideshowOnContainer[0];
          if (slideshowOn) {
            loadImage(photoDivName, displayedImgID).then(() => {
              LOCKED = false;
            });
          }
        });
      }
      timer += 1;
    }, 10);
  },
);
