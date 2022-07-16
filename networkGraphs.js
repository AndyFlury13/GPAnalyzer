// set the dimensions and margins of the graph
var picturedWithMargin = {top:0, right: 0, bottom: 0, left: 0},
  picturedWithWidth = 500,
  picturedWithHeight = 500;


const NAMES = ['me', 'girlBoss', 'shirleyWhirley', 'dumbestKid', 'yuppie', 'bugBoy', 'emily', 'other', 'jiusus', 'chimu']
// append the svg object to the body of the page
var picturedWithSVG = d3.select("#picturedWithGraph")
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("id", "pwSVG")
    .append("g")
    .attr("transform",
            "translate(" + picturedWithMargin.left + "," + picturedWithMargin.top + ")");


var takerSubjectSVG = d3.select("#takerSubjectGraph")
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .append("g")
    .attr("transform",
            "translate(" + picturedWithMargin.left + "," + picturedWithMargin.top + ")");

var ICON_DATA = [];




const drawNetwork = (clientName, dataFileName, svg, pictureIDName, pictureDivName) => {
    d3.csv("/scripts/data/"+dataFileName+".csv", (data) => {
        var clientID;
        const picturedWithData = {"nodes": [], "links":[]};
    
        var pw_row;
        var mostPicIDs = 0;
        picturedWithData['nodes'].push({
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
                    picturedWithData['links'].push({
                        "source": 0,
                        "target": name_i,
                        "picIDs": pw_row[targetName]
                    })
                    picturedWithData['nodes'].push({
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
        var picturedWithLink = svg
            .selectAll("line")
            .data(picturedWithData.links)
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
                loadAndDisplayPictures(imgIDs, pictureIDName, pictureDivName)
                // fadeElement(d3.select('#'+d.target.name+'Circle'), false);
            })
            .on("mouseout", (d) => {
                TRANSITION_OFF = true;
                // fadeElement(d3.select('#'+d.target.name+'Circle'), true);
            });
        
            var config = {
                "avatar_size": 130//define the size of the circle radius
            };
              
            var body = d3.select("body");
              
            var definitionSVG = body.append("svg")
                .attr("width", 500)
                .attr("height", 500);
              
            var defs = definitionSVG.append('svg:defs');


            ICON_DATA.forEach(function(d) {
                defs.append("svg:pattern")
                    .attr("id", d.name+"_icon")
                    .attr("height", config.avatar_size)
                    .attr("width",  config.avatar_size)
                    .append("svg:image")
                    .attr("href", d.url)
                    .attr("width", config.avatar_size)
                    .attr("height", config.avatar_size)
                    .attr("preserveAspectRatio", "xMidYMid meet")
                    .attr("x", 0)
                    .attr("y", 0);
                
                }
            )

        // Initialize the nodes
        
        var picturedWithNode = svg
            .selectAll("circle")
            .data(picturedWithData.nodes)
            .enter()
            .append("circle")
            .attr('id', (d) => {
                return d.name+'Circle'
            })
            .attr("r", .9* config.avatar_size / 2)
            .attr("cx", .6*config.avatar_size / 2)
            .attr("cy", .6*config.avatar_size / 2)
            .style("fill", "#000")
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
        const picturedWithTicked = () => {
            picturedWithLink
                .attr("x1", (d) => { return d.source.x; })
                .attr("y1", (d) => { return d.source.y; })
                .attr("x2", (d) => { return d.target.x; })
                .attr("y2", (d) => { return d.target.y; });
        
            picturedWithNode
                .attr("cx", (d) =>  { return d.x+1; })
                .attr("cy", (d) => { return d.y-1; })
                

            
        };

        // Let's list the force we wanna apply on the network
        var picturedWithSimulation = d3.forceSimulation(picturedWithData.nodes)                 // Force algorithm is applied to data.nodes
            .force("link", d3.forceLink()                               // This force provides links between nodes
                    .id((d) => { return d.id; })                     // This provide  the id of a node
                    .links(picturedWithData.links)                                    // and this the list of links
            )
            .force("charge", d3.forceManyBody().strength(-5000))         // This adds repulsion between nodes. Play with the -400 for the repulsion strength
            .force("center", d3.forceCenter(picturedWithWidth/2+100, picturedWithHeight/2+50))     // This force attracts nodes to the center of the svg area
            .on("end", picturedWithTicked);
        
        
    
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