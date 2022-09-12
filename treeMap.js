/* global
  slideshow,
  CLIENT_NAME,
  deleteLedgerItem,
  LEDGER,
  imgListener,
  TRANSITION_OFF
*/
const TREE_MAP_ON_CONTAINER = [false];
const TREE_MAP_IMG_CHANGE_CONTAINER = [true];
let TREE_MAP_PROMISE = new Promise((resolve) => {
  resolve(TREE_MAP_IMG_CHANGE_CONTAINER[0]);
});
let DISPLAYED_CATEGORY = '';
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
  .attr('id', 'treeMapG')
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

const highlightRectangles = (className, oldCategory, newCategory) => {
  console.log(newCategory, oldCategory);
  if (oldCategory === 'none') {
    d3.selectAll(`.${className}`)
      .filter((d) => {
        if (className === 'treeMap') {
          return newCategory !== d.data.name;
        }
        return newCategory !== d.month;
      })
      .transition()
      .duration(1000)
      .style('filter', 'grayscale(100%)');
  } else if (oldCategory === newCategory) {
    d3.selectAll(`.${className}`)
      .transition()
      .duration(1000)
      .style('filter', 'grayscale(0%)');
  } else {
    d3.selectAll(`.${className}`)
      .filter((d) => {
        if (className === 'treeMap') {
          return newCategory === d.data.name;
        }
        return newCategory === d.month;
      })
      .transition()
      .duration(1000)
      .style('filter', 'grayscale(0%)');
    d3.selectAll(`.${className}`)
      .filter((d) => {
        if (className === 'treeMap') {
          return newCategory !== d.data.name;
        }
        return newCategory !== d.month;
      })
      .transition()
      .duration(1000)
      .style('filter', 'grayscale(100%)');
  }
};

const createTreemapDefs = () => {
  const imageLength = 15;
  const patternLength = imageLength * 2.5;
  const body = d3.select('body');
  const definitionSVG = body.append('svg');
  const defs = definitionSVG.append('svg:defs');
  CATEGORIES.forEach((entry) => {
    defs.append('svg:pattern')
      .attr('id', `${entry.name}_icon`)
      .attr('height', () => patternLength)
      .attr('width', () => patternLength)
      .attr('x', () => 5) // center patterns
      .attr('y', () => 5)
      .attr('patternUnits', 'userSpaceOnUse')
      .append('svg:image')
      .attr('href', `/treemapPics/modified/${entry.name}_modified.png`)
      .attr('height', () => imageLength * entry.sizeModifier)
      .attr('width', () => imageLength * entry.sizeModifier);
  });

  return defs;
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
      .classed('treeMapRect', true)
      .attr('x', (d) => d.x0)
      .attr('y', (d) => d.y0)
      .attr('width', (d) => d.x1 - d.x0)
      .attr('height', (d) => d.y1 - d.y0)
      .style('stroke', '#E4E5EA')
      .style('fill', (d) => getColor(d.data.name));
    selection
      .append('rect')
      .classed('treeMapRect', true)
      .attr('x', (d) => d.x0)
      .attr('y', (d) => d.y0)
      .attr('width', (d) => d.x1 - d.x0)
      .attr('height', (d) => d.y1 - d.y0)
      .style('stroke', '#E4E5EA')
      .style('cursor', 'pointer')
      .style('fill', (d) => `url(#${d.data.name}_icon)`)
      .on('mouseenter', (d) => {
        drawTooltip(treeMapTooltip, d.data.name, d3.event.x, d3.event.y);
      })
      .on('mousemove', (d) => {
        drawTooltip(treeMapTooltip, d.data.name, d3.event.x, d3.event.y);
      })
      .on('mouseleave', () => {
        clearTooltip(treeMapTooltip);
      })
      .on('click', (d) => {
        const imgIDs = d.data.picIDs?.split(',')?.slice(0, -1) ?? [];
        if (d.data.name === DISPLAYED_CATEGORY) {
          TREE_MAP_IMG_CHANGE_CONTAINER[0] = false;
          TREE_MAP_ON_CONTAINER[0] = false;
          DISPLAYED_CATEGORY = '';
          $('.explanation').fadeIn();
          highlightRectangles('treeMap', d.data.name, d.data.name);
        } else {
          if (DISPLAYED_CATEGORY === '') {
            highlightRectangles('treeMap', 'none', d.data.name);
          } else if (DISPLAYED_CATEGORY !== d.data.name) {
            highlightRectangles('treeMap', DISPLAYED_CATEGORY, d.data.name);
          }
          TREE_MAP_IMG_CHANGE_CONTAINER[0] = true;
          $('.explanation').fadeOut('fast');
          TREE_MAP_ON_CONTAINER[0] = false;
          DISPLAYED_CATEGORY = d.data.name;
          TREE_MAP_PROMISE.then(() => {
            TREE_MAP_ON_CONTAINER[0] = true;
            if (TREE_MAP_IMG_CHANGE_CONTAINER[0]) {
              TREE_MAP_PROMISE = slideshow('treeMap', imgIDs, TREE_MAP_ON_CONTAINER);
            }
          });
        }
      });
  });
};

drawTreeMap(CLIENT_NAME);
