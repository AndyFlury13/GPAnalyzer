const MONTHS = ['August','September', 'October', 'November', 'December', 'January', 'February', 'March', 'April', 'May', 'June'];
const CLIENT_NAME = 'me';
var USER;
var TRANSITION_OFF = true;

var monthGraphMargin = {top: 30, right: 30, bottom: 70, left: 60},
    width = 600 - monthGraphMargin.left - monthGraphMargin.right,
    height = 400 - monthGraphMargin.top - monthGraphMargin.bottom;

// append the svg object to the body of the page
var monthGraphSVG = d3.select("#my_dataviz")
    .append("svg")
    .attr("width", width + monthGraphMargin.left + monthGraphMargin.right)
    .attr("height", height + monthGraphMargin.top + monthGraphMargin.bottom)
    .append("g")
    .attr("transform",
        "translate(" + monthGraphMargin.left + "," + monthGraphMargin.top + ")");

var monthGraphX = d3.scaleBand()
    .range([ 0, width ])
    .padding(0.2);

var monthGraphXAxis = monthGraphSVG.append("g")
    .attr("transform", "translate(0," + height + ")");

var SUBJECT_OR_TAKER;
    
var monthGraphY = d3.scaleLinear()
    .range([ height, 0]);

var monthGraphYAxis = monthGraphSVG.append("g")
    .attr("class", "monthGraphYaxis");

const aspect = width/height, chart = d3.select('#my_dataviz');

const drawBarGraph = (clientName, subjectOrTaker) => {
    SUBJECT_OR_TAKER = subjectOrTaker;
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
                                clientData.push({'month': MONTHS[month_i], 'photoTaker': pt_d[MONTHS[month_i]], 'subject': s_d[MONTHS[month_i]]});
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
                .style("font", "26px times")
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
            var imgContainerRef = [null]; // We use a list here only so we can reference an object from deeper scope
            // var imgTransitionRef = [null];
            // var imgClearRef = [null];
            var transitionOff = true;
            u
                .enter()
                .append("rect")
                .on("mouseover", (d) => {
                    console.log('mouse over');
                    transitionOff = false;
                    const imgIDs = d[SUBJECT_OR_TAKER].split(",").slice(0, -1);
                    var timer = 0;
                    var imgIDs_i = 0;
                    return gapi.client.photoslibrary.mediaItems.get({ //initial load
                        'mediaItemId':imgIDs[imgIDs_i]
                    }).then((response) => {
                        var urlToDisplay = response.result.baseUrl;
                        imgContainerRef[0]?.remove();
                        animatePicture(imgContainerRef, urlToDisplay);
                        const imgCycler = setInterval(()=> {
                            if (timer > 150) {
                                timer = 0;
                                console.log('image change!');
                                imgIDs_i++;
                                if (imgIDs_i == imgIDs.length) {
                                    imgIDs_i = 0;
                                }
                                $("#monthGraphPicture").animate({
                                    opacity: 0
                                }, 400, () => {
                                    imgContainerRef[0].remove();
                                    gapi.client.photoslibrary.mediaItems.get({ //initial load
                                        'mediaItemId':imgIDs[imgIDs_i]
                                    }).then((response) => {
                                        urlToDisplay = response.result.baseUrl;
                                        animatePicture(imgContainerRef, urlToDisplay);
                                    }, (err) => {
                                        console.err('GP request err:', err);
                                    });
                                });
                            } else if (transitionOff) {
                                clearInterval(imgCycler);
                                $("#monthGraphPicture").animate({
                                    opacity: 0
                                }, 400, () => {
                                    imgContainerRef[0].remove();
                                    
                                    console.log(imgContainerRef);
                                });
                            }
                            timer++
                        }, 10);
                }, (err) => {
                    console.error('GP load error:', err);
                });
                })
                .on("mouseout", (d) => {
                    console.log('mouse out');
                    transitionOff = true;
                })
                .merge(u)
                .transition()
                .duration(1000)
                    .attr("x", (d) => { return monthGraphX(d.month); })
                    .attr("y", (d) => { return monthGraphY(d[subjectOrTaker].split(",").length-1); })
                    .attr("width", monthGraphX.bandwidth())
                    .attr("height", (d) => { return height - monthGraphY(d[subjectOrTaker].split(",").length-1); })
                    .attr("fill", bar_color);
        });
    });
}

drawBarGraph(CLIENT_NAME, 'photoTaker');


// Load images from the Google API
const loadPictures = async (imgIDs, imgContainerRef, imgTransitionRef, imgClearRef) => {
    
    clearInterval(imgClearRef[0])
    imgClearRef[0] = null;
    if (imgIDs.length == 0) {
        alert("No images found");
    }
    var imgIDs_i = 0;
    console.log(imgIDs);
    return gapi.client.photoslibrary.mediaItems.get({ //initial load
        'mediaItemId':imgIDs[imgIDs_i]
    }).then(
        (response) => {
            // Handle the results here (response.result has the parsed body).
            var urlToDisplay = response.result.baseUrl;
            
            animatePicture(imgContainerRef, urlToDisplay);
            const imgTimeLimit = 2;
            var timer = 0;
            const imgTransition = setInterval(() => {
                if (timer > imgTimeLimit) {

                    imgIDs_i++;
                    if (imgIDs_i == imgIDs.length) {
                        imgIDs_i = 0
                    }

                    gapi.client.photoslibrary.mediaItems.get({ //initial load
                        'mediaItemId':imgIDs[imgIDs_i]
                    }).then((response) => {
                        urlToDisplay = response.result.baseUrl;
                        imgContainerRef[0]?.animate({
                            opacity: 0
                        }, 400, () => {
                            imgContainerRef[0]?.remove();
                            imgContainerRef[0] = null;
                            animatePicture(imgContainerRef, urlToDisplay);
                            timer = 0;
                        });
                        
                    }, (err) => {
                        console.error("GP img request error:", err);
                    });  
                }
                timer++; 
            }, 800);
            imgTransitionRef[0] = imgTransition;
        }, 
        (err) => { 
            console.error("GP img request error:", err); 
        }
    );    
};

const animatePicture = (imgContainerRef, urlToDisplay) => {
    imgContainerRef[0] = ($("<img id='monthGraphPicture' src='"+urlToDisplay+"'/>").prependTo("#photoSpread"));
    $("#monthGraphPicture").on("load", () => {
        $("#monthGraphPicture").animate({
            opacity: 1
        }, 400);
    });
}

const clearPictures = async (imgContainerRef,imgTransitionRef, imgClearRef) => {
    clearInterval(imgTransitionRef[0]);
    imgClearRef[0] = setInterval(() => {
        console.log('img still being cleared');
        if (typeof imgContainerRef[0] !== 'undefined') {
            $("#monthGraphPicture").animate({
                opacity: 0
            }, 400, () => {
                imgContainerRef[0]?.remove();
                imgContainerRef[0] = null;
                clearInterval(imgTransitionRef[0]);
                clearInterval(imgClearRef[0]);
                imgTransitionRef[0] = null;
                console.log('month graph picture', imgContainerRef[0]);
            });
        }
    }, 10);
}