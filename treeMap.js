var treeMapMargin = {top: 10, right: 10, bottom: 10, left: 10},
  treeMapWidth = 555 - treeMapMargin.left - treeMapMargin.right,
  treeMapHeight = 1045 - treeMapMargin.top - treeMapMargin.bottom;

// append the svg object to the body of the page
var treeMapSVG = d3.select("#categoryGraph")
    .append("svg")
    .attr("width", treeMapWidth + treeMapMargin.left + treeMapMargin.right)
    .attr("height", treeMapHeight + treeMapMargin.top + treeMapMargin.bottom)
    .append("g")
    .attr("transform",
            "translate(" + treeMapMargin.left + "," + treeMapMargin.top + ")");

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
                    console.log(category)
                    if (category == 'client') {
                        continue;
                    }
                    console.log(row[category]);
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
            .size([width, height])
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
            .attr('width', function (d) { return d.x1 - d.x0 + 1000; })
            .attr('height', function (d) { return (d.y1 - d.y0) + 200; })
            .style("stroke", "white")
            .style("fill", "slateblue")
            .on('mouseover', (d) => {
                const imgIDs = d['picIDs']?.split(",")?.slice(0, -1) ?? [];
                console.log(imgIDs);
                loadAndDisplayPictures(imgIDs, 'categoryGraphPhoto', 'categoryPhotos')
            })
            .on('mouseout', (d) => {
                TRANSITION_OFF = true;
            })

        // and to add the text labels
        treeMapSVG
            .selectAll("text")
            .data(root.leaves())
            .enter()
            .append("text")
            .attr("x", function(d){ return d.x0+5})    // +10 to adjust position (more right)
            .attr("y", function(d){ return d.y0+20})    // +20 to adjust position (lower)
            .text(function(d){ return d.data.name })
            .attr("font-size", "15px")
            .attr("fill", "white")
    });
}

drawTreeMap(CLIENT_NAME);