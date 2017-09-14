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
      mesh.geometry.dynamic = true;
      mesh.geometry.verticesNeedUpdate = true;
      //var mat = new THREE.MeshBasicMaterial( { color: 0xffffff, wireframe : false  }  );
      //mesh.material = mat;
    });

    var head   = object.getObjectByName("Layer_Horizontal_Frame_1_Head_ESEL101A");
    var sill   = object.getObjectByName("Layer_Horizontal_Frame_2_Sill_ESEL102");
    var jamb1  = object.getObjectByName("Layer_Vertical_Frame_1_Jamb_1_ESEL104");
    var jamb2  = object.getObjectByName("Layer_Vertical_Frame_2_Jamb_2_ESEL104");
    var hbead1  = object.getObjectByName("Layer_Horizontal_A_1_Glazing_Bead_Fixed__1_ESEL110");
    var hbead2  = object.getObjectByName("Layer_Horizontal_A_2_Glazing_Bead_Fixed_2_ESEL110");
    var vbead1 = object.getObjectByName("Layer_Vertical_A_1_Glazing_Bead_Fixed_1_ESEL110");
    var vbead2 = object.getObjectByName("Layer_Vertical_A_2_Glazing_Bead_Fixed_2_ESEL110");

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

    //var center1 = jamb1.geometry.center();
    //var center2 = jamb2.geometry.center();
    //var v1 = new THREE.Vector3(center1.x, center1.y, center1.z);
    //var v2 = new THREE.Vector3(center2.x, center2.y, center2.z);
    //jamb1.position.x = v1.distanceTo(v2)+10;
    //bead1.position.z = -headOffset;
    //vbead1.position.z = 1;
  });
}

function resize() {
  
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
