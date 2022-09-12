/* global slideshow, highlightRectangles */

const MONTHS = ['August', 'September', 'October', 'November', 'December', 'January', 'February', 'March', 'April', 'May', 'June'];
const shortenedMonths = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const CLIENT_NAME = 'me';
let DISPLAYED_MONTH = '';
let USER;
const MONTH_IMG_CHANGE_CONTAINER = [true];
const MONTH_ON_CONTAINER = [false];
let MONTH_PROMISE = new Promise((resolve) => {
  resolve(MONTH_IMG_CHANGE_CONTAINER[0]);
});
let SUBJECT_OR_TAKER;
let CURRENT_SUBJECT_OR_TAKER = 'photoTaker';

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

const drawBarGraph = (clientName, subjectOrTaker) => {
  if (subjectOrTaker !== CURRENT_SUBJECT_OR_TAKER) {
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
        .classed('monthRect', true)
        .style('cursor', 'pointer')
        .on('click', (d) => {
          const imgIDs = d[CURRENT_SUBJECT_OR_TAKER]?.split(',')?.slice(0, -1) ?? [];
          if (d.month === DISPLAYED_MONTH) {
            MONTH_IMG_CHANGE_CONTAINER[0] = false;
            MONTH_ON_CONTAINER[0] = false;
            DISPLAYED_MONTH = '';
            $('.explanation').fadeIn();
            highlightRectangles('monthRect', d.month, d.month);
          } else {
            if (DISPLAYED_MONTH === '') {
              highlightRectangles('monthRect', 'none', d.month);
            } else if (DISPLAYED_MONTH !== d.month) {
              highlightRectangles('monthRect', DISPLAYED_MONTH, d.month);
            }
            MONTH_IMG_CHANGE_CONTAINER[0] = true;
            $('.explanation').fadeOut('fast');
            MONTH_ON_CONTAINER[0] = false;
            DISPLAYED_MONTH = d.month;
            MONTH_PROMISE.then(() => {
              MONTH_ON_CONTAINER[0] = true;
              if (MONTH_IMG_CHANGE_CONTAINER[0]) {
                MONTH_PROMISE = slideshow('month', imgIDs, MONTH_ON_CONTAINER);
              }
            });
          }
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
