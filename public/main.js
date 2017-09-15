window.onload=function(){
  var model = null;
  init();
  animate();
}

function scaleModel() {
  var scaler = document.getElementById("scaler");
  var value  = (scaler.value/100)+1;
  var obj    = model.clone();
  removeEntity(obj.name);
  scene.add(obj);
  verticallyScale(value, obj);
}

function removeEntity(name) {
  var selectedObject = scene.getObjectByName(name);
  scene.remove(selectedObject);
  animate();
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

function verticallyScale(factor, object) {
  // Frame, Rails, Panels
  // Translate then scale then adjust(translate)
  var ogObject              = object.clone();
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
    var mesh   = parts.frame['top'][order];
    var ogMesh = ogParts.frame['top'][order];
    var height = meshHeight(mesh);
    var newPos = (((ogFrameHeight*factor)-ogFrameHeight)/2);
    mesh.position.y = newPos;
  });

  // Translate frame bottom parts
  var fbparts = Object.keys(parts.frame['bottom']).sort();
  fbparts.forEach(function(order) {
    var mesh   = parts.frame['bottom'][order];
    var newPos = (((ogFrameHeight*factor)-ogFrameHeight)/2);
    mesh.position.y = -newPos;
  });

  // Scale frame left parts
  var flparts = Object.keys(parts.frame['left']).sort();
  flparts.forEach(function(order) {
    var ogHead = ogParts.frame['top']['1'];
    var head   = parts.frame['top']['1'];
    var sill   = parts.frame['bottom']['1'];
    var mesh   = parts.frame['left'][order];
    var height = meshHeight(mesh);
    var offset = 0;

    if (ogFrameHeight == height+meshHeight(head)+meshHeight(sill)) {
      offset = meshHeight(head)+meshHeight(sill);
    }else if (ogFrameHeight == height+meshHeight(head)) {
      offset = meshHeight(head)+meshHeight(head);
    }else if (ogFrameHeight == height+meshHeight(sill)) {
      offset = meshHeight(head)+meshHeight(sill);
    }

    var newHeight = (ogFrameHeight*factor)-offset;
    var newFactor = newHeight/height;
    mesh.scale.y  = newFactor;

    var newPos    = 0;
    var box       = meshBox(mesh);
    var headBox   = meshBox(head);
    var ogHeadBox = meshBox(ogHead);

    if (ogFrameBox.max.y == ogHeadBox.max.y) {
      newPos = headBox.min.y-box.max.y;
    }else{
      newPos = headBox.max.y-box.max.y;
    }
    mesh.position.y = newPos;
  });

  // Scale frame right parts
  var frparts = Object.keys(parts.frame['right']).sort();
  frparts.forEach(function(order) {
    var ogHead = ogParts.frame['top']['1'];
    var head   = parts.frame['top']['1'];
    var sill   = parts.frame['bottom']['1'];
    var mesh   = parts.frame['right'][order];
    var height = meshHeight(mesh);
    var offset = 0;

    if (ogFrameHeight == height+meshHeight(head)+meshHeight(sill)) {
      offset = meshHeight(head)+meshHeight(sill);
    }else if (ogFrameHeight == height+meshHeight(head)) {
      offset = meshHeight(head)+meshHeight(head);
    }else if (ogFrameHeight == height+meshHeight(sill)) {
      offset = meshHeight(head)+meshHeight(sill);
    }

    var newHeight = (ogFrameHeight*factor)-offset;
    var newFactor = newHeight/height;
    mesh.scale.y  = newFactor;

    var newPos    = 0;
    var box       = meshBox(mesh);
    var headBox   = meshBox(head);
    var ogHeadBox = meshBox(ogHead);

    if (ogFrameBox.max.y == ogHeadBox.max.y) {
      newPos = headBox.min.y-box.max.y;
    }else{
      newPos = headBox.max.y-box.max.y;
    }
    mesh.position.y = newPos;
  });

  var newFrameHeight         = ogFrameHeight*factor;
  var newVerticalFrameOffset = totalVerticalOffset(parts);
  var newFrameDLO            = newFrameHeight-newVerticalFrameOffset;

  // Position panels
  var panelNames = Object.keys(parts.panels).sort();
  var colors     = {"a":"red","b":"blue","c":"green"}

  panelNames.forEach(function(panelName, index) {
    var isFirst       = index == 0 ? true : false;
    var name          = panelName;
    var panel         = parts.panels[panelName];
    var previous      = previousItem(panelName, parts);
    var ogPanel       = ogParts.panels[panelName];
    var ogPanelHeight = panelHeight(ogPanel);
    var ogPrevious    = previousItem(panelName, ogParts);
    var ogPreviousBox = meshBox(ogPrevious);
    var ogDLOHeight   = panelDLOHeight(ogPanel); 
    var ogDLORatio    = ogDLOHeight/ogFrameDLO;
    var newDLOHeight  = newFrameDLO*ogDLORatio;

    // translate top parts
    var ptparts = Object.keys(panel['top']).sort();
    ptparts.forEach(function(part) {
      var mesh            = panel['top'][part];
      mesh.material.color = new THREE.Color(colors[panelName]);
      var newPosition     = (newDLOHeight-ogDLOHeight)/2;
      mesh.position.y     = newPosition;
    });

    // translate bottom parts
    var pbparts = Object.keys(panel['bottom']).sort();
    pbparts.forEach(function(part) {
      var mesh            = panel['bottom'][part];
      mesh.material.color = new THREE.Color(colors[panelName]);
      var newPosition     = (newDLOHeight-ogDLOHeight)/2;
      mesh.position.y     = -newPosition;
    });	

    // scale left parts
    var plparts = Object.keys(panel['left']).sort();
    plparts.forEach(function(part) {
      var mesh      = panel['left'][part];
      mesh.material.color = new THREE.Color(colors[panelName]);
      var ogMesh    = ogPanel['left'][part];
      var ogLen     = meshHeight(ogMesh);
      var dlooffset = ogLen-ogDLOHeight;
      var newLen    = newDLOHeight+dlooffset;
      var newLenRat = newLen/ogLen;
      mesh.scale.y  = newLenRat;
    });

    // scale right parts
    var plparts = Object.keys(panel['right']).sort();
    plparts.forEach(function(part) {
      var mesh      = panel['right'][part];
      mesh.material.color = new THREE.Color(colors[panelName]);
      var ogMesh    = ogPanel['right'][part];
      var ogLen     = meshHeight(ogMesh);
      var dlooffset = ogLen-ogDLOHeight;
      var newLen    = newDLOHeight+dlooffset;
      var newLenRat = newLen/ogLen;
      mesh.scale.y  = newLenRat;
    });

    // reposition top parts
    var ptparts = Object.keys(panel['top']).sort();
    ptparts.forEach(function(part) {
      var mesh           = panel['top'][part];
      var ogMesh         = ogPanel['top'][part];
      var previousOffset = previousItemOffset(ogMesh, ogPrevious);
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
      var previousOffset = previousItemOffset(ogMesh, ogPrevious);
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
      var previousOffset = previousItemOffset(ogMesh, ogPrevious);
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

function adjacentRailPanel(rail, parts) {
  var railsKeys = Object.keys(parts.rails);
  var railIdx   = railsKeys.indexOf(rail);
  var panelKeys = Object.keys(parts.panels).sort();
  var panelKey  = panelKeys[railIdx];
  return parts.panels[panelKey];
}

function previousItemOffset(current, previous) {
  var currentBox  = meshBox(current);
  var previousBox = meshBox(previous);
  return previousBox.min.y - currentBox.max.y;
}

function previousItem(panelName, parts) {
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

function panelOffset(panel) {
  return panelHeight(panel) - panelInnerHeight(panel);
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
      console.log(mesh.name);
      mesh.geometry.dynamic = true;
      mesh.geometry.verticesNeedUpdate = true;
    }); 
    model = object;
    verticallyScale(1, object);
  });

}

function animate() {
  requestAnimationFrame( animate );
  render();
}

function render() {
  renderer.render( scene, camera );
}
