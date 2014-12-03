//jQuery(document).ready(function(){
var w = window.innerWidth > 1440 ? 1440 : (window.innerWidth || 1440),
        h = window.innerHeight > 900 ? 900 : (window.innerHeight || 900),
        radius = 5.25,
        links = [],
        simulate = true,
        zoomToAdd = true,
        color = d3.scale.quantize()
		.domain([10000, 7250])
		.range(["#BADEB7","#92D5DC","#FCF1B9", "#F4768B", "#EF4258","#51DBE2"]) // <= control flower's color !
    
    // Create static list of nodes
    var labels = ["Team", "Life", "Mind & Body", "Permaculture", "Play", "Robotics", "Programming", "Ecology", "Treks", "Fun", "Birds", "Medicinal Plants",
"Jigsaw", "Dance", "Wild goose chase"];
    var sparseFactor = 2; 	
    var numVertices = labels.length*sparseFactor;
    var minVertices = 7;
    var allNodes = d3.range(numVertices).map(function(i) {
        angle = radius * (i+20);
        var label = "";
        if (i%sparseFactor == 0) label = labels[i/sparseFactor];
        return {x: angle*Math.cos(angle)+(w/2), y: angle*Math.sin(angle)+(h/2), label:label};
    });

   // dynamic list of nodes.
   var vertices = allNodes.slice(0, minVertices);
   

    var d3_geom_voronoi = d3.geom.voronoi().x(function(d) { return d.x; }).y(function(d) { return d.y; })
    
    // for moving elements to top of canvas.
    d3.selection.prototype.moveToFront = function() {
	return this.each(function() {
	  this.parentNode.appendChild(this);
        });
    };

    var prevEventScale = 1;
    var zoom = d3.behavior.zoom().on("zoom", function(d,i) {
        if (zoomToAdd){
          if (d3.event.scale > prevEventScale && vertices.length < numVertices)  {
              angle = radius * (vertices.length + 20);
              var label =  "";
              if (vertices.length % sparseFactor == 0) label = labels[vertices.length/sparseFactor];
              vertices.push({x: angle*Math.cos(angle)+(w/2), y: angle*Math.sin(angle)+(h/2), label:label})
          } else if (vertices.length > minVertices && d3.event.scale != prevEventScale) {
              vertices.pop();
          }
          force.nodes(vertices).start()
        } 
         prevEventScale = d3.event.scale;
    });
 

    var svg = d3.select("#chart")
            .append("svg")
            .attr("width", w)
            .attr("height", h)
            .call(zoom)
 
    var force = d3.layout.force()
            .charge(-300)
            .size([w, h])
            .on("tick", update);
 
    force.nodes(vertices).start();

    var node = svg.selectAll(".node");
    var path = svg.selectAll("path");
    var link = svg.selectAll("link");
 
    function update(e) {
        path = path.data(d3_geom_voronoi(vertices))
        path.enter().append("path")
            .style("fill", function(d, i) { return color(0) })
        path.attr("d", function(d) { return "M" + d.join("L") + "Z"; })
            .transition().duration(150).style("fill", function(d, i) { return color(d3.geom.polygon(d).area()) })
        path.exit().remove();
        
        link = link.data(d3_geom_voronoi.links(vertices))
        link.enter().append("line")
        link.attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; })
 
        link.exit().remove();

	// add group nodes.
        node = node.data(force.nodes());
	node.enter().append("g")
            .attr("class", "node");

        node.exit().remove();
     
        // add text
        node.append("text")
            .attr("x", 12)
            .attr("dy", ".35em")
            .text(function(d){return d.label;})
            .on("click", function(d) {alert("Hello, " + d.label + "!"); });

	// bring existing text labels to top.
	node.select("text").moveToFront();			

        // Move texts.
      node.attr("transform", function(d){
	return "translate(" + d.x + "," + d.y + ")";});   	

        if(!simulate) force.stop()
    }

//});
