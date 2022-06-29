MONTHS = ['August','September', 'October', 'November', 'December', 'January', 'February', 'March', 'April', 'May', 'June']
CLIENT_NAME = 'bugBoy'

var margin = {top: 30, right: 30, bottom: 70, left: 60},
    width = 700 - margin.left - margin.right,
    height = 700 - margin.top - margin.bottom;

// append the svg object to the body of the page
var svg = d3.select("#my_dataviz")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");
var x = d3.scaleBand()
    .range([ 0, width ])
    .padding(0.2);
var xAxis = svg.append("g")
    .attr("transform", "translate(0," + height + ")");

xAxis
    .selectAll("text")  
    .style("text-anchor", "end")
    .attr("transform", "rotate(-65)");
    

var y = d3.scaleLinear()
    .range([ height, 0]);
var yAxis = svg.append("g")
    .attr("class", "myYaxis");

function drawBarGraph(clientName, subjectOrTaker) {
    d3.csv("/scripts/data/pictureBySubjectByMonth.csv", function(subjectData) {
        d3.csv("/scripts/data/pictureOfSubjectByMonth.csv", function(photoTakerData) {
            const clientData = [];
            for (let pt_data_i = 0; pt_data_i < photoTakerData.length; pt_data_i++) {
                const pt_d = photoTakerData[pt_data_i];
                if (pt_d.photoTaker == clientName) {
                    for (let s_data_i = 0; s_data_i < subjectData.length; s_data_i++) {
                        const s_d = subjectData[s_data_i];
                        if (s_d.subject == clientName) {
                            for (let month_i = 0; month_i < MONTHS.length; month_i++) {
                                clientData.push({'month': MONTHS[month_i], 'photoTaker': pt_d[MONTHS[month_i]], 'subject': s_d[MONTHS[month_i]]});
                            }
                        }
                    }
                }
            }
        
            // X axis
            x.domain(clientData.map(function(d) { return d.month; }))
            xAxis.transition().duration(1000).call(d3.axisBottom(x))

            // Add Y axis
            y.domain([0, d3.max(clientData, function(d) { 
                return +(d[subjectOrTaker].split(",").length-1)
            }) ]);
            yAxis.transition().duration(1000).call(d3.axisLeft(y));

            // variable u: map data to existing bars
            var u = svg.selectAll("rect")
            .data(clientData)

            // update bars
            u
                .enter()
                .append("rect")
                .merge(u)
                .transition()
                .duration(1000)
                    .attr("x", function(d) { return x(d.month); })
                    .attr("y", function(d) { return y(d[subjectOrTaker].split(",").length-1); })
                    .attr("width", x.bandwidth())
                    .attr("height", function(d) { return height - y(d[subjectOrTaker].split(",").length-1); })
                    .attr("fill", "#69b3a2");
        });
    });
        
}

drawBarGraph(CLIENT_NAME, 'photoTaker');