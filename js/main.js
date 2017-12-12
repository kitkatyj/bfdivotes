var barWidth = 30; // Placeholder value for bar width
var heightMultiplier = 1; // For scaling

var votesData = []; // To store temporary data for manipulation by javascript

var episodesData = [];

var svg = d3.select("svg");
var controls = d3.select("#controls");
var controlsNode = document.getElementById("controls");
var tooltip = d3.select("#tooltip");
var tooltipNode = document.getElementById("tooltip");
var yAxisIncrement = 100;
var yAxisOffset = 25;

window.onload = init();

d3.selection.prototype.moveToFront = function() {  
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};
d3.selection.prototype.moveToBack = function() {  
    return this.each(function() { 
        var firstChild = this.parentNode.firstChild; 
        if (firstChild) { 
            this.parentNode.insertBefore(this, firstChild); 
        } 
    });
};

function init(){
    console.log('4: Pretty cool, don\'t you think?');
    
    if(window.innerWidth < 992 && controls.attr("class").indexOf("closed") !== -1){
        controls.style("max-height","0px");
    }
    else{
        controls.style("max-height","none");
    }

    d3.csv("../data/bfdi.csv",function(d){
        var svgWidth = document.getElementById("main").clientWidth;
        var rows = d.length;
        var cols = Object.keys(d[0]).length;
        
        barWidth = svgWidth/(cols-1);
        var xPos = barWidth/2;
        var yPos = new Array(cols).fill(cols);
        
        // Render checkboxes
        for(i = 0; i < d.length; i++){
            var controlLabel = controls.append("div").attr("class","col-xs-6 col-sm-3 col-md-6 col-lg-6")
                .append("label");
            
            controlLabel.append("input")
                .attr("type","checkbox")
                .attr("id","c"+i)
                .attr("class","character-checkbox")
                .attr("checked","true")
                .attr("onclick","updateData()");
            
            controlLabel.append("p").text(d[i].Contestant);
            controlLabel.append("span").attr("class","checkmark");
        }

        // Render x axis
        for(i = 1; i < cols; i++){
            svg.append("text")
                .attr("class","xA")
                .attr("x",xPos)
                .attr("y",20)
                .attr("font-size", "12px")
                .text(Object.keys(d[0])[i]);
            xPos += barWidth;
        }
        
        var maxXPos = xPos;
        xPos = 0;

        d.forEach(function(c,i){
            votesData[i] = [];
            for(j = 1; j < Object.keys(c).length; j++){
                var votes = parseFloat(Object.values(c)[j]);
                if(isNaN(votes)) votes = 0;
                
                if(episodesData[j-1] === undefined){
                    episodesData[j-1] = votes;
                }
                else{
                    episodesData[j-1] += votes;
                }
                
                var barHeight = votes * heightMultiplier;
                svg.append("rect")
                    .attr("x",xPos)
                    .attr("y",yAxisOffset)
                    .attr("id","a"+i+"-"+j)
                    .attr("class",c.Contestant)
                    .attr("width",barWidth)
                    .attr("height",0)
                    .attr("fill",getContestantColor(c.Contestant))
                    .attr("stroke","rgb(255,255,0)")
                    .attr("stroke-width","0")
                    .attr("data-votes",votes)
                    .attr("data-episode",j)
                    .on("mouseover",handleMouseOver)
                    .on("mousemove",handleMouseMove)
                    .on("mouseout",handleMouseOut);
                votesData[i][j-1] = [barHeight,yPos[j]];
                xPos += barWidth;
                yPos[j] += barHeight;
            }
            xPos = 0;
        });

        var maxYPos = yPos.reduce(function(a,b){
            return Math.max(a,b);
        });
        if(maxYPos < window.innerHeight){
            maxYPos = window.innerHeight;
        }
        
        for(tempY = yAxisOffset, i = 0; tempY <= maxYPos; tempY += yAxisIncrement, i++){
            if(tempY != yAxisOffset){
                svg.append("text")
                    .attr("x",4)
                    .attr("y",tempY * heightMultiplier - 4)
                    .attr("text-anchor","start")
                    .attr("font-size", "12px")
                    .attr("fill","rgba(0,0,0,0.8)")
                    .attr("class","yText")
                    .attr("id","yA"+i)
                    .text(tempY-yAxisOffset);
                svg.append("line")
                    .attr("x1",0).attr("y1",tempY * heightMultiplier)
                    .attr("x2",maxXPos).attr("y2",tempY * heightMultiplier)
                    .attr("stroke-width","1")
                    .attr("stroke","rgba(0,0,0,0.1)")
                    .attr("id","yL"+i)
                    .moveToBack();
            }
        }

        svg.transition().duration(1000).attr("height",maxYPos);

        animateGraph(votesData);
        window.addEventListener("resize",resizeGraph);
    });
}

function updateData(){
    d3.csv("../data/bfdi.csv",function(d){
        var svgWidth = document.getElementById("main").clientWidth;
        var rows = d.length;
        var cols = Object.keys(d[0]).length;
        
        barWidth = svgWidth/(cols-1);
        var xPos = barWidth/2;
        var yPos = new Array(cols).fill(cols);

        d.forEach(function(c,i){
            votesData[i] = [];
            for(j = 1; j < Object.keys(c).length; j++){
                var barHeight = parseFloat(Object.values(c)[j]) * heightMultiplier;
                if(isNaN(barHeight)) barHeight = 0;
                if(document.getElementById("c"+i).checked) {
                    votesData[i][j-1] = [barHeight,yPos[j]];
                    xPos += barWidth;
                    yPos[j] += barHeight;
                    document.getElementById("c"+i).parentElement.setAttribute("class","active");
                }
                else {
                    votesData[i][j-1] = [0,yPos[j]];
                    document.getElementById("c"+i).parentElement.setAttribute("class","");
                }
            }
            xPos = 0;
        });
        
        var yDivisions = document.getElementsByClassName("yText").length;
        for(i = 1; i <= yDivisions; i++){
            svg.select("#yA"+i).transition().duration(1000)
                .attr("y",i * yAxisIncrement * heightMultiplier + yAxisOffset);
            svg.select("#yL"+i).transition().duration(1000)
                .attr("y1",i * yAxisIncrement * heightMultiplier + yAxisOffset)
                .attr("y2",i * yAxisIncrement * heightMultiplier + yAxisOffset);
        }
        
        var maxYPos = yPos.reduce(function(a,b){
            return Math.max(a,b);
        });
        if(maxYPos < window.innerHeight){
            maxYPos = window.innerHeight;
        }
        
        svg.transition().duration(1000).attr("height",maxYPos);

        animateGraph(votesData);
    });
}

function resizeGraph(){
    var svgWidth = document.getElementById("main").clientWidth;
    var cols = votesData[0].length;
    
    if(window.innerWidth < 992 && controls.attr("class").indexOf("closed") !== -1){
        controls.style("max-height","0px");
    }
    else{
        controls.style("max-height","none");
    }

    // Get width for bar based on width of SVG and number of columns
    barWidth = svgWidth/(cols);
    var textElements = document.getElementsByClassName("xA");
    var xPos = barWidth/2;
    for(i = 0; i < textElements.length; i++){
        textElements[i].setAttribute("x",xPos);
        xPos += barWidth;
    }
    xPos = 0;
    for(i = 0; i < votesData.length; i++){
        for(j = 0; j < votesData[i].length; j++){
            svg.select("#a"+i+"-"+(j+1))
                .attr("width",barWidth)
                .attr("x",xPos);
            xPos += barWidth;
        }
        xPos = 0;
    }
}

function animateGraph(data){
    for(i = 0; i < data.length; i++){
        for(j = 0; j < data[i].length; j++){
            svg.select("#a"+i+"-"+(j+1))
                .transition()
                .duration(1000)
                .attr("height",data[i][j][0])
                .attr("y",data[i][j][1]);
        }
    }
}

function getContestantColor(c){
    var color = "#000000"
    switch(c){
        case "Flower":      color = "#ff22ff"; break;
        case "Leafy":       color = "#51ff5d"; break;
        case "Firey":       color = "#ffa500"; break;
        case "Spongy":      color = "#ffee00"; break;
        case "Rocky":       color = "#939393"; break;
        case "David":       color = "#cccccc"; break;
        case "Bubble":      color = "#c9f0ff"; break;
        case "Pencil":      color = "#ffdc44"; break;
        case "Pen":         color = "#0087ff"; break;
        case "Tear Drop":   color = "#00b2ff"; break;
        case "Blocky":      color = "#ff493f"; break;
        case "Eraser":      color = "#ff87ed"; break;
        case "Ice Cube":    color = "#c1e8ff"; break;
        case "Tennis Ball": color = "#bfff77"; break;
        case "Coiny":       color = "#ffad2b"; break;
        case "Needle":      color = "#b5b5b5"; break;
        case "Match":       color = "#ffcd77"; break;
        case "Snowball":    color = "#e2e2e2"; break;
        case "Woody":       color = "#ffdb8e"; break;
        case "Pin":         color = "#ff2828"; break;
        case "Golf Ball":   color = "#c1c1c1"; break;
        case "Rec. Chars.": color = "#006801"; break;
    }
    return color;
}

function toggleControls(){
    if(controls.attr("class").indexOf("closed") === -1){
        controls.attr("class","closed");
        controls.style("max-height","0px");
    }
    else{
        controls.attr("class","");
        controls.style("max-height",controlsNode.scrollHeight+"px");
    }
}

function selectAll(toBeSelected){
    var checkboxes = document.getElementsByClassName("character-checkbox");
    for(i = 0; i < checkboxes.length; i++){
        if(toBeSelected === true)
            checkboxes[i].checked = true;
        else
            checkboxes[i].checked = false;
    }
    updateData();
}

function handleMouseOver(d,i){
    if(event.target.attributes.height.value != 0){
        d3.select(this).attr("stroke-width","2").moveToFront();
        tooltip.style("display","block");
    }
}

function handleMouseMove(d,i){
    var xOffset = 10;
    var yOffset = 20;
    if(window.innerWidth-event.clientX < tooltipNode.clientWidth*1.1){
        yOffset = 0;
        xOffset = -tooltipNode.clientWidth-5;
    }
    if(window.innerHeight-event.clientY < tooltipNode.clientHeight*1.1){
        yOffset = -tooltipNode.clientHeight;
    }
    
    var contestant = d3.select(this).attr("class");
    var votes = d3.select(this).attr("data-votes");
    var episode = d3.select(this).attr("data-episode");
    
    var percentageVotes = Math.round((parseInt(votes) / episodesData[parseInt(episode)-1])*1000)/10;
    
    tooltipHTML = "<h4>"+contestant+"</h4>";
    tooltipHTML += "<p>Votes received: <strong>"+votes+" ("+percentageVotes+"%)</strong></p>";
    tooltipHTML += "<p>Episode "+episode+"</p>";
    
    tooltip.html(tooltipHTML).style("top",(event.pageY+yOffset)+"px").style("left",(event.pageX+xOffset)+"px");
}

function handleMouseOut(d,i){
    d3.select(this).attr("stroke-width","0");
    tooltip.style("display","none");
}

function heightChange(){
    heightMultiplier = d3.select("#heightMultiplierControl").node().value;
    updateData();
}