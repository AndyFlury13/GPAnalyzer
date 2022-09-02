/* global loadAndDisplayPictures, CLIENT_NAME */

const treeMapWidth = 750;
const treeMapHeight = 580;
const CATEGORIES = [
  { name: 'ANIMALS', color: '#6B99C3', sizeModifier: 1 },
  { name: 'FASHION', color: '#16354D', sizeModifier: 1 },
  { name: 'LANDMARKS', color: '#0C151C', sizeModifier: 1.7 },
  { name: 'ARTS', color: '#033540', sizeModifier: 1 },
  { name: 'NATURE', color: '#015366', sizeModifier: 0.9 },
  { name: 'BIRTHDAYS', color: '#63898C', sizeModifier: 1 },
  { name: 'FOOD', color: '#8fa4c3', sizeModifier: 0.9 },
  { name: 'NIGHT', color: '#092435', sizeModifier: 1 },
  { name: 'SELFIES', color: '#036280', sizeModifier: 0.7 },
  { name: 'CITYSCAPES', color: '#378BA4', sizeModifier: 1.1 },
  { name: 'PEOPLE', color: '#81BECE', sizeModifier: 1 },
  { name: 'SPORT', color: '#012E4A', sizeModifier: 1 },
  { name: 'HOLIDAYS', color: '#1F4C57', sizeModifier: 1.3 },
  { name: 'CRAFTS', color: '#306E7B', sizeModifier: 1 },
  { name: 'PERFORMANCES', color: '#153f65', sizeModifier: 1.3 },
  { name: 'TRAVEL', color: '#70bdf2', sizeModifier: 1.4 },
  { name: 'MISC', color: '#4a92a8', sizeModifier: 1 },
];
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

const getLength = (data, name, dimension) => {
  let length = 0;
  data.forEach((d) => {
    if (d.data.name === name) {
      if (dimension === 'width') {
        length += d.x1 - d.x0;
      } else {
        length += d.y1 - d.y0;
      }
    }
  });
  if (length === 0) {
    return 13;
  }
  return length;
};

const createTreemapDefs = (data) => {
  const imageLength = 15;
  const patternLength = imageLength * 2.5;
  const body = d3.select('body');
  const definitionSVG = body.append('svg');
  const defs = definitionSVG.append('svg:defs');
  CATEGORIES.forEach((entry) => {
    defs.append('svg:pattern')
      .attr('id', `${entry.name}_icon`)
      .attr('height', () =>
      // const branchHeight = getLength(data, entry.name, 'height');

        // const numIcons = branchHeight / (imageLength * entry.sizeModifier);
        // console.log(branchHeight);
        // return 1 / numIcons;
        patternLength)
      .attr('width', () =>
        // const branchWidth = getLength(data, entry.name, 'width');
        // const numIcons = branchWidth / (imageLength * entry.sizeModifier);
        // return 1 / numIcons;
        patternLength)
      .attr('x', () =>
        // const branchWidth = getLength(data, entry.name, 'width');
        // const numIcons = branchWidth / (imageLength * entry.sizeModifier);
        // return (branchWidth - numIcons * (imageLength * entry.sizeModifier)) / 2;
        5) // center patterns
      .attr('y', () =>
        // const branchHeight = getLength(data, entry.name, 'height');
        // const numIcons = branchHeight / (imageLength * entry.sizeModifier);
        // return (branchHeight - numIcons * (imageLength * entry.sizeModifier)) / 2;
        5)
      // .attr('patternUnits', 'userSpaceOnUse')
      .attr('patternUnits', 'userSpaceOnUse')
      .append('svg:image')
      .attr('href', `/treemapPics/modified/${entry.name}_modified.png`)
      .attr('height', () =>
      // const branchHeight = getLength(data, entry.name, 'height');

        // const numIcons = branchHeight / patternLength;
        // console.log(branchHeight);
        // return 1 / numIcons;
        imageLength * entry.sizeModifier)
      .attr('width', () =>
        // const branchWidth = getLength(data, entry.name, 'width');
        // const numIcons = branchWidth / (patternLength);
        // return 1 / numIcons;
        imageLength * entry.sizeModifier);
  });
};

const clearTooltip = (div) => {
  div
    .transition()
    .duration(100)
    .style('opacity', 0);
};

const processCategoryData = (categoryName, categoryData, clientData) => {
  if (categoryName !== 'client') {
    // console.log(categoryName);
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

const getColor = (name) => {
  let color = '';
  CATEGORIES.forEach((entry) => {
    if (entry.name === name) {
      color += entry.color;
    }
  });
  return color;
};

// read json data
const drawTreeMap = (clientName) => {
  d3.csv('/scripts/data/subjectCategory.csv', (data) => {
    const clientData = {
      children: [],
    };
    // console.log(data);
    data.forEach((row) => {
      if (row.client === clientName) {
        Object.entries(row).forEach(([categoryName, categoryData]) => {
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

    createTreemapDefs(root.children);
    // use this information to add rectangles:
    const selection = treeMapSVG
      .selectAll('rect')
      .data(root.leaves())
      .enter();
    selection
      .append('rect')
      .attr('x', (d) => d.x0)
      .attr('y', (d) => d.y0)
      .attr('width', (d) => d.x1 - d.x0)
      .attr('height', (d) => d.y1 - d.y0)
      .style('stroke', '#E4E5EA')
      .style('fill', (d) => getColor(d.data.name));
    selection
      .append('rect')
      .attr('x', (d) => d.x0)
      .attr('y', (d) => d.y0)
      .attr('width', (d) => d.x1 - d.x0)
      .attr('height', (d) => d.y1 - d.y0)
      .style('stroke', '#E4E5EA')
      .style('fill', (d) => `url(#${d.data.name}_icon)`)
      .on('mouseenter', (d) => {
        const imgIDs = d.data.picIDs?.split(',')?.slice(0, -1) ?? [];
        console.log('mouseenter');
        $('.explanation').fadeOut();
        // loadAndDisplayPictures(imgIDs, 'categoryGraph', 'treeMap');
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
