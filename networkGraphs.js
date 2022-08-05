// set the dimensions and margins of the graph
var networkMargin = {top:0, right: 0, bottom: 0, left: 0},
  networkWidth = 550,
  networkHeight = 550;

var totalNetworkHeight = 800;

const NAMES = ['me', 'girlBoss', 'shirleyWhirley', 'dumbestKid', 'yuppie', 'bugBoy', 'emily', 'other', 'jiusus', 'chimu']
// append the svg object to the body of the page
var clientPicturedWithSVG = d3.select("#clientPicturedWithGraph")
    .append("svg")
    .classed("centeredSVG", true)
    .attr("height", networkHeight+networkMargin.bottom+networkMargin.top)
    .attr("width", networkWidth+networkMargin.left+networkMargin.right)
    .append("g")
    .attr("transform", "translate("+networkMargin.left+","+networkMargin.top+")");


var clientTakerSubjectSVG = d3.select("#clientTakerSubjectGraph")
    .append("svg")
    .classed("centeredSVG", true)
    .attr("height", networkHeight+networkMargin.bottom+networkMargin.top)
    .attr("width", networkWidth+networkMargin.left+networkMargin.right)
    .append("g")
    .attr("transform", "translate("+networkMargin.left+","+networkMargin.top+")");

var totalPicturedWithSVG = d3.select("#totalGraph")
    .append("svg")
    .classed("centeredSVG", true)
    .attr("height", totalNetworkHeight)
    .attr("width", totalNetworkHeight)
    .append("g")
    .attr("transform", "translate("+totalNetworkHeight/2+","+totalNetworkHeight/2+")");

var ICON_DATA = [];
var defsLoaded = false;

const drawNetwork = (clientName, dataFileName, svg, pictureIDName, pictureDivName) => {
    d3.csv("/scripts/data/"+dataFileName+".csv", (data) => {
        dataAndMostPicIds =  processData(clientName, data);
        const mostPicIDs = dataAndMostPicIds['mostPicIDs']
        const networkData = dataAndMostPicIds['data'];
        console.log(networkData);
        const maxLinkWidth = 20;
        // Initialize the links
        var networkDataLink = svg
            .selectAll("line")
            .data(networkData.links)
            .enter()
            .append("line")
            .style("stroke", "#aaa")
            .style("stroke-width", (d) => {
                const numPicIDs = d['picIDs']?.split("\n,")?.slice(0, -1)?.length ?? 1
                const width = Math.ceil(maxLinkWidth * numPicIDs / mostPicIDs);
                console.log(width);
                return 10
            })
            .on("mouseover", (d, i, n) => {
                const imgIDs = d['picIDs']?.split("\n,")?.slice(0, -1) ?? [];
                console.log(imgIDs);
                // loadAndDisplayPictures(imgIDs, pictureIDName, pictureDivName);
                // fadeElement(d3.select('#'+d.target.name+'Circle'), false);
            })
            .on("mouseout", (d) => {
                TRANSITION_OFF = true;
                // fadeElement(d3.select('#'+d.target.name+'Circle'), true);
            });
            const config = {
                "avatar_size": 130//define the size of the circle radius
            };
            

        if (!defsLoaded) {
            const body = d3.select("body");
            const definitionSVG = body.append("svg");
            const defs = definitionSVG.append('svg:defs');
            ICON_DATA.forEach(function(d) {

                defs.append("svg:pattern")
                    .attr("id", d.name+"_icon")
                    .attr("patternContentUnits", "objectBoundingBox")
                    .attr("height", "1")
                    .attr("width",  "1")
                    .append("svg:image")
                    .attr("href", d.url)
                    .attr("height", "1")
                    .attr("width", "1");
                
                }
            )
            defsLoaded = true;
        }

        // Initialize the nodes
        
        var networkDataNode = svg
            .selectAll("circle")
            .data(networkData.nodes)
            .enter()
            .append("circle")
            .attr('id', (d) => {
                return d.name+'Circle'
            })
            .attr("r", .9* config.avatar_size / 2)
            .style("fill", (d) => {
                return "url(#"+d.name+"_icon)";
            })
            .on('mouseover',(d, i, n) => {
                const imgIDs = d['picIDs']?.split("\n,")?.slice(0, -1) ?? [];
                console.log(imgIDs);
                // loadAndDisplayPictures(imgIDs, pictureIDName, pictureDivName)
                // fadeElement(d3.select('#'+d.target.name+'Circle'), false);)
            })
            .on("mouseout", (d) => {
                TRANSITION_OFF = true;
                // fadeElement(d3.select('#'+d.target.name+'Circle'), true);
            });
        
        // This function is run at each iteration of the force algorithm, updating the nodes position.
        const networkTicked = () => {
            networkDataLink
                .attr("x1", (d) => { return d.source.x; })
                .attr("y1", (d) => { return d.source.y; })
                .attr("x2", (d) => { return d.target.x; })
                .attr("y2", (d) => { return d.target.y; });
        
            networkDataNode
                .attr("cx", (d) =>  { return d.x+1; })
                .attr("cy", (d) => { return d.y-1; })
                

            
        };

        const totalTicked = () => {
            networkDataLink
                .attr("x1", (d) => { return d.source.x; })
                .attr("y1", (d) => { return d.source.y; })
                .attr("x2", (d) => { return d.target.x; })
                .attr("y2", (d) => { return d.target.y; });
            networkDataNode
                .attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y; });
        };

        // Let's list the force we wanna apply on the network
        if (clientName == 'total') {
            var networkDataSimulation = d3.forceSimulation(networkData.nodes)
                .force("charge", d3.forceCollide().radius(50))
                .force("r", d3.forceRadial((d) => { 
                    return 200;
                }))
                .force("link", d3.forceLink()                               // This force provides links between nodes
                    .id((d) => { return d.id; })                     // This provide  the id of a node
                    .links(networkData.links) 
                    .strength(() => {return 0;})                                   // and this the list of links
            )

                .on("tick", totalTicked)
                .alphaTarget(0.1);
        } else {
            var networkDataSimulation = d3.forceSimulation(networkData.nodes)                 // Force algorithm is applied to data.nodes
            .force("link", d3.forceLink()                               // This force provides links between nodes
                    .id((d) => { return d.id; })                     // This provide  the id of a node
                    .links(networkData.links)                                    // and this the list of links
            )
            .force("charge", d3.forceManyBody().strength(-4000))         // This adds repulsion between nodes. Play with the -400 for the repulsion strength
            .force("center", d3.forceCenter(networkWidth/2, networkHeight/2))     // This force attracts nodes to the center of the svg area
            .on("tick", networkTicked)
            .alphaTarget(0.1);
        }
        
        
        
    
    });
};

const processData = (clientName, data) => {
    const networkData = {'nodes':[], 'links':[]};
    for (let name_i=0; name_i < NAMES.length; name_i++) {
        networkData['nodes'].push({
            'id': name_i,
            'name': NAMES[name_i]
        });
    }
    var mostPicIDs = 0;
    var pw_row;
    for (let pw_data_i = 0; pw_data_i < data.length; pw_data_i++) {
        pw_row = data[pw_data_i];
        if (pw_row['client'] == clientName || clientName == 'total') {
            for (targetName in pw_row) {
                if (targetName == 'client' || targetName == clientName) {
                    continue;
                }
                const picIdLength = pw_row[targetName].split("\n,").slice(0,-1).length;
                
                if (picIdLength > mostPicIDs) {
                    mostPicIDs = picIdLength;
                }
                networkData['links'].push({
                    "source": getIDFromName(pw_row['client'], networkData['nodes']),
                    "target": getIDFromName(targetName, networkData['nodes']),
                    "picIDs": pw_row[targetName]
                });
            }
        }
    }
    return {'data':networkData, 'mostPicIDs':mostPicIDs};
};

const getIDFromName = (name, nodeList) => {
    for (let node_i=0; node_i < nodeList.length; node_i++) {
        if (name == nodeList[node_i].name) {
            return nodeList[node_i].id
        }
    }
};

const fadeElement = (element, IN) => {
    if (IN) {
       element
            .transition()
            .duration(300)
            .style('opacity', 1)
    } else {
        element
            .transition()
            .duration(300)
            .style('opacity', .8)
    }
    
}