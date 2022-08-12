/* global loadAndDisplayPictures */

const networkMargin = {
  top: 0, right: 0, bottom: 0, left: 0,
};
const networkWidth = 550;
const networkHeight = 550;

const totalNetworkHeight = 800;

const NAMES = ['me', 'girlBoss', 'shirleyWhirley', 'dumbestKid', 'yuppie', 'bugBoy', 'emily', 'other', 'jiusus', 'chimu'];
// append the svg object to the body of the page
const clientPicturedWithSVG = d3.select('#clientPicturedWithGraph')
  .append('svg')
  .classed('centeredSVG', true)
  .attr('height', networkHeight + networkMargin.bottom + networkMargin.top)
  .attr('width', networkWidth + networkMargin.left + networkMargin.right)
  .append('g')
  .attr('transform', `translate(${networkMargin.left},${networkMargin.top})`);

const clientTakerSubjectSVG = d3.select('#clientTakerSubjectGraph')
  .append('svg')
  .classed('centeredSVG', true)
  .attr('height', networkHeight + networkMargin.bottom + networkMargin.top)
  .attr('width', networkWidth + networkMargin.left + networkMargin.right)
  .append('g')
  .attr('transform', `translate(${networkMargin.left},${networkMargin.top})`);

const totalPicturedWithSVG = d3.select('#totalGraph')
  .append('svg')
  .classed('centeredSVG', true)
  .attr('height', totalNetworkHeight)
  .attr('width', totalNetworkHeight)
  .append('g')
  .attr('transform', `translate(${totalNetworkHeight / 2},${totalNetworkHeight / 2})`);

const ICON_DATA = [];
let defsLoaded = false;

const getIDFromName = (name, nodeList) => {
  let id = 'error';
  nodeList.forEach((node) => {
    if (name === node.name) {
      id = node.id;
    }
  });
  return id;
};

const processTarget = (targetName, targetData, clientName, networkData) => {
  if (targetName !== 'client' && targetName !== clientName) {
    networkData.links.push({
      source: getIDFromName(clientName, networkData.nodes),
      sourceName: clientName,
      target: getIDFromName(targetName, networkData.nodes),
      targetName,
      picIDs: targetData,
    });
    // eslint-disable-next-line no-param-reassign
    networkData.nodes[getIDFromName(targetName, networkData.nodes)].picIDs = targetData;
  }
};

const processData = (clientName, data) => {
  const networkData = { nodes: [], links: [] };
  NAMES.forEach((name, nameI) => {
    networkData.nodes.push({
      id: nameI,
      name,
    });
  });

  const mostPicIDs = Math.max(...data.map(
    (pwRow) => {
      if (pwRow.client === clientName || clientName === 'total') {
        return Math.max(
          ...Object.entries(pwRow).map(([targetName, targetData]) => {
            if (targetName !== 'client') {
              return targetData.split('\n,').slice(0, -1).length;
            }
            return 0;
          }),
        );
      }
      return 0;
    },
  ));
  data.forEach((pwRow) => {
    if (clientName === pwRow.client || clientName === 'total') {
      Object.entries(pwRow).forEach(([targetName, targetData]) => {
        processTarget(targetName, targetData, pwRow.client, networkData);
      });
    }
  });
  return { data: networkData, mostPicIDs };
};

const maskElement = (element, ON) => {
  if (ON) {
    element
      .transition()
      .duration(200)
      .style('filter', 'brightness(85%)');
  } else {
    element
      .transition()
      .duration(200)
      .style('filter', 'brightness(100%)');
  }
};

const drawNetwork = (clientName, dataFileName, svg, pictureIDName, pictureDivName) => {
  d3.csv(`/scripts/data/${dataFileName}.csv`, (data) => {
    const dataAndMostPicIds = processData(clientName, data);
    const { mostPicIDs } = dataAndMostPicIds;
    const networkData = dataAndMostPicIds.data;
    // console.log(networkData);
    const maxLinkWidth = 10;
    // Initialize the links
    const networkDataLink = svg
      .selectAll('line')
      .data(networkData.links)
      .enter()
      .append('line')
      .attr('class', (d) => `${d.sourceName}Link ${d.targetName}Link`)
      .style('stroke', '#aaa')
      .style('stroke-width', (d) => {
        const numPicIDs = d.picIDs?.split('\n,')?.slice(0, -1)?.length ?? 1;
        const width = Math.ceil((maxLinkWidth * (numPicIDs + 1)) / mostPicIDs);
        return width;
      })
      .on('mouseover', (d) => {
        if (clientName !== 'total') {
          const imgIDs = d.picIDs?.split('\n,')?.slice(0, -1) ?? [];
          console.log(imgIDs);
          loadAndDisplayPictures(imgIDs, pictureIDName, pictureDivName);
        } else {
          maskElement(d3.selectAll(`.${d.sourceName}Circle`), true);
        }
        maskElement(d3.selectAll(`.${d.targetName}Link`), true);
        maskElement(d3.selectAll(`.${d.targetName}Circle`), true);
      })
      .on('mouseout', (d) => {
        TRANSITION_OFF = true;
        maskElement(d3.selectAll(`.${d.targetName}Link`), false);
        maskElement(d3.selectAll(`.${d.targetName}Circle`), false);
        if (clientName === 'total') {
          maskElement(d3.selectAll(`.${d.sourceName}Circle`), false);
        }
      });
    const config = {
      avatar_size: 130, // define the size of the circle radius
    };

    if (!defsLoaded) {
      const body = d3.select('body');
      const definitionSVG = body.append('svg');
      const defs = definitionSVG.append('svg:defs');
      ICON_DATA.forEach((d) => {
        defs.append('svg:pattern')
          .attr('id', `${d.name}_icon`)
          .attr('patternContentUnits', 'objectBoundingBox')
          .attr('height', '1')
          .attr('width', '1')
          .append('svg:image')
          .attr('href', d.url)
          .attr('height', '1')
          .attr('width', '1');
      });
      defsLoaded = true;
    }

    // Initialize the nodes

    const networkDataNode = svg
      .selectAll('circle')
      .data(networkData.nodes)
      .enter()
      .append('circle')
      .attr('class', (d) => `${d.name}Circle`)
      .attr('r', (0.9 * config.avatar_size) / 2)
      .style('fill', (d) => `url(#${d.name}_icon)`)
      .on('mouseover', (d) => {
        if (clientName !== 'total') {
          const imgIDs = d.picIDs?.split('\n,')?.slice(0, -1) ?? [];
          loadAndDisplayPictures(imgIDs, pictureIDName, pictureDivName);
          console.log(d);
        }

        maskElement(d3.selectAll(`.${d.name}Link`), true);
        maskElement(d3.selectAll(`.${d.name}Circle`), true);
      })
      .on('mouseout', (d) => {
        TRANSITION_OFF = true;
        maskElement(d3.selectAll(`.${d.name}Circle`), false);
        maskElement(d3.selectAll(`.${d.name}Link`), false);
      });

    // This function is run at each iteration of the force algorithm, updating the nodes position.
    const networkTicked = () => {
      networkDataLink
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y);

      networkDataNode
        .attr('cx', (d) => d.x + 1)
        .attr('cy', (d) => d.y - 1);
    };

    const totalTicked = () => {
      networkDataLink
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y);
      networkDataNode
        .attr('cx', (d) => d.x)
        .attr('cy', (d) => d.y);
    };

    // Let's list the force we wanna apply on the network
    if (clientName === 'total') {
      d3.forceSimulation(networkData.nodes)
        .force('charge', d3.forceCollide().radius(50))
        .force('r', d3.forceRadial(() => 200))
        .force('link', d3.forceLink() // This force provides links between nodes
          .id((d) => d.id) // This provide  the id of a node
          .links(networkData.links)
          .strength(() => 0))
        .on('tick', totalTicked)
        .alphaTarget(0.1);
    } else {
      d3.forceSimulation(networkData.nodes)
        .force('link', d3.forceLink() // This force provides links between nodes
          .id((d) => d.id) // This provide  the id of a node
          .links(networkData.links))
        .force('charge', d3.forceManyBody().strength(-4000)) // This adds repulsion between nodes. Play with the -400 for the repulsion strength
        .force('center', d3.forceCenter(networkWidth / 2, networkHeight / 2)) // This force attracts nodes to the center of the svg area
        .on('tick', networkTicked)
        .alphaTarget(0.1);
    }
  });
};
