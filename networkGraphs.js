// set the dimensions and margins of the graph
var picturedWithMargin = {top: 10, right: 30, bottom: 30, left: 40},
  picturedWithWidth = 400 - picturedWithMargin.left - picturedWithMargin.right,
  picturedWithHeight = 400 - picturedWithMargin.top - picturedWithMargin.bottom;


const NAMES = ['me', 'GirlBoss', 'shirleyWhirley', 'dumbestKid', 'yuppie', 'bugBoy', 'emily', 'other', 'jiusus', 'chimu']
// append the svg object to the body of the page
var picturedWithSVG = d3.select("#picturedWithGraph")
.append("svg")
  .attr("width", picturedWithWidth + picturedWithMargin.left + picturedWithMargin.right)
  .attr("height", picturedWithHeight + picturedWithMargin.top + picturedWithMargin.bottom)
.append("g")
  .attr("transform",
        "translate(" + picturedWithMargin.left + "," + picturedWithMargin.top + ")");


const drawPWGraph = (clientName) => {
    d3.json("/scripts/data/pictureBySubjectByMonth.csv", (data) => {
        const picturedWithData = {"nodes": [], "links":[]};
        for (let names_i = 0; names_i < NAMES.length; names_i++) {
            picturedWithData['nodes'].push({
                "id": name_i,
                "name": NAMES[names_i]
            })
        } 
    
        var pw_row;
        for (let pw_data_i = 0; pw_data_i < data.length; pw_data_i++) {
            pw_row = data[pw_data_i];
            if (pw_row['client'] == clientName) {
                for (key in pw_row) {
                    picturedWithData['links'].push({
                        "source": clientName,
                        "target": key,
                        "picIds": pw_row[key]
                    })
                }
            }
        }
    
    
        console.log(data);
      // Initialize the links
      var picturedWithLink = picturedWithSVG
        .selectAll("line")
        .data(data.links)
        .enter()
        .append("line")
          .style("stroke", "#aaa")
    
      // Initialize the nodes
      var picturedWithNode = picturedWithSVG
        .selectAll("circle")
        .data(data.nodes)
        .enter()
        .append("circle")
          .attr("r", 20)
          .style("fill", "#69b3a2")
    
      // Let's list the force we wanna apply on the network
      var picturedWithSimulation = d3.forceSimulation(data.nodes)                 // Force algorithm is applied to data.nodes
          .force("link", d3.forceLink()                               // This force provides links between nodes
                .id((d) => { return d.id; })                     // This provide  the id of a node
                .links(data.links)                                    // and this the list of links
          )
          .force("charge", d3.forceManyBody().strength(-400))         // This adds repulsion between nodes. Play with the -400 for the repulsion strength
          .force("center", d3.forceCenter(picturedWithWidth / 2, picturedWithHeight / 2))     // This force attracts nodes to the center of the svg area
          .on("end", picturedWithTicked);
    
      // This function is run at each iteration of the force algorithm, updating the nodes position.
      const picturedWithTicked = () => {
        picturedWithLink
            .attr("x1", (d) => { return d.source.x; })
            .attr("y1", (d) => { return d.source.y; })
            .attr("x2", (d) => { return d.target.x; })
            .attr("y2", (d) => { return d.target.y; });
    
        picturedWithNode
             .attr("cx", (d) =>  { return d.x+6; })
             .attr("cy", (d) => { return d.y-6; });
      };
    
    });
};
