/* global
  slideshow,
  highlightRectangles,
  ON_CONTAINER,
  IMG_CHANGE_CONTAINER,
  PROMISES,
  DISPLAYED_TARGETS
  */

const MONTHS = [
  { name: 'August', color: '#fef001' },
  { name: 'September', color: '#ffde00' },
  { name: 'October', color: '#ffcc00' },
  { name: 'November', color: '#ffba00' },
  { name: 'December', color: '#ffa800' },
  { name: 'January', color: '#ff9400' },
  { name: 'February', color: '#ff8000' },
  { name: 'March', color: '#ff6b00' },
  { name: 'April', color: '#fb5400' },
  { name: 'May', color: '#f63900' },
  { name: 'June', color: '#f00505' },
];

const shortenedMonths = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const CLIENT_NAME = 'me';
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
                    photoTaker: ptD[MONTHS[monthI].name],
                    subject: sD[MONTHS[monthI].name],
                    color: MONTHS[monthI].color,
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
        .style('style', { color: 'red' })
        .attr('transform', 'rotate(-65)');

      // Add Y axis
      monthGraphY.domain([0, d3.max(clientData, (d) => +(d[subjectOrTaker].split(',').length - 1))]);
      monthGraphYAxis.transition().duration(1000).call(d3.axisLeft(monthGraphY));

      // variable u: map data to existing bars
      const u = monthGraphSVG.selectAll('rect')
        .data(clientData);
      // We use a list here only so we can reference an object from deeper scope
      u
        .enter()
        .append('rect')
        .classed('monthRect', true)
        .style('cursor', 'pointer')
        .on('click', (d) => {
          const imgIDs = d[CURRENT_SUBJECT_OR_TAKER]?.split(',')?.slice(0, -1) ?? [];
          if (d.month === DISPLAYED_TARGETS.month) {
            IMG_CHANGE_CONTAINER.month = false;
            ON_CONTAINER.month = false;
            DISPLAYED_TARGETS.month = '';
            highlightRectangles('monthRect', d.month, d.month);
          } else {
            if (DISPLAYED_TARGETS.month === '') {
              highlightRectangles('monthRect', 'none', d.month);
            } else if (DISPLAYED_TARGETS.month !== d.month) {
              highlightRectangles('monthRect', DISPLAYED_TARGETS.month, d.month);
            }
            IMG_CHANGE_CONTAINER.month = true;
            $('.explanation-month').fadeOut('fast');
            ON_CONTAINER.month = false;
            DISPLAYED_TARGETS.month = d.month;
            PROMISES.month.then(() => {
              ON_CONTAINER.month = true;
              if (IMG_CHANGE_CONTAINER.month) {
                PROMISES.month = slideshow('month', imgIDs, ON_CONTAINER, IMG_CHANGE_CONTAINER);
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
        .attr('fill', (d) => d.color);
    });
  });
};

drawBarGraph(CLIENT_NAME, 'photoTaker');
