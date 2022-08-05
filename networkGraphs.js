// set the dimensions and margins of the graph
var networkMargin = {top:0, right: 0, bottom: 0, left: 0},
  networkWidth = 550,
  networkHeight = 550;


const NAMES = ['me', 'girlBoss', 'shirleyWhirley', 'dumbestKid', 'yuppie', 'bugBoy', 'emily', 'other', 'jiusus', 'chimu']
// append the svg object to the body of the page
var picturedWithSVG = d3.select("#picturedWithGraph")
    .append("svg")
    .classed("centeredSVG", true)
    .attr("height", networkHeight+networkMargin.bottom+networkMargin.top)
    .attr("width", networkWidth+networkMargin.left+networkMargin.right)
    .append("g")
    .attr("transform", "translate("+networkMargin.left+","+networkMargin.top+")");


var takerSubjectSVG = d3.select("#takerSubjectGraph")
    .append("svg")
    .classed("centeredSVG", true)
    .attr("height", networkHeight+networkMargin.bottom+networkMargin.top)
    .attr("width", networkWidth+networkMargin.left+networkMargin.right)
    .append("g")
    .attr("transform", "translate("+networkMargin.left+","+networkMargin.top+")");

var ICON_DATA = [];
var defsLoaded = false;

const drawNetwork = (clientName, dataFileName, svg, pictureIDName, pictureDivName) => {
    d3.csv("/scripts/data/"+dataFileName+".csv", (data) => {
        const networkData = {"nodes": [], "links":[]};
    
        var pw_row;
        var mostPicIDs = 0;
        networkData['nodes'].push({
            'id': 0,
            'name': clientName
        });
        var name_i = 1;

        for (let pw_data_i = 0; pw_data_i < data.length; pw_data_i++) {
            pw_row = data[pw_data_i];
            if (pw_row['client'] == clientName) {
                for (targetName in pw_row) {
                    if (targetName == 'client' || targetName == clientName) {
                        continue;
                    }
                    const picIdLength = pw_row[targetName].split("\n,").slice(0,-1).length;
                    
                    if (picIdLength > mostPicIDs) {
                        mostPicIDs = picIdLength;
                    }
                    networkData['links'].push({
                        "source": 0,
                        "target": name_i,
                        "picIDs": pw_row[targetName]
                    })
                    networkData['nodes'].push({
                        id: name_i,
                        'name': targetName,
                        'picIDs': pw_row[targetName]
                    })
                    name_i++;
                }
            }
        }

        const maxLinkWidth = 20;
        // Initialize the links
        var networkDataLink = svg
            .selectAll("line")
            .data(networkData.links)
            .enter()
            .append("line")
            .style("stroke", "#aaa")
            .style("stroke-width", (d) => {
                const numPicIDs = d['picIDs']?.split("\n,")?.slice(0, -1)?.length ?? 0
                return maxLinkWidth * numPicIDs / mostPicIDs;
            })
            .on("mouseover", (d, i, n) => {
                const imgIDs = d['picIDs']?.split("\n,")?.slice(0, -1) ?? [];
                console.log(imgIDs);
                loadAndDisplayPictures(imgIDs, pictureIDName, pictureDivName);
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
            // .attr("cx", .6*config.avatar_size / 2)
            // .attr("cy", .6*config.avatar_size / 2)
            .style("fill", (d) => {
                return "url(#"+d.name+"_icon)";
            })
            .on('mouseover',(d, i, n) => {
                const imgIDs = d['picIDs']?.split("\n,")?.slice(0, -1) ?? [];
                console.log(imgIDs);
                loadAndDisplayPictures(imgIDs, pictureIDName, pictureDivName)
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

        // Let's list the force we wanna apply on the network
        var networkDataSimulation = d3.forceSimulation(networkData.nodes)                 // Force algorithm is applied to data.nodes
            .force("link", d3.forceLink()                               // This force provides links between nodes
                    .id((d) => { return d.id; })                     // This provide  the id of a node
                    .links(networkData.links)                                    // and this the list of links
            )
            .force("charge", d3.forceManyBody().strength(-5000))         // This adds repulsion between nodes. Play with the -400 for the repulsion strength
            .force("center", d3.forceCenter(networkWidth/2, networkHeight/2))     // This force attracts nodes to the center of the svg area
            .on("end", networkTicked);
        
        
    
    });
};


const getIDFromName = (name, nodeList) => {
    for (let node_i=0; node_i < nodeList.length; node_i++) {
        if (name == nodeList[node_i].name) {
            return nodeList[node_i].id
        }
    }
    console.log(name);
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