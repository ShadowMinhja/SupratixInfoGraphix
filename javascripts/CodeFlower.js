var CodeFlower = function(selector, w, h) {
  this.w = w;
  this.h = h;

  d3.select(selector).selectAll("svg").remove();

  this.svg = d3.select(selector).append("svg:svg")
    .attr('width', w)
    .attr('height', h);

  this.svg.append("svg:rect")
    .style("stroke", "#999")
    .style("fill", "#fff")
    .attr('width', w)
    .attr('height', h);

  this.force = d3.layout.force()
    .on("tick", this.tick.bind(this))
    .charge(function(d) { return d._children ? -d.size / 100 : -40; })
    .linkDistance(function(d) { return d.target._children ? 80 : 25; })
    .size([h, w]);
  //Increase Length of Links
  this.force.linkDistance(250);
};

CodeFlower.prototype.update = function(json) {
  if (json) this.json = json;
  this.json.fixed = true;
  this.json.x = (this.w / 2);
  this.json.y = (this.h / 2);

  var nodes = this.flatten(this.json);
  var links = d3.layout.tree().links(nodes);
  var total = nodes.length || 1;

  // remove existing text (will readd it afterwards to be sure it's on top)
  this.svg.selectAll("text").remove();

  // Restart the force layout
  //Note: Control Gravity Default: Math.atan(total / 50) / Math.PI * 0.4 --> 0.010164269466446359
  this.force
    .gravity(Math.atan(total / 50) / Math.PI * 0.4)
    .nodes(nodes)
    .links(links)
    .start();

  // Update the links
  this.link = this.svg.selectAll("line.link")
    .data(links, function(d) { return d.target.name; });

  // Enter any new links
  this.link.enter().insert("svg:line", ".node")
    .attr("class", "link")
    .attr("x1", function(d) { return d.source.x })
    .attr("y1", function(d) { return d.source.y; })
    .attr("x2", function(d) { return d.target.x; })
    .attr("y2", function(d) { return d.target.y; });

  // Exit any old links.
  this.link.exit().remove();

  // Update the nodes
  this.node = this.svg.selectAll("circle.node")
    .data(nodes, function(d) { return d.name; })
    .classed("collapsed", function(d) { return d._children ? 1 : 0; });

  this.node.transition()
    .attr("r", function(d) {
      return d.children ? 3.5 : Math.pow(d.size, 2/5) || 1;
    });

  // Enter any new nodes
  this.node.enter().append('svg:circle')
    .attr("class", "node")
    .classed('directory', function(d) { return (d._children || d.children) ? 1 : 0; })
    .attr("r", function(d) {
      //NOTE: Center Radius
      return d.children ? 65 : Math.pow(d.size, 2/5) || 1;
    })
    .style("fill", function color(d) {
      //NOTE: Style Color
      //return "hsl(" + parseInt(360 / total * d.id, 10) + ",90%,70%)";
      return "hsl(205,65%,50%)";
    })
    .call(this.force.drag)
    .on("click", this.click.bind(this))
    .on("mouseover", this.mouseover.bind(this))
    .on("mouseout", this.mouseout.bind(this));

  // Exit any old nodes
  this.node.exit().remove();

  // var circleNodes = this.svg.selectAll("circle.node");
  // for(var i = 0; i < circleNodes[0].length; i++) {
  //   var newElement = document.createElementNS("http://www.w3.org/2000/svg", 'text');
  //   newElement.setAttribute("id",'text_' + i);
  //   newElement.setAttribute("class",'nodetext');
  //   newElement.setAttribute("dy",0);
  //   newElement.setAttribute("dx",0);
  //   newElement.setAttribute("text-anchor","middle");
  //   var tSpan = document.createElementNS("http://www.w3.org/2000/svg", 'tspan');
  //   newElement.append(tSpan);
  //   newElement.append(tSpan);
  //   newElement.append(tSpan);
  //   newElement.append(tSpan);
  //   newElement.append(tSpan);
  //   newElement.append(tSpan);
  //   newElement.append(tSpan);
  //   newElement.append(tSpan);
  //   circleNodes[0][i].append(newElement);
  //   this.text.push(newElement);
  //
  // }
  // return this;
  this.text = [];
  for(var i = 0; i < nodes.length; i++) {
    var svgText = this.svg.append('svg:text')
      .attr('id', 'text_' + i)
      .attr('class', 'nodetext')
      .attr('dy', 0)
      .attr('dx', 0)
      .attr('text-anchor', 'middle')
    svgText.append('svg:tspan');
    svgText.append('svg:tspan');
    svgText.append('svg:tspan');
    svgText.append('svg:tspan');
    svgText.append('svg:tspan');
    svgText.append('svg:tspan');
    svgText.append('svg:tspan');
    svgText.append('svg:tspan');
    this.text.push(svgText);

  }
  return this;
};

CodeFlower.prototype.flatten = function(root) {
  var nodes = [], i = 0;

  function recurse(node) {
    if (node.children) {
      node.size = node.children.reduce(function(p, v) {
        return p + recurse(v);
      }, 0);
    }
    if (!node.id) node.id = ++i;
    nodes.push(node);
    return node.size;
  }

  root.size = recurse(root);
  return nodes;
};

CodeFlower.prototype.click = function(d) {
  // Toggle children on click.
  if (d.children) {
    d._children = d.children;
    d.children = null;
  } else {
    d.children = d._children;
    d._children = null;
  }
  this.update();
};

//NOTE: Mouseover events
CodeFlower.prototype.mouseover = function(d) {
  // this.text.attr('transform', 'translate(' + d.x + ',' + (d.y - 5 - (d.children ? 3.5 : Math.sqrt(d.size) / 2)) + ')')
  //   .text(d.name + ": " + d.size + " loc")
  //   .style('display', null);
};

CodeFlower.prototype.mouseout = function(d) {
  //this.text.style('display', 'none');
};

CodeFlower.prototype.tick = function() {
  var h = this.h;
  var w = this.w;
  this.link.attr("x1", function(d) { return d.source.x; })
    .attr("y1", function(d) { return d.source.y; })
    .attr("x2", function(d) { return d.target.x; })
    .attr("y2", function(d) { return d.target.y; });

  //Update Text Location on every tick
  for(var i = 0; i < this.json.children.length; i++) {
      var dot = this.json.children[i];
      var dotProps = Object.keys(dot);
      var dotValues = Object.values(dot);
      var subtitles = [];

      for(var j = 0; j < dotProps.length; j++){
        if(dotProps[j].indexOf("subtitle") != -1){
          subtitles.push(dotValues[j]);
        }
      }
      this.text[i].attr('transform', 'translate(' + dot.x + ',' + (dot.y - 5 - (dot.children ? 3.5 : Math.sqrt(dot.size) / 2)) + ')');
      var children = this.text[i][0][0].children;

      children[0].setAttribute('x','0');
      children[0].setAttribute('dy','0.75em');
      children[0].innerHTML = dot.name;

      if(subtitles.length > 0) {
        for(var k = 1; k < children.length; k++){
          children[k].setAttribute('x','0');
          children[k].setAttribute('dy', '0.75em');
          children[k].innerHTML = subtitles[k-1];
        }
      }
  }


  this.node.attr("transform", function(d) {
    if(d.name != "root") {
      return "translate(" + Math.max(5, Math.min(w - 5, d.x)) + "," + Math.max(5, Math.min(h - 5, d.y)) + ")";
    } else {
      return "translate(" + Math.max(5, Math.min(w - 5, d.x)) + "," + Math.max(5, Math.min(h - 5, d.y)) + ")";
    }
  });
};

CodeFlower.prototype.cleanup = function() {
  this.update([]);
  this.force.stop();
};
