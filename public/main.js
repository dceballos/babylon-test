window.onload=function(){
  threedobj = null;
  init();
  animate();
  var loader = new THREE.OBJLoader();
  loader.load( 'cactus-3d.obj', function ( object ) {

    scene.add(object);
    var verticalScale = 1.9;
    object.children.forEach(function(mesh) {
      console.log(mesh.name);
			//var material = new THREE.MeshLambertMaterial({reflectivity:1});
			//mesh.material = material;
      mesh.geometry.dynamic = true;
      mesh.geometry.verticesNeedUpdate = true;
    });

/*
    var head   = object.getObjectByName("Layer_Frame_Top_1_Head_ESEL101A");
    var sill   = object.getObjectByName("Layer_Frame_Bottom_1_Sill_ESEL102");
    var jamb1  = object.getObjectByName("Layer_Frame_Left_1_Jamb_1_ESEL104");
    var jamb2  = object.getObjectByName("Layer_Frame_Right_1_Jamb_2_ESEL104");
    var hbead1 = object.getObjectByName("Layer_A_Top_1_Glazing_Bead_Fixed__1_ESEL110");
    var hbead2 = object.getObjectByName("Layer_A_Bottom_1_Glazing_Bead_Fixed_2_ESEL110");
    var vbead1 = object.getObjectByName("Layer_A_Left_1_Glazing_Bead_Fixed_1_ESEL110");
    var vbead2 = object.getObjectByName("Layer_A_Right_1_Glazing_Bead_Fixed_2_ESEL110");

    var jambBox       = new THREE.Box3().setFromObject(jamb1);
    var jambHeight    = jambBox.max.y - jambBox.min.y;
    var newJambHeight = jambHeight*verticalScale;

    jamb1.scale.y    = verticalScale;
    jamb2.scale.y    = verticalScale;

    var jambBoxFinal  = new THREE.Box3().setFromObject(jamb1);
    var headBoxBefore =  new THREE.Box3().setFromObject(jamb1);
    var headOffset    = jambBoxFinal.max.y-jambBox.max.y;
    head.position.y  = headOffset;
    sill.position.y  = -headOffset;

    var hBead1Box       = new THREE.Box3().setFromObject(hbead1);
    var hBead2Box       = new THREE.Box3().setFromObject(hbead2);
    var panelCenterBefore = (hBead1Box.min.y-hBead2Box.max.y)/2;
    hbead1.position.y   = headOffset;
    var hBead1BoxAfter  = new THREE.Box3().setFromObject(hbead1);
    var panelCenter     = (hBead1BoxAfter.min.y-hBead2Box.max.y)/2;
    console.log(panelCenter,panelCenterBefore);

    var vBead1Box = new THREE.Box3().setFromObject(vbead1);
    var vBead1Len = vBead1Box.max.y-vBead1Box.min.y;
    var vBead1LenNew = hBead1BoxAfter.min.y-hBead2Box.max.y;
    var vBeadScaleFactor = vBead1LenNew/vBead1Len;
    console.log(vBeadScaleFactor);
    vbead1.scale.y = vBeadScaleFactor;
    vbead2.scale.y = vBeadScaleFactor;
    var vBead1BoxAfter = new THREE.Box3().setFromObject(vbead1);
    console.log(vBead1Box);
    vbead1.position.y = -(vBead1BoxAfter.min.y-hBead2Box.max.y);
    vbead2.position.y = -(vBead1BoxAfter.min.y-hBead2Box.max.y);
*/
    //var center1 = jamb1.geometry.center();
    //var center2 = jamb2.geometry.center();
    //var v1 = new THREE.Vector3(center1.x, center1.y, center1.z);
    //var v2 = new THREE.Vector3(center2.x, center2.y, center2.z);
    //jamb1.position.x = v1.distanceTo(v2)+10;
    //bead1.position.z = -headOffset;
    //vbead1.position.z = 1;
		var frameBox = meshBox(object);
		var parts = meshesAsParts(object);
		console.log(parts);
		verticallyScale(1.6, parts, frameBox);
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

function verticallyScale(factor, parts, frameBox) {
	// Frame, Rails, Panels
	// Translate then scale then adjust(translate)

	var ogParts     = Object.assign({}, parts);
	var frameHeight = frameBox.max.y-frameBox.min.y;	
	var frameWidth  = frameBox.max.y-frameBox.min.y;

	// Translate frame top parts
	var ftparts = Object.keys(parts.frame['top']).sort();
	ftparts.forEach(function(order) {
		var mesh   = parts.frame['top'][order];
		var box    = meshBox(mesh);
		var height = meshHeight(mesh);
		var newPos = (((frameHeight*factor)-frameHeight)/2);
		mesh.position.y = newPos;
	});
	
	// Translate frame bottom parts
	var fbparts = Object.keys(parts.frame['bottom']).sort();
	fbparts.forEach(function(order) {
		console.log(order);
		var mesh   = parts.frame['bottom'][order];
		var box    = meshBox(mesh);
		var height = meshHeight(mesh);
		var newPos = (((frameHeight*factor)-frameHeight)/2);
		mesh.position.y = -newPos;
		console.log(frameHeight,newPos);
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

    if (frameHeight == height+meshHeight(head)+meshHeight(sill)) {
			offset = meshHeight(head)+meshHeight(sill);
			console.log(offset);
		}else if (frameHeight == height+meshHeight(head)) {
			offset = meshHeight(head)+meshHeight(head);
		}else if (frameHeight == height+meshHeight(sill)) {
			offset = meshHeight(head)+meshHeight(sill);
		}

		var newHeight = (frameHeight*factor)-offset;
		var newFactor = newHeight/height;
		mesh.scale.y  = newFactor;

		var newPos    = 0;
		var box       = meshBox(mesh);
		var headBox   = meshBox(head);
		var ogHeadBox = meshBox(ogHead);

		if (frameBox.max.y == ogHeadBox.max.y) {
			newPos = headBox.max.y-box.max.y;
		}else{
			newPos = headBox.min.y-box.max.y;
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

    if (frameHeight == height+meshHeight(head)+meshHeight(sill)) {
			offset = meshHeight(head)+meshHeight(sill);
			console.log(offset);
		}else if (frameHeight == height+meshHeight(head)) {
			offset = meshHeight(head)+meshHeight(head);
		}else if (frameHeight == height+meshHeight(sill)) {
			offset = meshHeight(head)+meshHeight(sill);
		}

		var newHeight = (frameHeight*factor)-offset;
		var newFactor = newHeight/height;
		mesh.scale.y  = newFactor;

		var newPos    = 0;
		var box       = meshBox(mesh);
		var headBox   = meshBox(head);
		var ogHeadBox = meshBox(ogHead);

		if (frameBox.max.y == ogHeadBox.max.y) {
			newPos = headBox.max.y-box.max.y;
		}else{
			newPos = headBox.min.y-box.max.y;
		}

		mesh.position.y = newPos;
	});

	// Position rails
	var rparts = Object.keys(parts.rails).sort();
	rparts.forEach(function(order) {
		var mesh     = parts.rails[order];
		var box      = meshBox(mesh);
	});

	// Position panels
	var panelNames = Object.keys(parts.panels).sort();
	panelNames.forEach(function(panelName) {
		var ogPanel       = ogParts.panels[panelName];
		var ogPanelHeight = panelHeight(ogPanel);
		var panel         = parts.panels[panelName];
		console.log("ogpanel", panelName , " h:", ogPanelHeight);
		
		// translate top parts
		var ptparts = Object.keys(panel['top']).sort();
		ptparts.forEach(function(part) {
			var mesh   = panel['top'][part];
			var newPos = ((ogPanelHeight*factor)-ogPanelHeight)/2;
			console.log(part, newPos);
			mesh.position.y = newPos;
		});
		
		var pbparts = Object.keys(panel['bottom']).sort();
		pbparts.forEach(function(part) {
			var mesh   = panel['bottom'][part];
			var newPos = ((ogPanelHeight*factor)-ogPanelHeight)/2;
			console.log("bottom", newPos);
			mesh.position.y = -newPos;
		});	

		var plparts = Object.keys(panel['left']).sort();
		plparts.forEach(function(part) {
			var mesh = panel['left'][part];
			var currentPanelHeight = panelHeight(panel);
			var ratio = (currentPanelHeight+(panelOffset(panel)/2))/ogPanelHeight;
			console.log(ogPanelHeight,currentPanelHeight, ratio);
			mesh.scale.y = ratio;
		});

		var plparts = Object.keys(panel['right']).sort();
		plparts.forEach(function(part) {
			var mesh = panel['right'][part];
			var currentPanelHeight = panelHeight(panel);
			var ratio = (currentPanelHeight+(panelOffset(panel)/2))/ogPanelHeight;
			console.log(ogPanelHeight,currentPanelHeight, ratio);
			mesh.scale.y = ratio;
		});

		var previous = previousItem(panelName, parts, ogParts);

		var ptparts = Object.keys(panel['top']).sort();
		ptparts.forEach(function(part) {
			var mesh   = panel['top'][part];
      var ogMesh = ogPanel['top'][part];
			var previousOffset = previousItemOffset(ogMesh, previous);
			mesh.position.y = mesh.position.y+previousOffset;
		});
		
		var pbparts = Object.keys(panel['bottom']).sort();
		pbparts.forEach(function(part) {
			var mesh   = panel['bottom'][part];
      var ogMesh = ogPanel['bottom'][part];
			var previousOffset = previousItemOffset(ogMesh, previous);
			mesh.position.y = mesh.position.y+previousOffset;
		});

		var pbparts = Object.keys(panel['left']).sort();
		pbparts.forEach(function(part) {
			var mesh   = panel['left'][part];
			var offset = (panelHeight(panel) - meshHeight(mesh)) / 2;
			mesh.position.y = mesh.position.y+(offset/2);
		});

		var pbparts = Object.keys(panel['right']).sort();
		pbparts.forEach(function(part) {
			var mesh   = panel['right'][part];
			var offset = (panelHeight(panel) - meshHeight(mesh)) / 2;
			mesh.position.y = mesh.position.y+(offset/2);
		});
	});
	
}

function previousItemOffset(current, previous) {
	var currentBox  = meshBox(current);
	var previousBox = meshBox(previous);
	return previousBox.min.y - currentBox.max.y;
}

function previousItem(panelName, parts, ogParts) {
	var panel = parts.panels[panelName];
	var ogPanel = ogParts.panels[panelName];

	if (panelName == "a") {
		var topStackItems = Object.keys(ogParts.frame['top']).sort();
		var lastFrameTop = ogParts.frame['top'][topStackItems[topStackItems.length-1]];
		return lastFrameTop;
		//var lastFrameTopBox = meshBox(lastFrameTop);
		//return lastFrameTopBox.min.y-panelTopMax(panel);
	}else{
		var panelNames = Object.keys(ogParts.panels);
		var currentPanelIndex = panelNames.indexOf(panelName);
		var prevPanelName = panelNames[currentPanelIndex-1];
		var prevPanel = ogParts.panels[prevPanelName];
		var bottomStackItems = Object.keys(prevPanel['bottom']).sort();
		var lastPanelBottom = prevPanel['bottom'][bottomStackItems[bottomStackItems.length-1]];
		return lastPanelBottom
	}
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
	var box = meshBox(panel['top'][parts[0]])
	return box.min.y;
}

function panelTopMax(panel) {
	var parts = Object.keys(panel['top']).sort();
	var box = meshBox(panel['top'][parts[0]])
	return box.max.y;
}

function panelBottomMin(panel) {
	var parts = Object.keys(panel['bottom']).sort();
	var box = meshBox(panel['bottom'][parts[parts.length-1]])
	return box.min.y;
}

function meshesAsParts(object) {
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
				parts[name][position][stackPos] = mesh;
			}else{
				parts[name][position] = {};
				parts[name][position][stackPos] = mesh;
			}
		}else if (name == "rail") {
			var position = meshParts[2];
			parts['rails'][position] = mesh;
		}else if (name.length == 1) {
			var position = meshParts[2];
			var stackPos = meshParts[3];
			if (parts['panels'][name]) {
				if (parts['panels'][name][position]) {
					parts['panels'][name][position][stackPos] = mesh;
				}else{
					parts['panels'][name][position] = {};
					parts['panels'][name][position][stackPos] = mesh;
				}
			}else{
				parts['panels'][name] = {};
				parts['panels'][name][position] = {};
				parts['panels'][name][position][stackPos] = mesh;
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
  console.log(container)
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
}

function animate() {
  requestAnimationFrame( animate );
  render();
}

function render() {
  renderer.render( scene, camera );
}
