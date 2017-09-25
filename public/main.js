window.onload=function(){
  title = document.createElement('div');
  info = document.createElement('div');
  meshInfo = document.createElement('div');
  model   = null;
  ogmodel = null;
  originalHeight = null;
  originalWidth  = null;
  current_mesh = null;
  appendTitle();
  appendInfo();
  appendMeshInfo();
  init();
  animate();
}

// get center
// anything less subtract
// anything greater add

function stretch(geometry, points, axis) {
  geometry.computeBoundingBox();
  var newgeo       = geometry.clone();
  var box          = newgeo.boundingBox;
  var stretchpoint = box.getCenter();
  newgeo.boundingSphere = null;
  newgeo.boundingBox    = null;
  newgeo.vertices.forEach(function(v) {
    if (v[axis] < stretchpoint[axis]) {
      v[axis] -= points/2;
    }else if (v[axis] > stretchpoint[axis]) {
      v[axis] += points/2;
    }
  });
  return newgeo;
}

function doHeightResize() {
  var scaler    = document.getElementById("hscaler");
  var value     = (scaler.value/100)+1;
  var newheight = originalHeight*value;
  resizeHeight(newheight, model);
}

function doWidthResize() {
  var scaler    = document.getElementById("wscaler");
  var value     = (scaler.value/100)+1;
  var newwidth  = originalWidth*value;
  resizeWidth(newwidth, model);
}

function resizeHeight(height, object) {
  // Frame, Rails, Panels
  // Translate then scale then adjust(translate)
  var ogobject              = ogmodel;
  var factor                = height/meshHeight(ogobject);
  var ogframebox            = meshBox(ogobject);
  var parts                 = meshesAsParts(object,false);
  var ogparts               = meshesAsParts(ogobject,true);
  var ogframeheight         = ogframebox.max.y-ogframebox.min.y;	
  var ogframewidth          = ogframebox.max.y-ogframebox.min.y;
  var ogverticalframeoffset = ogframeheight-panelsdloheightsum(ogparts);
  var ogframedlo            = ogframeheight-ogverticalframeoffset;

  // Translate frame top parts
  var ftparts = Object.keys(parts.frame['top']).sort();
  ftparts.forEach(function(order) {
    var mesh        = parts.frame['top'][order];
    var newheight   = ogframeheight*factor;
    var newPos      = ((newheight-ogframeheight)/2);
    mesh.position.y = newPos;
  });

  // Translate frame bottom parts
  var fbparts = Object.keys(parts.frame['bottom']).sort();
  fbparts.forEach(function(order) {
    var mesh        = parts.frame['bottom'][order];
    var newheight   = ogframeheight*factor;
    var newPos      = ((newheight-ogframeheight)/2);
    mesh.position.y = -newPos;
  });

  // Scale frame left parts
  var flparts = Object.keys(parts.frame['left']).sort();
  flparts.forEach(function(order) {
    var mesh        = parts.frame['left'][order];
    var ogmesh      = ogparts.frame['left'][order];
    var ogheight    = meshHeight(ogmesh);
    var offset      = ogframeheight-ogheight;
    var newheight   = (ogframeheight*factor)-offset;
    var lenToResize = newheight-ogheight;
    var newGeo      = stretch(ogmesh.geometry, lenToResize, 'y');
    mesh.geometry   = newGeo;
  });

  // Scale frame right parts
  var frparts = Object.keys(parts.frame['right']).sort();
  frparts.forEach(function(order) {
    var mesh        = parts.frame['right'][order];
    var ogmesh      = ogparts.frame['right'][order];
    var ogheight    = meshHeight(ogmesh);
    var offset      = ogframeheight-ogheight;
    var newheight   = (ogframeheight*factor)-offset;
    var lenToResize = newheight-ogheight;
    var newGeo      = stretch(ogmesh.geometry, lenToResize, 'y');
    mesh.geometry   = newGeo;
  });

  var newFrameHeight      = ogframeheight*factor;
  var verticalFrameOffset = totalheightoffset(parts);
  var ogDLOSum            = panelsdloheightsum(ogparts);
  var newframedlo         = newFrameHeight-verticalFrameOffset;

  // Position panels
  var panelnames = Object.keys(parts.panels).sort();
  var colors     = {"a":"red","b":"blue","c":"green"}

  panelnames.forEach(function(panelname, index) {
    var panel         = parts.panels[panelname];
    var previous      = previousVerticalPanelItem(panelname, parts);
    var ogPrevious    = previousVerticalPanelItem(panelname, ogparts);
    var ogPanel       = ogparts.panels[panelname];
    var ogPanelHeight = panelHeight(ogPanel);
    var ogDLOHeight   = panelDLOHeight(ogPanel); 
    var ogDLORatio    = ogDLOHeight/ogDLOSum;
    var ogPrevious    = previousVerticalPanelItem(panelname, ogparts);
    var ogPreviousBox = meshBox(ogPrevious);
    var newDLOHeight  = newframedlo*ogDLORatio;

    // translate top parts
    var ptparts = Object.keys(panel['top']).sort();
    ptparts.forEach(function(part) {
      var mesh        = panel['top'][part];
      var ogmesh      = ogPanel['top'][part];
      var ogPrevDist  = previousItemTopOffset(ogmesh, ogPrevious);
      var box         = meshBox(ogmesh) 
      var from        = meshBox(previous).min.y-ogPrevDist;
      var distance    = from-box.max.y;
      mesh.position.y = distance
    });

    // translate bottom parts
    var pbparts = Object.keys(panel['bottom']).sort();
    pbparts.forEach(function(part) {
      var mesh        = panel['bottom'][part];
      var ogmesh      = ogPanel['bottom'][part];
      var box         = meshBox(ogmesh) 
      var from        = panelTopMin(panel)-newDLOHeight;
      var distance    = from-box.max.y;
      mesh.position.y = distance;
    });	

    // scale left parts
    var plparts = Object.keys(panel['left']).sort();
    plparts.forEach(function(part) {
      var mesh        = panel['left'][part];
      var ogmesh      = ogPanel['left'][part];
      var ogHeight    = meshHeight(ogmesh);
      var dlooffset   = ogHeight-ogDLOHeight;
      var newheight   = (newframedlo*ogDLORatio)+dlooffset;
      var lenToResize = newheight-ogHeight;
      var newGeo      = stretch(ogmesh.geometry, lenToResize, 'y');
      mesh.geometry   = newGeo;

      // Re-center
      ogmesh.geometry.computeBoundingBox();
      var pmax        = panelTopMax(panel);
      var pmin        = panelBottomMin(panel);
      var pheight     = pmax-pmin;
      var pcenter     = pmax-(pheight/2);
      var ogpcenter   = ogmesh.geometry.boundingBox.getCenter().y ;
      mesh.position.y = pcenter-ogpcenter;
    });

    // scale right parts
    var plparts = Object.keys(panel['right']).sort();
    plparts.forEach(function(part) {
      var mesh        = panel['right'][part];
      var ogmesh      = ogPanel['right'][part];
      var ogHeight    = meshHeight(ogmesh);
      var dlooffset   = ogHeight-ogDLOHeight;
      var newheight   = (newframedlo*ogDLORatio)+dlooffset;
      var lenToResize = newheight-ogHeight;
      var newGeo      = stretch(ogmesh.geometry, lenToResize, 'y');
      mesh.geometry   = newGeo;

      // Re-center
      var pmax        = panelTopMax(panel);
      var pmin        = panelBottomMin(panel);
      var pheight     = pmax-pmin;
      var pcenter     = pmax-(pheight/2);
      var ogpmax      = panelTopMax(ogPanel);
      var ogpmin      = panelBottomMin(ogPanel);
      var ogpheight   = ogpmax-ogpmin;
      var ogpcenter   = ogpmax-(ogpheight/2);
      mesh.position.y = pcenter-ogpcenter;
    });
  });

  // Position rails
  var rparts = Object.keys(parts.rails).sort();
  rparts.forEach(function(order) {
    var mesh            = parts.rails[order];

    // Compute original center
    var ogpreviousPanel = previousRailPanel(order, ogparts);
    var ognextPanel     = nextRailPanel(order, ogparts);
    var ogrtop          = panelBottomMin(ogpreviousPanel);
    var ogrbottom       = panelTopMax(ognextPanel);
    var ogheight        = ogrtop-ogrbottom;
    var ogcenter        = ogrtop-(ogheight/2);

    // Compute new center
    var previousPanel   = previousRailPanel(order, parts);
    var nextPanel       = nextRailPanel(order, parts);
    var rtop            = panelBottomMin(previousPanel);
    var rbottom         = panelTopMax(nextPanel);
    var height          = rtop-rbottom;
    var center          = rtop-(height/2);

    // Offset between centers
    var newpos          = center-ogcenter
    mesh.position.y     = newpos;
  });

  updateInfo();
  updateMeshInfo(current_mesh);
}

function resizeWidth(width, object) {
  // Frame, Rails, Panels
  // Translate then scale then adjust(translate)
  var ogobject                = ogmodel;
  var factor                  = width/meshwidth(ogobject);
  var ogframebox              = meshBox(ogobject);
  var parts                   = meshesAsParts(object,false);
  var ogparts                 = meshesAsParts(ogobject,true);
  var ogframeheight           = ogframebox.max.y-ogframebox.min.y;	
  var ogframewidth            = ogframebox.max.x-ogframebox.min.x;
  var oghorizontalframeoffset = totalwidthoffset(ogparts);
  var ogframedlo              = ogframewidth-oghorizontalframeoffset;

  var ftparts = Object.keys(parts.frame['top']).sort();
  var fbparts = Object.keys(parts.frame['bottom']).sort();
  var frparts = Object.keys(parts.frame['right']).sort();
  var flparts = Object.keys(parts.frame['left']).sort();

  // Translate frame sides
  flparts.forEach(function(order) {
    var mesh      = parts.frame['left'][order];
    var newwidth  = ogframewidth*factor;
    var newPos    = ((newwidth-ogframewidth)/2);
    mesh.position.x = -newPos;
  });

  frparts.forEach(function(order) {
    var mesh      = parts.frame['right'][order];
    var newwidth  = ogframewidth*factor;
    var newPos    = ((newwidth-ogframewidth)/2);
    mesh.position.x = newPos;
  });

  // Scale frame top parts
  ftparts.forEach(function(order) {
    var mesh      = parts.frame['top'][order];
    var ogmesh    = ogparts.frame['top'][order];
    var ogwidth   = meshwidth(ogmesh);
    var offset    = ogframewidth-ogwidth;
    var newwidth  = (ogframewidth*factor)-offset;
    var lenToResize = newwidth-ogwidth;
    var newGeo    = stretch(ogmesh.geometry, lenToResize, 'x');
    mesh.geometry = newGeo;
  });

  // Scale frame bottom parts
  fbparts.forEach(function(order) {
    var mesh      = parts.frame['bottom'][order];
    var ogmesh    = ogparts.frame['bottom'][order];
    var ogwidth   = meshwidth(ogmesh);
    var offset    = ogframewidth-ogwidth;
    var newwidth  = (ogframewidth*factor)-offset;
    var lenToResize = newwidth-ogwidth;
    var newGeo    = stretch(ogmesh.geometry, lenToResize, 'x');
    mesh.geometry = newGeo;
  });

  // NOTE: Remember some of these vars are relative to orientation
  // Change later for doors
  var newframewidth          = ogframewidth*factor;
  var horizontalframeoffset  = totalwidthoffset(ogparts);
  var newframedlo            = newframewidth-horizontalframeoffset;
  var ogDLOSum               = panelsdlowidthsum(ogparts);

  // Position panels
  var panelnames = Object.keys(parts.panels).sort();
  var colors     = {"a":"red","b":"blue","c":"green"}

  panelnames.forEach(function(panelname, index) {
    var name          = panelname;
    var panel         = parts.panels[panelname];
    var ogPanel       = ogparts.panels[panelname];
    var ogPanelWidth  = panelWidth(ogPanel);
    var ogDLOWidth    = panelDLOWidth(ogPanel); 
    var ogDLORatio    = 1;
    var newDLOWidth   = newframedlo*ogDLORatio;

    // translate left
    var plparts = Object.keys(panel['left']).sort();
    var prparts = Object.keys(panel['right']).sort();
    var ptparts = Object.keys(panel['top']).sort();
    var pbparts = Object.keys(panel['bottom']).sort();

    // translate left parts
    // TODO: Change this to be translated by center difference
    plparts.forEach(function(part) {
      var mesh        = panel['left'][part];
      var width       = meshwidth(mesh);
      mesh.position.x = -((newDLOWidth-ogDLOWidth)/2+width);
    });

    // translate right parts
    // TODO: Change this to be translated by center difference
    prparts.forEach(function(part) {
      var mesh        = panel['right'][part];
      var width       = meshwidth(mesh);
      mesh.position.x = (newDLOWidth-ogDLOWidth)/2+width;
    });

    // scale top parts
    ptparts.forEach(function(part) {
      var mesh        = panel['top'][part];
      var ogmesh      = ogPanel['top'][part];
      var ogwidth     = meshwidth(ogmesh);
      var offset      = ogframewidth-ogwidth;
      var newwidth    = (ogframewidth*factor)-offset;
      var lenToResize = newwidth-ogwidth;
      var newGeo      = stretch(ogmesh.geometry, lenToResize, 'x');
      mesh.geometry   = newGeo;
    });

    // scale bottom parts
    pbparts.forEach(function(part) {
      var mesh      = panel['bottom'][part];
      var ogmesh    = ogPanel['bottom'][part];
      var ogwidth   = meshwidth(ogmesh);
      var offset    = ogframewidth-ogwidth;
      var newwidth  = (ogframewidth*factor)-offset;
      var newfactor = newwidth/ogwidth;
      mesh.scale.x  = newfactor;
    });
  });

  // Scale rail - same as top
  var rparts = Object.keys(parts.rails).sort();
  rparts.forEach(function(order) {
    var mesh      = parts.rails[order];
    var ogmesh    = ogparts.rails[order];
    var ogwidth   = meshwidth(ogmesh);
    var offset    = ogframewidth-ogwidth;
    var newwidth  = (ogframewidth*factor)-offset;
    var newfactor = newwidth/ogwidth;
    mesh.scale.x  = newfactor;
  });

  updateInfo();
  updateMeshInfo(current_mesh);
}

function meshBox(mesh) {
  var box = new THREE.Box3().setFromObject(mesh); 
  return box;
}

function meshHeight(mesh) {
  var box = meshBox(mesh);
  return box.max.y - box.min.y;
}

function meshwidth(mesh) {
  var box = meshBox(mesh);
  return box.max.x - box.min.x;
}

function previousRailPanel(rail, parts) {
  var railsKeys = Object.keys(parts.rails);
  var railIdx   = railsKeys.indexOf(rail);
  var panelKeys = Object.keys(parts.panels).sort();
  var panelKey  = panelKeys[railIdx];
  return parts.panels[panelKey];
}

function nextRailPanel(rail, parts) {
  var railsKeys = Object.keys(parts.rails);
  var panelKeys = Object.keys(parts.panels).sort();
  var railIdx   = railsKeys.indexOf(rail);
  var panelIdx  = railIdx+1
  var panelKey  = panelKeys[panelIdx];
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

function previousVerticalPanelItem(panelname, parts) {
  var panel = parts.panels[panelname];
  if (panelname == "a") {
    var topStackItems = Object.keys(parts.frame['top']).sort();
    var lastFrameTop = parts.frame['top'][topStackItems[topStackItems.length-1]];
    return lastFrameTop;
  }else{
    var panelnames = Object.keys(parts.panels);
    var currentPanelIndex = panelnames.indexOf(panelname);
    var prevPanelName = panelnames[currentPanelIndex-1];
    var prevPanel = parts.panels[prevPanelName];
    var bottomStackItems = Object.keys(prevPanel['bottom']).sort();
    var lastPanelBottom = prevPanel['bottom'][bottomStackItems[bottomStackItems.length-1]];
    return lastPanelBottom
  }
}

function previousverticalpanelLeftitem(panelname, parts) {
  var topStackItems = Object.keys(parts.frame['left']).sort();
  var lastFrameTop  = parts.frame['left'][topStackItems[topStackItems.length-1]];
  return lastFrameTop;
}

function previousverticalpanelrightitem(panelname, parts) {
  var topStackItems = Object.keys(parts.frame['right']).sort();
  var lastFrameTop  = parts.frame['right'][topStackItems[topStackItems.length-1]];
  return lastFrameTop;
}

function totalwidthoffset(parts) {
  // sum of all horizontal part widths
  var woffset = 0;
  Object.values(parts.frame['left']).forEach(function(p) {
    woffset += meshwidth(p);
  });
  Object.values(parts.frame['right']).forEach(function(p) {
    woffset += meshwidth(p);
  });
  // Note: Deal with vertical rails
  //Object.values(parts.rails).forEach(function(p) {
  //  woffset += meshwidth(p);
  //});
  var panelnames = Object.keys(parts.panels).sort();
  panelnames.forEach(function(panelname) {
    var panel = parts.panels[panelname];
    Object.values(panel['left']).forEach(function(p) {
      woffset += meshwidth(p);
    });
    Object.values(panel['right']).forEach(function(p) {
      woffset += meshwidth(p);
    });
  });
  return woffset;
}

function totalheightoffset(parts) {
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
  var panelnames = Object.keys(parts.panels).sort();
  panelnames.forEach(function(panelname) {
    var panel = parts.panels[panelname];
    Object.values(panel['top']).forEach(function(p) {
      voffset += meshHeight(p);
    });
    Object.values(panel['bottom']).forEach(function(p) {
      voffset += meshHeight(p);
    });
  });
  return voffset;
}

function panelsdloheightsum(parts) {
  var dlosum = 0;
  var panelnames = Object.keys(parts.panels).sort();
  panelnames.forEach(function(name) {
    var panel = parts.panels[name];
    dlosum += panelDLOHeight(panel);
  });
  return dlosum;
}

function panelsdlowidthsum(parts) {
  var dlosum = 0;
  var panelnames = Object.keys(parts.panels).sort();
  panelnames.forEach(function(name) {
    var panel = parts.panels[name];
    dlosum += panelDLOWidth(panel);
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

function panelHeightOffset(panel) {
  var height = panelHeight(panel);
  var dloheight = panelDLOHeight(panel);
  return height-dloheight;
}

function panelDLOHeight(panel) {
  return panelInnerHeight(panel);
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

function meshPartsFromName(mesh) {
  var meshParts = mesh.name.split("_").map(function(m) {
    return m.toLowerCase();	
  });
  return meshParts;
}

function meshesAsParts(object, clone) {
  // ie: Layer_A_Top_1_Glazing_Bead_Fixed__1_ESEL110
  var parts = {frame:{}, panels:{}, rails:{}};
  object.children.forEach(function(mesh) {
    var meshParts = meshPartsFromName(mesh);
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

function init() {
  container = document.getElementById( 'container' );
  scene     = new THREE.Scene();
  renderer  = new THREE.WebGLRenderer();
  camera    = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 2000 );
  renderer.setSize( window.innerWidth, window.innerHeight );
  container.appendChild( renderer.domElement );
  camera.position.z = 150;
  
  loadControls();

  var ambient = new THREE.AmbientLight( 0x101030 );
  scene.add( ambient );

  var directionalLight = new THREE.DirectionalLight( 0xffeedd );
  directionalLight.position.set( 0, 0, 1 );
  scene.add( directionalLight );

  var loader = new THREE.OBJLoader();
  loader.load( 'cactus-3d.obj', function ( object ) {
    object.name = "esmodel";
    object.children.forEach(function(mesh) {
      var geometry = new THREE.Geometry().fromBufferGeometry(mesh.geometry);
      mesh.geometry = geometry;
      mesh.geometry.dynamic = true;
      mesh.geometry.verticesNeedUpdate = true;
      mesh.callback = function(mesh) { 
        updateMeshInfo(mesh);
        selectColor(mesh);
        current_mesh = mesh;
      }
    }); 

    model   = object;
    ogmodel = object.clone();
    originalHeight = meshHeight(ogmodel);
    originalWidth  = meshwidth(ogmodel);
    scene.add(object);
    updateInfo();
    //unevenGeometry(10);
  });

  function loadControls() {
    controls = new THREE.OrbitControls( camera );
    controls.rotateSpeed = 0.5;
    controls.zoomSpeed = 0.5;
    controls.panSpeed = 0.5;
    controls.enableZoom = true;
    controls.enableRotate = false;
    controls.enablePan = true;
    controls.enableDamping = false;
    controls.minPolarAngle = Math.PI/2;
    controls.maxPolarAngle = Math.PI/2;
    controls.dampingFactor = 10;
  }

  function unevenGeometry(size) {
    var material = new THREE.LineBasicMaterial({
        color: 0xffffff
    });
    var geometry = new THREE.Geometry();
    geometry.vertices.push(
      new THREE.Vector3( 0, 0, 0 ),
      new THREE.Vector3( 0, 10, 0 ),
      new THREE.Vector3( 60, 10, 0 ),
      new THREE.Vector3( 60, 0, 0 ),
      new THREE.Vector3( 40, 0, 0 ),
      new THREE.Vector3( 40, -10, 0 ),
      new THREE.Vector3( 20, -10, 0 ),
      new THREE.Vector3( 20, 0, 0 ),
      new THREE.Vector3( 0, 0, 0 ),
    );
    geometry.center();
    var line = new THREE.Line( geometry, material );
    scene.add( line );
    line.geometry = stretch(line.geometry, size, 'x');
  }
  document.getElementById("container").addEventListener("mousedown", function(event) {
    canvasClick(event);
  });
  document.getElementById("hscaler").addEventListener("mousedown", function() {
    controls.enabled = false;
  });
  document.getElementById("hscaler").addEventListener("mouseup", function() {
    controls.enabled = true;
  });
  document.getElementById("wscaler").addEventListener("mousedown", function() {
    controls.enabled = false;
  });
  document.getElementById("wscaler").addEventListener("mouseup", function() {
    controls.enabled = true;
  });
}

function animate() {
  requestAnimationFrame( animate );
  render();
}

function render() {
  controls.update();
  renderer.render( scene, camera );
}

function canvasClick( event ) {
  event.preventDefault();
  var mouse = new THREE.Vector2();
  var raycaster = new THREE.Raycaster();

  var rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ( ( event.clientX - rect.left ) / rect.width ) * 2 - 1;
  mouse.y = - ( ( event.clientY - rect.top ) / rect.height ) * 2 + 1;

  raycaster.setFromCamera( mouse, camera );
  var intersects = raycaster.intersectObjects(model.children); 

  if ( intersects.length > 0 ) {
    var mesh = intersects[0].object;
    mesh.callback(mesh);
  }

  console.log(intersects);
  if (intersects.length == 0) {
    clearAllColors();
    clearMeshInfo();
  }
}

function appendTitle() {
  title.style.position = 'absolute';
  title.style.top = '30px';
  title.style.width = '100%';
  title.style.textAlign = 'center';
  title.style.color = '#fff';
  title.style.fontWeight = 'bold';
  title.style.fontSize = '18px';
  title.style.backgroundColor = 'transparent';
  title.style.zIndex = '1';
  title.style.fontFamily = 'Monospace';
  title.innerHTML = "ES-100";
  document.body.appendChild(title);
}

function appendInfo() {
  info.style.position = 'absolute';
  info.style.top = '60px';
  info.style.width = '100%';
  info.style.textAlign = 'center';
  info.style.color = '#fff';
  info.style.fontWeight = 'bold';
  info.style.fontSize = '18px';
  info.style.backgroundColor = 'transparent';
  info.style.zIndex = '1';
  info.style.fontFamily = 'Monospace';
  info.innerHTML = "";
  document.body.appendChild(info);
}

function appendMeshInfo() {
  meshInfo.style.position = 'absolute';
  meshInfo.style.top = '90px';
  meshInfo.style.width = '100%';
  meshInfo.style.textAlign = 'center';
  meshInfo.style.color = '#fff';
  meshInfo.style.fontWeight = 'bold';
  meshInfo.style.fontSize = '18px';
  meshInfo.style.backgroundColor = 'transparent';
  meshInfo.style.zIndex = '1';
  meshInfo.style.fontFamily = 'Monospace';
  meshInfo.innerHTML = "";
  document.body.appendChild(meshInfo);
}

function updateInfo() {
  info.innerHTML = "Width: "+display_in_inches(meshwidth(model))+" Height: "+display_in_inches(meshHeight(model));
}

function updateMeshInfo(mesh) {
  if (!mesh)
    return;
  var parts = meshPartsFromName(mesh);
  var type = parts[1];
  var ref = parts[parts.length-1];
  var name;
  var position;
  var stackPos;
  var length;

  if (type == "frame") {
    position = parts[2];
    stackPos = parts[3];
    name = parts.slice(4,parts.length-1).join(" ");
  }else if (type == "rail") {
    position = "top";
    name = parts.slice(3,parts.length-1).join(" ");
  }else if (type.length == 1) {
    position = parts[2];
    stackPos = parts[3];
    name = parts.slice(4,parts.length-2).join(" ");
  }

  if (position == "top" || position == "bottom") {
    length = meshwidth(mesh);
  }else{
    length = meshHeight(mesh);
  }

  meshInfo.innerHTML = name.toUpperCase()+"<br/>ES Part #: "+ref.toUpperCase()+"<br/>Length: "+display_in_inches(length);
}

function clearMeshInfo() {
  meshInfo.innerHTML = "";
}

function clearAllColors() {
  model.children.forEach(function(c) {
    c.material.color = new THREE.Color( 1, 1, 1);
  });
}

function selectColor(mesh) {
  clearAllColors(); 
  mesh.material.color = new THREE.Color( 'skyblue' );
}

function display_in_inches(num) {
  var remainder = num % 1;
  var fraction = new Fraction(remainder);
  if (remainder == 0) {
    return num;
  }
  return Math.floor(num) + " " + round_to_sixteenth(remainder) + "\"";
}

function round_to_sixteenth(fraction) {
  var round = (Math.round(fraction * 16) / 16.0);
  var fraction = new Fraction(round);
  return fraction.numerator + "/" + fraction.denominator;
}

