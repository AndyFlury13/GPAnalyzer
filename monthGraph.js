const MONTHS = ['August', 'September', 'October', 'November', 'December', 'January', 'February', 'March', 'April', 'May', 'June'];
const shortenedMonths = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const CLIENT_NAME = 'me';
let USER;
let SUBJECT_OR_TAKER;
let CURRENT_SUBJECT_OR_TAKER = 'photoTaker';
let TRANSITION_OFF = true;
const IMG_CONTAINER_REF = [];
$('.slide-in-out-photoTaker').toggleClass('slide');

// var monthGraphMargin = {top: 30, right: 30, bottom: 70, left: 60},
//     width = 600 - monthGraphMargin.left - monthGraphMargin.right,
//     height = 400 - monthGraphMargin.top - monthGraphMargin.bottom;

const monthGraphWidth = 550;
const monthGraphHeight = 380;
const monthGraphMargin = {
  top: 10, right: 10, bottom: 40, left: 40,
};

// append the svg object to the body of the page
const monthGraphSVG = d3.select('#monthGraph')
  .append('svg')
  .classed('centeredSVG', true)
  .attr('height', monthGraphHeight + monthGraphMargin.top + monthGraphMargin.bottom)
  .attr('width', monthGraphWidth + monthGraphMargin.left + monthGraphMargin.left)
  .append('g')
  .attr('transform', `translate(${monthGraphMargin.left},${monthGraphMargin.top})`);

const monthGraphX = d3.scaleBand()
  .range([0, monthGraphWidth])
  .padding(0.2);

const monthGraphXAxis = monthGraphSVG.append('g')
  .attr('class', 'monthGraphXAxis')
  .attr('transform', `translate(0,${monthGraphHeight})`);

const monthGraphY = d3.scaleLinear()
  .range([monthGraphHeight, 0]);

const monthGraphYAxis = monthGraphSVG.append('g')
  .attr('class', 'monthGraphYAxis');

const fadeElement = (element, IN) => {
  if (IN) {
    element
      .transition()
      .duration(300)
      .style('opacity', 1);
  } else {
    element
      .transition()
      .duration(300)
      .style('opacity', 0.8);
  }
};

const animatePicture = (urlToDisplay, photoIDName, photoDivName) => {
  IMG_CONTAINER_REF[0] = ($(`<img class='displayedPhoto' id='${photoIDName}Photo' src='${urlToDisplay}'/>`).prependTo(`#${photoDivName}Photos`));
  $(`#${photoIDName}Photo`).on('load', () => {
    $(`#${photoIDName}Photo`).animate({
      opacity: 1,
    }, 400);
  });
};

const drawBarGraph = (clientName, subjectOrTaker) => {
  if (subjectOrTaker != CURRENT_SUBJECT_OR_TAKER) {
    $('.slide-in-out-photoTaker').toggleClass('slide');
    $('.slide-in-out-subject').toggleClass('slide');
    CURRENT_SUBJECT_OR_TAKER = subjectOrTaker;
  }

  d3.csv('/scripts/data/pictureBySubjectByMonth.csv', (asPhotoTakerData) => {
    d3.csv('/scripts/data/pictureOfSubjectByMonth.csv', (asSubjectData) => {
      const clientData = [];
      for (let ptDataI = 0; ptDataI < asPhotoTakerData.length; ptDataI += 1) {
        const ptD = asPhotoTakerData[ptDataI];
        if (ptD.photoTaker === clientName) {
          for (let sDataI = 0; sDataI < asSubjectData.length; sDataI += 1) {
            const sD = asSubjectData[sDataI];
            if (sD.subject === clientName) {
              for (let monthI = 0; monthI < MONTHS.length; monthI += 1) {
                clientData.push(
                  {
                    month: shortenedMonths[monthI],
                    photoTaker: ptD[MONTHS[monthI]],
                    subject: sD[MONTHS[monthI]],
                  },
                );
              }
            }
          }
        }
      }

      // X axis
      monthGraphX.domain(clientData.map((d) => d.month));
      monthGraphXAxis.transition().duration(1000).call(d3.axisBottom(monthGraphX))
        .selectAll('text')
        .style('text-anchor', 'end')
        .attr('transform', 'rotate(-65)');

      // Add Y axis
      monthGraphY.domain([0, d3.max(clientData, (d) => +(d[subjectOrTaker].split(',').length - 1))]);
      monthGraphYAxis.transition().duration(1000).call(d3.axisLeft(monthGraphY));

      // variable u: map data to existing bars
      const u = monthGraphSVG.selectAll('rect')
        .data(clientData);
      const barColor = '#69b3a2';
      // We use a list here only so we can reference an object from deeper scope
      u
        .enter()
        .append('rect')
        .on('mouseover', (d, i, n) => {
          const imgIDs = d[CURRENT_SUBJECT_OR_TAKER].split(',').slice(0, -1);
          loadAndDisplayPictures(imgIDs, 'monthGraph', 'month');
          fadeElement(d3.select(n[i]), false);
        })
        .on('mouseout', (_, i, n) => {
          TRANSITION_OFF = true;
          console.log('mouseout');
          fadeElement(d3.select(n[i]), true);
        })
        .merge(u)
        .transition()
        .duration(1000)
        .attr('x', (d) => monthGraphX(d.month))
        .attr('y', (d) => monthGraphY(d[subjectOrTaker].split(',').length - 1))
        .attr('width', monthGraphX.bandwidth())
        .attr('height', (d) => monthGraphHeight - monthGraphY(d[subjectOrTaker].split(',').length - 1))
        .attr('fill', barColor);
    });
  });
};

drawBarGraph(CLIENT_NAME, 'photoTaker');

const loadAndDisplayPictures = (imgIDs, pictureIDName, pictureDivName) => {
  TRANSITION_OFF = false;
  let timer = 0;
  let imgIDsI = 0;
  return gapi.client.photoslibrary.mediaItems.get({ // initial load
    mediaItemId: imgIDs[imgIDsI],
  }).then((response) => {
    let urlToDisplay = response.result.baseUrl;
    IMG_CONTAINER_REF[0]?.remove();
    animatePicture(urlToDisplay, pictureIDName, pictureDivName);
    const imgCycler = setInterval(() => {
      if (timer > 350) {
        timer = 0;
        console.log('image change!');
        imgIDsI += 1;
        if (imgIDsI === imgIDs.length) {
          imgIDsI = 0;
        }
        $(`#${pictureIDName}Photo`).animate({
          opacity: 0,
        }, 400, () => {
          IMG_CONTAINER_REF[0].remove();
          gapi.client.photoslibrary.mediaItems.get({ // initial load
            mediaItemId: imgIDs[imgIDsI],
          }).then((nextResponse) => {
            urlToDisplay = nextResponse.result.baseUrl;
            animatePicture(urlToDisplay, pictureIDName, pictureDivName);
          }, (err) => {
            console.err('GP request err:', err);
          });
        });
      } else if (TRANSITION_OFF) {
        clearInterval(imgCycler);
        $(`#${pictureIDName}Photo`).animate({
          opacity: 0,
        }, 400, () => {
          IMG_CONTAINER_REF[0].remove();
        });
      }
      timer += 1;
    }, 10);
  }, (err) => {
    console.error('GP load error:', err);
  });
};
