/* global loadAndDisplayPictures, CLIENT_NAME */

const treeMapWidth = 650;
const treeMapHeight = 480;
// append the svg object to the body of the page

const treeMapMargin = {
  top: 0, right: 0, bottom: 0, left: 0,
};

const treeMapSVG = d3.select('#treeMap')
  .append('svg')
  .classed('centeredSVG', true)
  .attr('height', treeMapHeight + treeMapMargin.top + treeMapMargin.bottom)
  .attr('width', treeMapWidth + treeMapMargin.left + treeMapMargin.left)
  .append('g')
  .attr('transform', `translate(${treeMapMargin.left},${treeMapMargin.top})`);

const treeMapTooltip = d3.select('body')
  .append('div')
  .attr('class', 'tooltip')
  .style('opacity', 0)
  .style('text-align', 'center')
  .style('margin', 'auto');

const drawTooltip = (div, text, x, y) => {
  div
    .transition()
    .duration(75)
    .style('opacity', 1);
  div.html(text)
    .style('left', `${x}px`)
    .style('top', `${y}px`);
};

const clearTooltip = (div) => {
  div
    .transition()
    .duration(100)
    .style('opacity', 0);
};

const processCategoryData = (categoryName, categoryData, clientData) => {
  if (categoryName !== 'client') {
    const numIDs = categoryData?.split(',')?.slice(0, -1)?.length ?? 0;
    if (numIDs !== 0) {
      clientData.children.push({
        name: categoryName,
        value: numIDs,
        group: 'A',
        colname: 'level1',
        picIDs: categoryData,
      });
    }
  }
};

// read json data
const drawTreeMap = (clientName) => {
  d3.csv('/scripts/data/subjectCategory.csv', (data) => {
    const clientData = {
      children: [],
    };
    data.forEach((row) => {
      if (row.client === clientName) {
        Object.entries((categoryName, categoryData) => {
          processCategoryData(categoryName, categoryData, clientData);
        });
      }
    });
    // Give the data to this cluster layout:
    const root = d3.hierarchy(clientData).sum((d) => d.value);

    // Then d3.treemap computes the position of each element of the hierarchy
    d3.treemap()
      .size([treeMapWidth, treeMapHeight])
      .padding(2)(root);

    // use this information to add rectangles:
    treeMapSVG
      .selectAll('rect')
      .data(root.leaves())
      .enter()
      .append('rect')
      .attr('x', (d) => d.x0)
      .attr('y', (d) => d.y0)
      .attr('width', (d) => d.x1 - d.x0)
      .attr('height', (d) => d.y1 - d.y0)
      .style('stroke', 'white')
      .style('fill', 'slateblue')
      .on('mouseenter', (d) => {
        const imgIDs = d.data.picIDs?.split(',')?.slice(0, -1) ?? [];
        console.log('mouseenter');
        loadAndDisplayPictures(imgIDs, 'categoryGraph', 'category');
        drawTooltip(treeMapTooltip, d.data.name, d3.event.x, d3.event.y);
      })
      .on('mousemove', (d) => {
        console.log('mousemove');
        drawTooltip(treeMapTooltip, d.data.name, d3.event.x, d3.event.y);
      })
      .on('mouseleave', () => {
        console.log('mouseleave');
        TRANSITION_OFF = true;
        clearTooltip(treeMapTooltip);
      });
  });
};

drawTreeMap(CLIENT_NAME);
