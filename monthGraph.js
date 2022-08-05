const MONTHS = ['August','September', 'October', 'November', 'December', 'January', 'February', 'March', 'April', 'May', 'June'];
const shortenedMonths = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
const CLIENT_NAME = 'me';
var USER;
var CURRENT_SUBJECT_OR_TAKER = 'photoTaker';
var TRANSITION_OFF = true;
const IMG_CONTAINER_REF = [];
$(".slide-in-out-photoTaker").toggleClass("slide");

// var monthGraphMargin = {top: 30, right: 30, bottom: 70, left: 60},
//     width = 600 - monthGraphMargin.left - monthGraphMargin.right,
//     height = 400 - monthGraphMargin.top - monthGraphMargin.bottom;


const monthGraphWidth = 550
const monthGraphHeight = 380
const monthGraphMargin = {top: 10, right: 10, bottom: 40, left: 40};

// append the svg object to the body of the page
var monthGraphSVG = d3.select("#monthGraph")
    .append("svg")
    .classed("centeredSVG", true)
    .attr("height", monthGraphHeight+monthGraphMargin.top+monthGraphMargin.bottom)
    .attr("width", monthGraphWidth+monthGraphMargin.left + monthGraphMargin.left)
    .append("g")
    .attr("transform", "translate("+monthGraphMargin.left+","+monthGraphMargin.top+")");

var monthGraphX = d3.scaleBand()
    .range([ 0, monthGraphWidth ])
    .padding(0.2);

var monthGraphXAxis = monthGraphSVG.append("g")
    .attr("class", "monthGraphXAxis")
    .attr("transform", "translate(0," + monthGraphHeight + ")");

var SUBJECT_OR_TAKER;
    
var monthGraphY = d3.scaleLinear()
    .range([ monthGraphHeight, 0]);


var monthGraphYAxis = monthGraphSVG.append("g")
    .attr("class", "monthGraphYAxis");

const drawBarGraph = (clientName, subjectOrTaker) => {
    if (subjectOrTaker != CURRENT_SUBJECT_OR_TAKER) {
        $(".slide-in-out-photoTaker").toggleClass("slide");
        $(".slide-in-out-subject").toggleClass("slide");
        CURRENT_SUBJECT_OR_TAKER = subjectOrTaker;
    }
     

    d3.csv("/scripts/data/pictureBySubjectByMonth.csv", (asPhotoTakerData) => {
        d3.csv("/scripts/data/pictureOfSubjectByMonth.csv", (asSubjectData) => {
            const clientData = [];
            for (let pt_data_i = 0; pt_data_i < asPhotoTakerData.length; pt_data_i++) {
                const pt_d = asPhotoTakerData[pt_data_i];
                if (pt_d.photoTaker == clientName) {
                    for (let s_data_i = 0; s_data_i < asSubjectData.length; s_data_i++) {
                        const s_d = asSubjectData[s_data_i];
                        if (s_d.subject == clientName) {
                            for (let month_i = 0; month_i < MONTHS.length; month_i++) {
                                clientData.push({'month': shortenedMonths[month_i], 'photoTaker': pt_d[MONTHS[month_i]], 'subject': s_d[MONTHS[month_i]]});
                            }
                        }
                    }
                }
            }
            
            // X axis
            monthGraphX.domain(clientData.map((d) => { return d.month; }));
            monthGraphXAxis.transition().duration(1000).call(d3.axisBottom(monthGraphX))
                .selectAll("text")  
                .style("text-anchor", "end")
                .attr("transform", "rotate(-65)");

            // Add Y axis
            monthGraphY.domain([0, d3.max(clientData, (d) => { 
                return +(d[subjectOrTaker].split(",").length-1)
            }) ]);
            monthGraphYAxis.transition().duration(1000).call(d3.axisLeft(monthGraphY));

            // variable u: map data to existing bars
            var u = monthGraphSVG.selectAll("rect")
                .data(clientData);
            const bar_color = "#69b3a2"
            // We use a list here only so we can reference an object from deeper scope
            u
                .enter()
                .append("rect")
                .on("mouseover", (d, i, n) => {
                    const imgIDs = d[CURRENT_SUBJECT_OR_TAKER].split(",").slice(0, -1);
                    loadAndDisplayPictures(imgIDs, "monthGraph", "month");
                    fadeElement(d3.select(n[i]), false)
                })
                .on("mouseout", (_, i, n) => {
                    TRANSITION_OFF = true;
                    console.log('mouseout');
                    fadeElement(d3.select(n[i]), true)
                })
                .merge(u)
                .transition()
                .duration(1000)
                    .attr("x", (d) => { return monthGraphX(d.month); })
                    .attr("y", (d) => { return monthGraphY(d[subjectOrTaker].split(",").length-1); })
                    .attr("width", monthGraphX.bandwidth())
                    .attr("height", (d) => { return monthGraphHeight - monthGraphY(d[subjectOrTaker].split(",").length-1); })
                    .attr("fill", bar_color);
        });
    });
}

drawBarGraph(CLIENT_NAME, 'photoTaker');


const loadAndDisplayPictures = (imgIDs, pictureIDName, pictureDivName) => {
    TRANSITION_OFF = false;
    var timer = 0;
    var imgIDs_i = 0;
    return gapi.client.photoslibrary.mediaItems.get({ //initial load
        'mediaItemId':imgIDs[imgIDs_i]
    }).then((response) => {
        var urlToDisplay = response.result.baseUrl;
        IMG_CONTAINER_REF[0]?.remove();
        animatePicture(urlToDisplay, pictureIDName, pictureDivName);
        const imgCycler = setInterval(()=> {
            if (timer > 350) {
                timer = 0;
                console.log('image change!');
                imgIDs_i++;
                if (imgIDs_i == imgIDs.length) {
                    imgIDs_i = 0;
                }
                $("#"+pictureIDName + "Photo").animate({
                    opacity: 0
                }, 400, () => {
                    IMG_CONTAINER_REF[0].remove();
                    gapi.client.photoslibrary.mediaItems.get({ //initial load
                        'mediaItemId':imgIDs[imgIDs_i]
                    }).then((response) => {
                        urlToDisplay = response.result.baseUrl;
                        animatePicture(urlToDisplay, pictureIDName, pictureDivName);
                    }, (err) => {
                        console.err('GP request err:', err);
                    });
                });
            } else if (TRANSITION_OFF) {
                clearInterval(imgCycler);
                $("#"+pictureIDName + "Photo").animate({
                    opacity: 0
                }, 400, () => {
                    IMG_CONTAINER_REF[0].remove();
                });
            }
            timer++
        }, 10);
    }, (err) => {
        console.error('GP load error:', err);
    });
}

const animatePicture = (urlToDisplay, photoIDName, photoDivName) => {
    IMG_CONTAINER_REF[0] = ($("<img class='displayedPhoto' id='"+photoIDName+"Photo' src='"+urlToDisplay+"'/>").prependTo("#"+photoDivName + "Photos"));
    $("#"+photoIDName+"Photo").on("load", () => {
        $("#"+photoIDName+"Photo").animate({
            opacity: 1
        }, 400);
    });
}