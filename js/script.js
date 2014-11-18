var w = window.innerWidth > 1440 ? 1440 : (window.innerWidth || 1440),
        h = window.innerHeight > 900 ? 900 : (window.innerHeight || 900),
        radius = 5.25,
        links = [],
        simulate = true,
        zoomToAdd = true,
        color = d3.scale.quantize().domain([10000, 7250]).range(["#BADEB7","#92D5DC","#FCF1B9", "#F4768B", "#EF4258","#51DBE2"])
 
    var numVertices = (w*h) / 40000;
    var maxVertices = 30;
    var vertices = d3.range(numVertices).map(function(i) {
        angle = radius * (i+20);
        return {x: angle*Math.cos(angle)+(w/2), y: angle*Math.sin(angle)+(h/2)};
    });
    var d3_geom_voronoi = d3.geom.voronoi().x(function(d) { return d.x; }).y(function(d) { return d.y; })
    var prevEventScale = 1;
    var zoom = d3.behavior.zoom().on("zoom", function(d,i) {
        if (zoomToAdd){
          if (d3.event.scale > prevEventScale && vertices.length < maxVertices)  {
              angle = radius * vertices.length;
              vertices.push({x: angle*Math.cos(angle)+(w/2), y: angle*Math.sin(angle)+(h/2)})
          } else if (vertices.length > 2 && d3.event.scale != prevEventScale) {
              vertices.pop();
          }
          force.nodes(vertices).start()
        } else {
          if (d3.event.scale > prevEventScale) {
            radius+= .01
          } else {
            radius -= .01
          }
          vertices.forEach(function(d, i) {
            angle = radius * (i+10);
            vertices[i] = {x: angle*Math.cos(angle)+(w/2), y: angle*Math.sin(angle)+(h/2)};
          });
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
 
    var circle = svg.selectAll("circle");
    var path = svg.selectAll("path");
    var link = svg.selectAll("line");
 
    function update(e) {
        path = path.data(d3_geom_voronoi(vertices))
        path.enter().append("path")
            // drag node by dragging cell
            .call(d3.behavior.drag()
              .on("drag", function(d, i) {
                  vertices[i] = {x: vertices[i].x + d3.event.dx, y: vertices[i].y + d3.event.dy}
              })
            )
            .style("fill", function(d, i) { return color(0) })
        path.attr("d", function(d) { return "M" + d.join("L") + "Z"; })
            .transition().duration(150).style("fill", function(d, i) { return color(d3.geom.polygon(d).area()) })
        path.exit().remove();
 
        circle = circle.data(vertices)
        circle.enter().append("circle")
              .attr("r", 0)
              .transition().duration(1000).attr("r", 5);
        circle.attr("cx", function(d) { return d.x; })
              .attr("cy", function(d) { return d.y; });
        circle.exit().transition().attr("r", 0).remove();
        
        /*circle.enter.append("svg:text").text("Hello!");*/

        link = link.data(d3_geom_voronoi.links(vertices))
        link.enter().append("line")
        link.attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; })
 
        link.exit().remove()
 
        if(!simulate) force.stop()
    }