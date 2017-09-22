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
  var ogObject              = ogmodel;
  var factor                = height/meshHeight(ogObject);
  var ogFrameBox            = meshBox(ogObject);
  var parts                 = meshesAsParts(object,false);
  var ogParts               = meshesAsParts(ogObject,true);
  var ogFrameHeight         = ogFrameBox.max.y-ogFrameBox.min.y;	
  var ogFrameWidth          = ogFrameBox.max.y-ogFrameBox.min.y;
  var ogVerticalFrameOffset = ogFrameHeight-panelsDLOHeightSum(ogParts);
  var ogFrameDLO            = ogFrameHeight-ogVerticalFrameOffset;

  // Translate frame top parts
  var ftparts = Object.keys(parts.frame['top']).sort();
  ftparts.forEach(function(order) {
    var mesh        = parts.frame['top'][order];
    var newHeight   = ogFrameHeight*factor;
    var newPos      = ((newHeight-ogFrameHeight)/2);
    mesh.position.y = newPos;
  });

  // Translate frame bottom parts
  var fbparts = Object.keys(parts.frame['bottom']).sort();
  fbparts.forEach(function(order) {
    var mesh        = parts.frame['bottom'][order];
    var newHeight   = ogFrameHeight*factor;
    var newPos      = ((newHeight-ogFrameHeight)/2);
    mesh.position.y = -newPos;
  });

  // Scale frame left parts
  var flparts = Object.keys(parts.frame['left']).sort();
  flparts.forEach(function(order) {
    var mesh      = parts.frame['left'][order];
    var ogmesh    = ogParts.frame['left'][order];
    var ogheight  = meshHeight(ogmesh);
    var offset    = ogFrameHeight-ogheight;
    var newHeight = ogFrameHeight*factor;
    var newFactor = (newHeight-offset)/ogheight;
    mesh.scale.y  = newFactor;
  });

  // Scale frame right parts
  var frparts = Object.keys(parts.frame['right']).sort();
  frparts.forEach(function(order) {
    var mesh      = parts.frame['right'][order];
    var ogmesh    = ogParts.frame['right'][order];
    var ogheight  = meshHeight(ogmesh);
    var offset    = ogFrameHeight-ogheight;
    var newHeight = ogFrameHeight*factor;
    var newFactor = (newHeight-offset)/ogheight;
    mesh.scale.y  = newFactor;
  });

  var newFrameHeight      = ogFrameHeight*factor;
  var verticalFrameOffset = totalHeightOffset(parts);
  var ogDLOSum            = panelsDLOHeightSum(ogParts);
  var newFrameDLO         = newFrameHeight-verticalFrameOffset;

  // Position panels
  var panelNames = Object.keys(parts.panels).sort();
  var colors     = {"a":"red","b":"blue","c":"green"}

  panelNames.forEach(function(panelName, index) {
    var panel         = parts.panels[panelName];
    var previous      = previousVerticalPanelItem(panelName, parts);
    var ogPrevious    = previousVerticalPanelItem(panelName, ogParts);
    var ogPanel       = ogParts.panels[panelName];
    var ogPanelHeight = panelHeight(ogPanel);
    var ogDLOHeight   = panelDLOHeight(ogPanel); 
    var ogDLORatio    = ogDLOHeight/ogDLOSum;
    var ogPrevious    = previousVerticalPanelItem(panelName, ogParts);
    var ogPreviousBox = meshBox(ogPrevious);
    var newDLOHeight  = newFrameDLO*ogDLORatio;

    // translate top parts
    var ptparts = Object.keys(panel['top']).sort();
    ptparts.forEach(function(part) {
      var mesh        = panel['top'][part];
      var ogMesh      = ogPanel['top'][part];
      var ogPrevDist  = previousItemTopOffset(ogMesh, ogPrevious);
      var box         = meshBox(ogMesh) 
      var from        = meshBox(previous).min.y-ogPrevDist;
    var distance    = from-box.max.y;
    mesh.position.y = distance
    });

    // translate bottom parts
    var pbparts = Object.keys(panel['bottom']).sort();
    pbparts.forEach(function(part) {
      var mesh        = panel['bottom'][part];
      var ogMesh      = ogPanel['bottom'][part];
      var box         = meshBox(ogMesh) 
      var from        = panelTopMin(panel)-newDLOHeight;
    var distance    = from-box.max.y;
    mesh.position.y = distance;
    });	

    // scale left parts
    var plparts = Object.keys(panel['left']).sort();
    plparts.forEach(function(part) {
      var mesh      = panel['left'][part];
      var ogMesh    = ogPanel['left'][part];
      var ogHeight  = meshHeight(ogMesh);
      var dloOffset = ogHeight-ogDLOHeight;
      var newHeight = (newFrameDLO*ogDLORatio)+dloOffset;
      var newLenRat = newHeight/ogHeight;
      mesh.scale.y  = newLenRat;
    });

    // scale right parts
    var plparts = Object.keys(panel['right']).sort();
    plparts.forEach(function(part) {
      var mesh      = panel['right'][part];
      var ogMesh    = ogPanel['right'][part];
      var ogHeight  = meshHeight(ogMesh);
      var dloOffset = ogHeight-ogDLOHeight;
      var newHeight = (newFrameDLO*ogDLORatio)+dloOffset;
      var newLenRat = newHeight/ogHeight;
      mesh.scale.y  = newLenRat;
    });

    // correct scaled left bars
    // look for other solutions to this
    var pbparts = Object.keys(panel['left']).sort();
    pbparts.forEach(function(part) {
      var mesh           = panel['left'][part];
      var ogMesh         = ogPanel['left'][part];
      var box            = meshBox(mesh) 
      var previousOffset = previousItemTopOffset(ogMesh, ogPrevious);
    var previousBox    = meshBox(previous);
    var distance       = previousBox.min.y-box.max.y-previousOffset;
    mesh.position.y    = mesh.position.y+distance;
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
    mesh.position.y    = mesh.position.y+distance;
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

  updateInfo();
  updateMeshInfo(current_mesh);
}

function resizeWidth(width, object) {
  // Frame, Rails, Panels
  // Translate then scale then adjust(translate)
  var ogObject                = ogmodel;
  var factor                  = width/meshWidth(ogObject);
  var ogFrameBox              = meshBox(ogObject);
  var parts                   = meshesAsParts(object,false);
  var ogParts                 = meshesAsParts(ogObject,true);
  var ogFrameHeight           = ogFrameBox.max.y-ogFrameBox.min.y;	
  var ogFrameWidth            = ogFrameBox.max.x-ogFrameBox.min.x;
  var ogHorizontalFrameOffset = totalWidthOffset(ogParts);
  var ogFrameDLO              = ogFrameWidth-ogHorizontalFrameOffset;

  var ftparts = Object.keys(parts.frame['top']).sort();
  var fbparts = Object.keys(parts.frame['bottom']).sort();
  var frparts = Object.keys(parts.frame['right']).sort();
  var flparts = Object.keys(parts.frame['left']).sort();

  // Translate frame sides
  flparts.forEach(function(order) {
    var mesh      = parts.frame['left'][order];
    var newWidth  = ogFrameWidth*factor;
    var newPos    = ((newWidth-ogFrameWidth)/2);
    mesh.position.x = -newPos;
  });

  frparts.forEach(function(order) {
    var mesh      = parts.frame['right'][order];
    var newWidth  = ogFrameWidth*factor;
    var newPos    = ((newWidth-ogFrameWidth)/2);
    mesh.position.x = newPos;
  });

  // Scale frame top parts
  ftparts.forEach(function(order) {
    var mesh      = parts.frame['top'][order];
    var ogmesh    = ogParts.frame['top'][order];
    var ogwidth   = meshWidth(ogmesh);
    var offset    = ogFrameWidth-ogwidth;
    var newWidth  = (ogFrameWidth*factor)-offset;
    var newFactor = newWidth/ogwidth;
    mesh.scale.x  = newFactor;
  });

  // Scale frame bottom parts
  fbparts.forEach(function(order) {
    var mesh      = parts.frame['bottom'][order];
    var ogmesh    = ogParts.frame['bottom'][order];
    var ogwidth   = meshWidth(ogmesh);
    var offset    = ogFrameWidth-ogwidth;
    var newWidth  = (ogFrameWidth*factor)-offset;
    var newFactor = newWidth/ogwidth;
    mesh.scale.x  = newFactor;
  });

  // NOTE: Remember some of these vars are relative to orientation
  // Change later for doors
  var newFrameWidth          = ogFrameWidth*factor;
  var horizontalFrameOffset  = totalWidthOffset(ogParts);
  var newFrameDLO            = newFrameWidth-horizontalFrameOffset;
  var ogDLOSum               = panelsDLOWidthSum(ogParts);

  // Position panels
  var panelNames = Object.keys(parts.panels).sort();
  var colors     = {"a":"red","b":"blue","c":"green"}

  panelNames.forEach(function(panelName, index) {
    var name          = panelName;
    var panel         = parts.panels[panelName];
    var ogPanel       = ogParts.panels[panelName];
    var ogPanelWidth  = panelWidth(ogPanel);
    var ogDLOWidth    = panelDLOWidth(ogPanel); 
    var ogDLORatio    = 1;
    var newDLOWidth   = newFrameDLO*ogDLORatio;

    // translate left
    var plparts = Object.keys(panel['left']).sort();
    var prparts = Object.keys(panel['right']).sort();
    var ptparts = Object.keys(panel['top']).sort();
    var pbparts = Object.keys(panel['bottom']).sort();

    // translate left parts
    plparts.forEach(function(part) {
      var mesh        = panel['left'][part];
      var ogMesh      = ogPanel['left'][part];
      var ogwidth     = meshWidth(ogMesh);
      var offset      = ogFrameWidth-ogwidth;
      var newWidth    = (ogFrameWidth*factor)-offset;
      mesh.position.x = -newWidth/2;
    });

    // translate right parts
    prparts.forEach(function(part) {
      var mesh        = panel['right'][part];
      var ogMesh      = ogPanel['right'][part];
      var ogwidth     = meshWidth(ogMesh);
      var offset      = ogFrameWidth-ogwidth;
      var newWidth    = (ogFrameWidth*factor)-offset;
      mesh.position.x = newWidth/2;
    });

    // scale top parts
    ptparts.forEach(function(part) {
      var mesh      = panel['top'][part];
      var ogMesh    = ogPanel['top'][part];
      var ogwidth   = meshWidth(ogMesh);
      var offset    = ogFrameWidth-ogwidth;
      var newWidth  = (ogFrameWidth*factor)-offset;
      var newFactor = newWidth/ogwidth;
      mesh.scale.x  = newFactor;
    });

    // scale bottom parts
    pbparts.forEach(function(part) {
      var mesh      = panel['bottom'][part];
      var ogMesh    = ogPanel['bottom'][part];
      var ogwidth   = meshWidth(ogMesh);
      var offset    = ogFrameWidth-ogwidth;
      var newWidth  = (ogFrameWidth*factor)-offset;
      var newFactor = newWidth/ogwidth;
      mesh.scale.x  = newFactor;
    });
  });

  // Scale rail - same as top
  var rparts = Object.keys(parts.rails).sort();
  rparts.forEach(function(order) {
    var mesh      = parts.rails[order];
    var ogmesh    = ogParts.rails[order];
    var ogwidth   = meshWidth(ogmesh);
    var offset    = ogFrameWidth-ogwidth;
    var newWidth  = (ogFrameWidth*factor)-offset;
    var newFactor = newWidth/ogwidth;
    mesh.scale.x  = newFactor;
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

function previousVerticalPanelItem(panelName, parts) {
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

function totalWidthOffset(parts) {
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

function totalHeightOffset(parts) {
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
    dlosum += panelDLOHeight(panel);
  });
  return dlosum;
}

function panelsDLOWidthSum(parts) {
  var dlosum = 0;
  var panelNames = Object.keys(parts.panels).sort();
  panelNames.forEach(function(name) {
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

function updateGeometry(jamb1) {
  jamb1.updateMatrix();
  jamb1.geometry.applyMatrix(jamb1.matrix);
  jamb1.matrix.identity();
}

function init() {
  renderer = new THREE.WebGLRenderer();
  renderer.setSize( window.innerWidth, window.innerHeight );

  container = document.getElementById( 'container' );
  container.appendChild( renderer.domElement );

  camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 2000 );
  camera.position.z = 200;

  controls = new THREE.TrackballControls( camera );
  controls.rotateSpeed = 3.0;
  controls.zoomSpeed = 7.0;
  controls.panSpeed = 3.0;
  controls.noZoom = false;
  controls.noRotate = true;
  controls.noPan = true;
  controls.staticMoving = true;
  controls.dynamicDampingFactor = 0;

  scene = new THREE.Scene();

  var ambient = new THREE.AmbientLight( 0x101030 );
  scene.add( ambient );

  var directionalLight = new THREE.DirectionalLight( 0xffeedd );
  directionalLight.position.set( 0, 0, 1 );
  scene.add( directionalLight );

  var loader = new THREE.OBJLoader();
  loader.load( 'cactus-3d.obj', function ( object ) {
    object.name = "esmodel";
    object.children.forEach(function(mesh) {
      mesh.geometry.dynamic = true;
      mesh.geometry.verticesNeedUpdate = true;
      mesh.callback = function() { 
        updateMeshInfo(mesh);
        selectColor(mesh);
        mesh.geometry.dynamic = true;
        mesh.geometry.verticesNeedUpdate = true;
        current_mesh = mesh;
      }
    }); 
    model   = object;
    ogmodel = object.clone();
    originalHeight = meshHeight(ogmodel);
    originalWidth  = meshWidth(ogmodel);
    scene.add(object);
    updateInfo();
  });

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
    intersects[0].object.callback();
  }

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
  info.innerHTML = "Width: "+display_in_inches(meshWidth(model))+" Height: "+display_in_inches(meshHeight(model));
}

function updateMeshInfo(mesh) {
  console.log(mesh.name);
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
    length = meshWidth(mesh);
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

