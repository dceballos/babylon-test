window.onload=function(){
  model = null;
  originalHeight = null;
  originalWidth  = null;
  init();
  animate();
}

function doHeightResize() {
  var scaler    = document.getElementById("hscaler");
  var value     = (scaler.value/100)+1;
  var newHeight = originalHeight*value;
  resizeHeight(newHeight, model);
}

function doWidthResize() {
  var scaler    = document.getElementById("wscaler");
  var value     = (scaler.value/100)+1;
  var newWidth  = originalWidth*value;
  resizeWidth(newWidth, model);
}

function resizeHeight(height, object) {
  // Frame, Rails, Panels
  // Translate then scale then adjust(translate)
  var ogObject              = object.clone();
  var factor                = height/meshHeight(object);
  var ogFrameBox            = meshBox(ogObject);
  var parts                 = meshesAsParts(object,false);
  var ogParts               = meshesAsParts(ogObject,true);
  var ogFrameHeight         = ogFrameBox.max.y-ogFrameBox.min.y;	
  var ogFrameWidth          = ogFrameBox.max.y-ogFrameBox.min.y;
  var ogVerticalFrameOffset = totalVerticalOffset(ogParts);
  var ogFrameDLO            = ogFrameHeight-ogVerticalFrameOffset;

  // Translate frame top parts
  var ftparts = Object.keys(parts.frame['top']).sort();
  ftparts.forEach(function(order) {
    var mesh      = parts.frame['top'][order];
    var newHeight = ogFrameHeight*factor;
    var newPos    = ((newHeight-ogFrameHeight)/2);
    mesh.position.y = mesh.position.y+newPos;
  });

  // Translate frame bottom parts
  var fbparts = Object.keys(parts.frame['bottom']).sort();
  fbparts.forEach(function(order) {
    var mesh   = parts.frame['bottom'][order];
    var newHeight = ogFrameHeight*factor;
    var newPos = ((newHeight-ogFrameHeight)/2);
    mesh.position.y = mesh.position.y-newPos;
  });

  // Scale frame left parts
  var flparts = Object.keys(parts.frame['left']).sort();
  flparts.forEach(function(order) {
    var ogHead    = ogParts.frame['top']['1'];
    var head      = parts.frame['top']['1'];
    var mesh      = parts.frame['left'][order];
    var ogmesh    = ogParts.frame['left'][order];
    var headBox   = meshBox(head);
    var ogheadBox = meshBox(ogHead);
    var ogbox     = meshBox(ogmesh);
    var height    = meshHeight(mesh);
    var ogheight  = meshHeight(ogmesh);
    var offset    = ogFrameHeight-ogheight;

    var newHeight = (ogFrameHeight*factor)-offset;
    var newFactor = newHeight/height;
    mesh.scale.y  = mesh.scale.y*newFactor;

    // re-position
    var box         = meshBox(mesh);
    var ogTopOffset = ogheadBox.max.y-ogbox.max.y;
    var newPos      = headBox.max.y-box.max.y-ogTopOffset;
    mesh.position.y = mesh.position.y+newPos;
  });

  // Scale frame right parts
  var frparts = Object.keys(parts.frame['right']).sort();
  frparts.forEach(function(order) {
    var ogHead = ogParts.frame['top']['1'];
    var head   = parts.frame['top']['1'];
    var sill   = parts.frame['bottom']['1'];
    var mesh   = parts.frame['right'][order];
    var ogmesh = ogParts.frame['left'][order];
    var headBox   = meshBox(head);
    var ogheadBox = meshBox(ogHead);
    var ogbox     = meshBox(ogmesh);
    var height    = meshHeight(mesh);
    var ogheight  = meshHeight(ogmesh);
    var offset    = ogFrameHeight-ogheight;

    var newHeight = (ogFrameHeight*factor)-offset;
    var newFactor = newHeight/height;
    mesh.scale.y  = mesh.scale.y*newFactor;

    // re-position
    var box         = meshBox(mesh);
    var ogTopOffset = ogheadBox.max.y-ogbox.max.y;
    var newPos      = headBox.max.y-box.max.y-ogTopOffset;
    mesh.position.y = mesh.position.y+newPos;
  });

  var newFrameHeight         = ogFrameHeight*factor;
  var verticalFrameOffset    = totalVerticalOffset(parts);
  var newFrameDLO            = newFrameHeight-verticalFrameOffset;

  // Position panels
  var panelNames = Object.keys(parts.panels).sort();
  var colors     = {"a":"red","b":"blue","c":"green"}

  panelNames.forEach(function(panelName, index) {
    var isFirst       = index == 0 ? true : false;
    var name          = panelName;
    var panel         = parts.panels[panelName];
    var previous      = previousVerticalPanelTopItem(panelName, parts);
    var ogPanel       = ogParts.panels[panelName];
    var ogPanelHeight = panelHeight(ogPanel);
    var ogPrevious    = previousVerticalPanelTopItem(panelName, ogParts);
    var ogPreviousBox = meshBox(ogPrevious);
    var ogDLOHeight   = panelDLOHeight(ogPanel); 
    var ogDLORatio    = ogDLOHeight/ogFrameDLO;
    var newDLOHeight  = newFrameDLO*ogDLORatio;

    // translate top parts
    var ptparts = Object.keys(panel['top']).sort();
    ptparts.forEach(function(part) {
      var mesh            = panel['top'][part];
      var newPosition     = (newDLOHeight-ogDLOHeight)/2;
      mesh.position.y     = mesh.position.y+newPosition;
    });

    // translate bottom parts
    var pbparts = Object.keys(panel['bottom']).sort();
    pbparts.forEach(function(part) {
      var mesh            = panel['bottom'][part];
      var newPosition     = (newDLOHeight-ogDLOHeight)/2;
      mesh.position.y     = -newPosition;
    });	

    // scale left parts
    var plparts = Object.keys(panel['left']).sort();
    plparts.forEach(function(part) {
      var mesh      = panel['left'][part];
      var ogMesh    = ogPanel['left'][part];
      var ogLen     = meshHeight(ogMesh);
      var dlooffset = ogLen-ogDLOHeight;
      var newLen    = newDLOHeight+dlooffset;
      var newLenRat = newLen/ogLen;
      mesh.scale.y  = mesh.scale.y*newLenRat;
    });

    // scale right parts
    var plparts = Object.keys(panel['right']).sort();
    plparts.forEach(function(part) {
      var mesh      = panel['right'][part];
      var ogMesh    = ogPanel['right'][part];
      var ogLen     = meshHeight(ogMesh);
      var dlooffset = ogLen-ogDLOHeight;
      var newLen    = newDLOHeight+dlooffset;
      var newLenRat = newLen/ogLen;
      mesh.scale.y  = mesh.scale.y*newLenRat;
    });

    // reposition top parts
    var ptparts = Object.keys(panel['top']).sort();
    ptparts.forEach(function(part) {
      var mesh           = panel['top'][part];
      var ogMesh         = ogPanel['top'][part];
      var previousOffset = previousItemTopOffset(ogMesh, ogPrevious);
      var previousBox    = meshBox(previous);
      var box            = meshBox(mesh);
      var distance       = previousBox.min.y-box.max.y-previousOffset;
      mesh.position.y  = mesh.position.y+distance;
    });

    var pbparts = Object.keys(panel['bottom']).sort();
    pbparts.forEach(function(part) {
      var mesh     = panel['bottom'][part];
      var box      = meshBox(mesh) 
      var from     = panelTopMin(panel)-newDLOHeight;
      var distance = from-box.max.y;
      mesh.position.y = mesh.position.y+distance;
    });

    var pbparts = Object.keys(panel['left']).sort();
    pbparts.forEach(function(part) {
      var mesh           = panel['left'][part];
      var box            = meshBox(mesh) 
      var ogMesh         = ogPanel['left'][part];
      var previousOffset = previousItemTopOffset(ogMesh, ogPrevious);
      var previousBox    = meshBox(previous);
      var box            = meshBox(mesh);
      var distance       = previousBox.min.y-box.max.y-previousOffset;
      mesh.position.y  = mesh.position.y+distance;
    });

    var pbparts = Object.keys(panel['right']).sort();
    pbparts.forEach(function(part) {
      var mesh           = panel['right'][part];
      var box            = meshBox(mesh) 
      var ogMesh         = ogPanel['right'][part];
      var previousOffset = previousItemTopOffset(ogMesh, ogPrevious);
      var previousBox    = meshBox(previous);
      var box            = meshBox(mesh);
      var distance       = previousBox.min.y-box.max.y-previousOffset;
      mesh.position.y  = mesh.position.y+distance;
    });
  });

  // Position rails
  var rparts = Object.keys(parts.rails).sort();
  rparts.forEach(function(order) {
    var mesh        = parts.rails[order];
    var ogMesh      = ogParts.rails[order];
    var box         = meshBox(mesh);
    var ogBox       = meshBox(ogMesh);
    var panel       = adjacentRailPanel(order, parts);
    var panelMin    = panelBottomMin(panel);
    var offset      = panelMin-box.max.y;
    mesh.position.y = offset+mesh.position.y;
  });
}

function resizeWidth(width, object) {
  // Frame, Rails, Panels
  // Translate then scale then adjust(translate)
  var ogObject                = object.clone();
  var factor                  = width/meshWidth(object);
  var ogFrameBox              = meshBox(ogObject);
  var parts                   = meshesAsParts(object,false);
  var ogParts                 = meshesAsParts(ogObject,true);
  var ogFrameHeight           = ogFrameBox.max.y-ogFrameBox.min.y;	
  var ogFrameWidth            = ogFrameBox.max.x-ogFrameBox.min.x;
  var ogHorizontalFrameOffset = totalHorizontalOffset(ogParts);
  var ogFrameDLO              = ogFrameWidth-ogHorizontalFrameOffset;

  // Translate frame sides
  var ftparts = Object.keys(parts.frame['left']).sort();
  ftparts.forEach(function(order) {
    var mesh      = parts.frame['left'][order];
    var newWidth  = ogFrameWidth*factor;
    var newPos    = ((newWidth-ogFrameWidth)/2);
    mesh.position.x = mesh.position.x-newPos;
  });

  var ftparts = Object.keys(parts.frame['right']).sort();
  ftparts.forEach(function(order) {
    var mesh      = parts.frame['right'][order];
    var newWidth  = ogFrameWidth*factor;
    var newPos    = ((newWidth-ogFrameWidth)/2);
    mesh.position.x = mesh.position.x+newPos;
  });

  // Scale frame top parts
  var flparts = Object.keys(parts.frame['top']).sort();
  flparts.forEach(function(order) {
    var ogLeft    = ogParts.frame['left']['1'];
    var left      = parts.frame['left']['1'];
    var mesh      = parts.frame['top'][order];
    var ogmesh    = ogParts.frame['top'][order];
    var leftbox   = meshBox(left);
    var ogleftBox = meshBox(ogLeft);
    var ogbox     = meshBox(ogmesh);
    var width     = meshWidth(mesh);
    var ogwidth   = meshWidth(ogmesh);
    var offset    = ogFrameWidth-ogwidth;

    var newWidth  = (ogFrameWidth*factor)-offset;
    var newFactor = newWidth/width;
    mesh.scale.x  = mesh.scale.x*newFactor;

    // re-position
    var box          = meshBox(mesh);
    var ogLeftOffset = ogleftBox.min.x-ogbox.min.x;
    var newPos       = leftbox.min.x-box.min.x-ogLeftOffset;
    mesh.position.x  = mesh.position.x+newPos;
  });

  // Scale frame bottom parts
  var flparts = Object.keys(parts.frame['bottom']).sort();
  flparts.forEach(function(order) {
    var ogLeft    = ogParts.frame['left']['1'];
    var left      = parts.frame['left']['1'];
    var mesh      = parts.frame['bottom'][order];
    var ogmesh    = ogParts.frame['bottom'][order];
    var leftbox   = meshBox(left);
    var ogleftBox = meshBox(ogLeft);
    var ogbox     = meshBox(ogmesh);
    var width     = meshWidth(mesh);
    var ogwidth   = meshWidth(ogmesh);
    var offset    = ogFrameWidth-ogwidth;

    var newWidth  = (ogFrameWidth*factor)-offset;
    var newFactor = newWidth/width;
    mesh.scale.x  = mesh.scale.x*newFactor;

    // re-position
    var box          = meshBox(mesh);
    var ogLeftOffset = ogleftBox.min.x-ogbox.min.x;
    var newPos       = leftbox.min.x-box.min.x-ogLeftOffset;
    mesh.position.x  = mesh.position.x+newPos;
  });

  // NOTE: Remember some of these vars are relative to orientation
  // Change later for doors
  var newFrameWidth          = ogFrameWidth*factor;
  var horizontalFrameOffset  = totalHorizontalOffset(ogParts);
  var newFrameDLO            = newFrameWidth-horizontalFrameOffset;

  // Position panels
  var panelNames = Object.keys(parts.panels).sort();
  var colors     = {"a":"red","b":"blue","c":"green"}

  panelNames.forEach(function(panelName, index) {
    var isFirst       = index == 0 ? true : false;
    var name          = panelName;
    var panel         = parts.panels[panelName];
    var ogPanel       = ogParts.panels[panelName];
    var ogPanelWidth  = panelWidth(ogPanel);
    var ogDLOWidth    = panelDLOWidth(ogPanel); 
    var ogDLORatio    = ogDLOWidth/ogFrameDLO;
    var newDLOWidth   = newFrameDLO*ogDLORatio;

    // translate left
    var plparts = Object.keys(panel['left']).sort();
    var prparts = Object.keys(panel['right']).sort();
    var ptparts = Object.keys(panel['top']).sort();
    var pbparts = Object.keys(panel['bottom']).sort();

    plparts.forEach(function(part) {
      var mesh            = panel['left'][part];
      var newPosition     = (newDLOWidth-ogDLOWidth)/2;
      mesh.position.x     = mesh.position.x-newPosition;
    });

    prparts.forEach(function(part) {
      var mesh            = panel['right'][part];
      var newPosition     = (newDLOWidth-ogDLOWidth)/2;
      mesh.position.x     = mesh.position.x+newPosition;
    });

    // scale top parts
    ptparts.forEach(function(part) {
      var mesh      = panel['top'][part];
      var ogMesh    = ogPanel['top'][part];
      var ogLen     = meshWidth(ogMesh);
      var dlooffset = ogLen-ogDLOWidth;
      var newLen    = newDLOWidth+dlooffset;
      var newLenRat = newLen/ogLen;
      mesh.scale.x  = mesh.scale.x*newLenRat;
    });

   // scale bottom parts
    pbparts.forEach(function(part) {
      var mesh      = panel['bottom'][part];
      var ogMesh    = ogPanel['bottom'][part];
      var ogLen     = meshWidth(ogMesh);
      var dlooffset = ogLen-ogDLOWidth;
      var newLen    = newDLOWidth+dlooffset;
      var newLenRat = newLen/ogLen;
      mesh.scale.x  = mesh.scale.x*newLenRat;
    });

    // reposition left parts
    plparts.forEach(function(part) {
      var mesh           = panel['left'][part];
      var ogMesh         = ogPanel['left'][part];
      var ogPrevious     = previousVerticalPanelLeftItem(panelName, ogParts);
      var ogPreviousBox  = meshBox(ogPrevious);
      var previous       = previousVerticalPanelLeftItem(panelName, parts);
      var previousOffset = previousItemLeftOffset(ogMesh, ogPrevious);
      var previousBox    = meshBox(previous);
      var box            = meshBox(mesh);
      var distance       = previousBox.max.x-box.min.x-previousOffset;
      mesh.position.x    = mesh.position.x+distance;
    });
    
    
    // reposition right parts
    prparts.forEach(function(part) {
      var mesh           = panel['right'][part];
      var ogMesh         = ogPanel['right'][part];
      var ogPrevious     = previousVerticalPanelRightItem(panelName, ogParts);
      var ogPreviousBox  = meshBox(ogPrevious);
      var previousOffset = previousItemRightOffset(ogMesh, ogPrevious);
      var previous       = previousVerticalPanelRightItem(panelName, parts);
      var previousBox    = meshBox(previous);
      var box            = meshBox(mesh);
      var distance       = previousBox.min.x-box.max.x-previousOffset;
      mesh.position.x    = mesh.position.x+distance;
    });

    ptparts.forEach(function(part) {
      var mesh           = panel['top'][part];
      var box            = meshBox(mesh) 
      var ogMesh         = ogPanel['top'][part];
      var ogPrevious     = previousVerticalPanelLeftItem(panelName, ogParts);
      var ogPreviousBox  = meshBox(ogPrevious);
      var previousOffset = previousItemLeftOffset(ogMesh, ogPrevious);
      var previous       = previousVerticalPanelLeftItem(panelName, parts);
      var previousBox    = meshBox(previous);
      var box            = meshBox(mesh);
      var distance       = previousBox.max.x-box.min.x-previousOffset;
      mesh.position.x  = mesh.position.x+distance;
    });

    pbparts.forEach(function(part) {
      var mesh           = panel['bottom'][part];
      var box            = meshBox(mesh) 
      var ogMesh         = ogPanel['bottom'][part];
      var ogPrevious     = previousVerticalPanelLeftItem(panelName, ogParts);
      var ogPreviousBox  = meshBox(ogPrevious);
      var previousOffset = previousItemLeftOffset(ogMesh, ogPrevious);
      var previous       = previousVerticalPanelLeftItem(panelName, parts);
      var previousBox    = meshBox(previous);
      var box            = meshBox(mesh);
      var distance       = previousBox.max.x-box.min.x-previousOffset;
      mesh.position.x  = mesh.position.x+distance;
    });

  });

  // Scale rail - same as top
  var rparts = Object.keys(parts.rails).sort();
  rparts.forEach(function(order) {
    var mesh        = parts.rails[order];
    var ogmesh      = ogParts.rails[order];

    var ogLeft    = ogParts.frame['left']['1'];
    var left      = parts.frame['left']['1'];
    var leftbox   = meshBox(left);
    var ogleftBox = meshBox(ogLeft);
    var ogbox     = meshBox(ogmesh);
    var width     = meshWidth(mesh);
    var ogwidth   = meshWidth(ogmesh);
    var offset    = ogFrameWidth-ogwidth;

    var newWidth  = (ogFrameWidth*factor)-offset;
    var newFactor = newWidth/width;
    mesh.scale.x  = mesh.scale.x*newFactor;

    // re-position
    var box          = meshBox(mesh);
    var ogLeftOffset = ogleftBox.min.x-ogbox.min.x;
    var newPos       = leftbox.min.x-box.min.x-ogLeftOffset;
    mesh.position.x  = mesh.position.x+newPos;
  });
}

function meshBox(mesh) {
  var box = new THREE.Box3().setFromObject(mesh); 
  return box;
}

function meshHeight(mesh) {
  var box = meshBox(mesh);
  return box.max.y - box.min.y;
}

function meshWidth(mesh) {
  var box = meshBox(mesh);
  return box.max.x - box.min.x;
}

function adjacentRailPanel(rail, parts) {
  var railsKeys = Object.keys(parts.rails);
  var railIdx   = railsKeys.indexOf(rail);
  var panelKeys = Object.keys(parts.panels).sort();
  var panelKey  = panelKeys[railIdx];
  return parts.panels[panelKey];
}

function previousItemLeftOffset(current, previous) {
  var currentBox  = meshBox(current);
  var previousBox = meshBox(previous);
  return currentBox.min.x - previousBox.max.x;
}

function previousItemRightOffset(current, previous) {
  var currentBox  = meshBox(current);
  var previousBox = meshBox(previous);
  return previousBox.min.x - currentBox.max.x;
}

function previousItemTopOffset(current, previous) {
  var currentBox  = meshBox(current);
  var previousBox = meshBox(previous);
  return previousBox.min.y - currentBox.max.y;
}

function previousVerticalPanelTopItem(panelName, parts) {
  var panel = parts.panels[panelName];
  if (panelName == "a") {
    var topStackItems = Object.keys(parts.frame['top']).sort();
    var lastFrameTop = parts.frame['top'][topStackItems[topStackItems.length-1]];
    return lastFrameTop;
  }else{
    var panelNames = Object.keys(parts.panels);
    var currentPanelIndex = panelNames.indexOf(panelName);
    var prevPanelName = panelNames[currentPanelIndex-1];
    var prevPanel = parts.panels[prevPanelName];
    var bottomStackItems = Object.keys(prevPanel['bottom']).sort();
    var lastPanelBottom = prevPanel['bottom'][bottomStackItems[bottomStackItems.length-1]];
    return lastPanelBottom
  }
}

function previousVerticalPanelLeftItem(panelName, parts) {
  var topStackItems = Object.keys(parts.frame['left']).sort();
  var lastFrameTop = parts.frame['left'][topStackItems[topStackItems.length-1]];
  return lastFrameTop;
}

function previousVerticalPanelRightItem(panelName, parts) {
  var topStackItems = Object.keys(parts.frame['right']).sort();
  var lastFrameTop = parts.frame['right'][topStackItems[topStackItems.length-1]];
  return lastFrameTop;
}

function totalHorizontalOffset(parts) {
  // sum of all horizontal part widths
  var woffset = 0;
  Object.values(parts.frame['left']).forEach(function(p) {
    woffset += meshWidth(p);
  });
  Object.values(parts.frame['right']).forEach(function(p) {
    woffset += meshWidth(p);
  });
  // Note: Deal with vertical rails
  //Object.values(parts.rails).forEach(function(p) {
  //  woffset += meshWidth(p);
  //});
  var panelNames = Object.keys(parts.panels).sort();
  panelNames.forEach(function(panelName) {
    var panel = parts.panels[panelName];
    Object.values(panel['left']).forEach(function(p) {
      woffset += meshWidth(p);
    });
    Object.values(panel['right']).forEach(function(p) {
      woffset += meshWidth(p);
    });
  });
  return woffset;
}

function totalVerticalOffset(parts) {
  // sum of all horizontal part heights
  var voffset = 0;
  Object.values(parts.frame['top']).forEach(function(p) {
    voffset += meshHeight(p);
  });
  Object.values(parts.frame['bottom']).forEach(function(p) {
    voffset += meshHeight(p);
  });
  Object.values(parts.rails).forEach(function(p) {
    voffset += meshHeight(p);
  });
  var panelNames = Object.keys(parts.panels).sort();
  panelNames.forEach(function(panelName) {
    var panel = parts.panels[panelName];
    Object.values(panel['top']).forEach(function(p) {
      voffset += meshHeight(p);
    });
    Object.values(panel['bottom']).forEach(function(p) {
      voffset += meshHeight(p);
    });
  });
  return voffset;
}

function panelsDLOWidthSum(parts) {
  var dlosum = 0;
  var panelNames = Object.keys(parts.panels).sort();
  panelNames.forEach(function(name) {
    var panel = parts.panels[name];
    sum += panelDLOWidth(panel);
  });
  return dlosum;
}

function panelWidthOffset(panel) {
  var width     = panelWidth(panel);
  var dlowidth  = panelDLOWidth(panel);
  return width-dlowidth;
}

function panelDLOWidth(panel) {
  return panelInnerWidth(panel);
}

function panelsDLOHeightSum(parts) {
  var dlosum = 0;
  var panelNames = Object.keys(parts.panels).sort();
  panelNames.forEach(function(name) {
    var panel = parts.panels[name];
    sum += panelDLOHeight(panel);
  });
  return dlosum;
}

function panelHeightOffset(panel) {
  var height = panelHeight(panel);
  var dloheight = panelDLOHeight(panel);
  return height-dloheight;
}

function panelDLOHeight(panel) {
  return panelInnerHeight(panel);
}

function panelVerticalOffset(panel) {
  return panelHeight(panel) - panelInnerHeight(panel);
}

function panelInnerWidth(panel) {
  var pmax = panelRightMin(panel);
  var pmin = panelLeftMax(panel);
  return pmax-pmin;
}

function panelInnerHeight(panel) {
  var pmax = panelTopMin(panel);
  var pmin = panelBottomMax(panel);
  return pmax-pmin;
}

function panelHeight(panel) {
  var pmax = panelTopMax(panel);
  var pmin = panelBottomMin(panel);
  return pmax-pmin;
}

function panelWidth(panel) {
  var pmax = panelRightMax(panel);
  var pmin = panelLeftMin(panel);
  return pmax-pmin;
}

function panelBottomMax(panel) {
  var parts = Object.keys(panel['bottom']).sort();
  var box = meshBox(panel['bottom'][parts[parts.length-1]])
  return box.max.y;
}

function panelTopMin(panel) {
  var parts = Object.keys(panel['top']).sort();
  var box = meshBox(panel['top'][parts[parts.length-1]])
  return box.min.y;
}

function panelTopMax(panel) {
  var parts = Object.keys(panel['top']).sort();
  var box = meshBox(panel['top'][parts[0]])
  return box.max.y;
}

function panelBottomMin(panel) {
  var parts = Object.keys(panel['bottom']).sort();
  var box = meshBox(panel['bottom'][parts[0]])
  return box.min.y;
}

function panelRightMax(panel) {
  var parts = Object.keys(panel['right']).sort();
  var box = meshBox(panel['right'][parts[0]])
  return box.max.x;
}

function panelLeftMin(panel) {
  var parts = Object.keys(panel['left']).sort();
  var box = meshBox(panel['left'][parts[0]])
  return box.min.x;
}

function panelLeftMax(panel) {
  var parts = Object.keys(panel['left']).sort();
  var box = meshBox(panel['left'][parts[parts.length-1]])
  return box.max.x;
}

function panelRightMin(panel) {
  var parts = Object.keys(panel['right']).sort();
  var box = meshBox(panel['right'][parts[parts.length-1]])
  return box.min.x;
}

function meshesAsParts(object, clone) {
  // ie: Layer_A_Top_1_Glazing_Bead_Fixed__1_ESEL110
  var parts = {frame:{}, panels:{}, rails:{}};
  object.children.forEach(function(mesh) {
    var meshParts = mesh.name.split("_").map(function(m) {
      return m.toLowerCase();	
    });
    var name = meshParts[1];
    if (name == "frame") {
      var position = meshParts[2];
      var stackPos = meshParts[3];
      if (parts[name][position]) {
        parts[name][position][stackPos] = clone ? mesh.clone() : mesh;
      }else{
        parts[name][position] = {};
        parts[name][position][stackPos] = clone ? mesh.clone() : mesh;
      }
    }else if (name == "rail") {
      var position = meshParts[2];
      parts['rails'][position] = clone ? mesh.clone() : mesh;
    }else if (name.length == 1) {
      var position = meshParts[2];
      var stackPos = meshParts[3];
      if (parts['panels'][name]) {
        if (parts['panels'][name][position]) {
          parts['panels'][name][position][stackPos] = clone ? mesh.clone() : mesh;
        }else{
          parts['panels'][name][position] = {};
          parts['panels'][name][position][stackPos] = clone ? mesh.clone() : mesh;
        }
      }else{
        parts['panels'][name] = {};
        parts['panels'][name][position] = {};
        parts['panels'][name][position][stackPos] = clone ? mesh.clone() : mesh;
      }
    }
  });
  return parts;
}

window.addEventListener( 'resize', resize, false );

function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );  
}

function updateGeometry(jamb1) {
  jamb1.updateMatrix();
  jamb1.geometry.applyMatrix(jamb1.matrix);
  jamb1.matrix.identity();
}

function init() {
  container = document.getElementById( 'container' );
  camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 2000 );
  camera.position.z = 200;
  scene = new THREE.Scene();

  var ambient = new THREE.AmbientLight( 0x101030 );
  scene.add( ambient );

  var directionalLight = new THREE.DirectionalLight( 0xffeedd );
  directionalLight.position.set( 0, 0, 1 );
  scene.add( directionalLight );

  renderer = new THREE.WebGLRenderer();
  renderer.setSize( window.innerWidth, window.innerHeight );
  container.appendChild( renderer.domElement );

  var loader = new THREE.OBJLoader();
  loader.load( 'cactus-3d.obj', function ( object ) {
    object.name = "esmodel";
    scene.add(object);
    object.children.forEach(function(mesh) {
      mesh.geometry.dynamic = true;
      mesh.geometry.verticesNeedUpdate = true;
    }); 
    model = object;
    originalHeight = meshHeight(object);
    originalWidth  = meshWidth(object);
  });

}

function animate() {
  requestAnimationFrame( animate );
  render();
}

function render() {
  renderer.render( scene, camera );
}
