// var treeMapMargin = {top: 10, right: 10, bottom: 10, left: 10},
//   treeMapWidth = 555 - treeMapMargin.left - treeMapMargin.right,
//   treeMapHeight = 1045 - treeMapMargin.top - treeMapMargin.bottom;

var treeMapWidth = 800;
var treeMapHeight= 650
// append the svg object to the body of the page
var treeMapSVG = d3.select("#categoryGraph")
    .append("div")
    .classed("svg-container", true) //container class to make it responsive
    .append("svg")
   //responsive SVG needs these 2 attributes and no width and height attr
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", "0 0 " + treeMapWidth.toString() + " "+ treeMapHeight.toString() +"")
   //class to make it responsive
    .classed("svg-content-responsive", true)
    // .append("svg")
    
    // .attr("preserveAspectRatio", "xMinYMin meet")
    // .attr("viewBox", "0 0 600 600")
    // .classed("svg-content", true)
    .append("g")
    .attr("transform",
            "translate(" + 0 + "," +50 + ")"); 

var treeMapTooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("text-align", "center")
    .style("margin", "auto");

// read json data
const drawTreeMap = (clientName) => {
    d3.csv("/scripts/data/subjectCategory.csv", function(data) {
        var clientData = {
            'children': []
        };
        var row;
        var numIDs;
        for (let row_i = 0; row_i < data.length; row_i++) {
            row = data[row_i];
            if (row['client'] == clientName) {
                for (category in row) {
                    if (category == 'client') {
                        continue;
                    }
                    numIDs = row[category]?.split(",")?.slice(0, -1)?.length ?? 0
                    if (numIDs == 0) {
                        continue
                    }
                    clientData['children'].push({
                        'name': category,
                        'value': numIDs,
                        'group': 'A',
                        'colname': 'level1',
                        'picIDs': row[category]
                    })
                }
            }
        }
        // Give the data to this cluster layout:
        var root = d3.hierarchy(clientData).sum(function(d){ return d.value}) // Here the size of each leave is given in the 'value' field in input data

        // Then d3.treemap computes the position of each element of the hierarchy
        d3.treemap()
            .size([treeMapWidth, treeMapWidth])
            .padding(2)
            (root)

        // use this information to add rectangles:
        treeMapSVG
            .selectAll("rect")
            .data(root.leaves())
            .enter()
            .append("rect")
            .attr('x', function (d) { return d.x0; })
            .attr('y', function (d) { return d.y0; })
            .attr('width', function (d) { return d.x1 - d.x0 + 0; })
            .attr('height', function (d) { return (d.y1 - d.y0) + 0; })
            .style("stroke", "white")
            .style("fill", "slateblue")
            .on('mouseenter', (d) => {
                const imgIDs = d['data']['picIDs']?.split(",")?.slice(0, -1) ?? [];
                console.log('mouseenter')
                loadAndDisplayPictures(imgIDs, 'categoryGraph', 'category');
                drawTooltip(treeMapTooltip, d['data']['name'], d3.event.x, d3.event.y);
            })
            .on('mousemove', (d) => {
                console.log('mousemove');
                drawTooltip(treeMapTooltip, d['data']['name'], d3.event.x, d3.event.y);
            })
            .on('mouseleave', () => {
                console.log('mouseleave');
                TRANSITION_OFF = true;
                clearTooltip(treeMapTooltip);
            });

        var bBox = treeMapSVG.node().getBBox();
    });
};

drawTreeMap(CLIENT_NAME);

const drawTooltip = (div, text, x, y) => {
    div
        .transition()
        .duration(100)
        .style("opacity", 1);
    div.html(text)
        .style("left", (x)+"px")
        .style("top", (y) + "px");
};

const updateTooltip  = (div, text, x, y) => {
    div.html(text)
        .style("left", (x)+"px")
        .style("top", (y) + "px");
};

const clearTooltip = (div) => {
    div
        .transition()
        .duration(100)
        .style("opacity", 0);
}