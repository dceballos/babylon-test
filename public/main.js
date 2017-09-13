window.onload=function(){
  threedobj = null;
  init();
  animate();
  var loader = new THREE.OBJLoader();
  loader.load( 'cactus-3d.obj', function ( object ) {
    object.rotation.x = Math.PI/2;
    scene.add(object);

    var verticalScale = 1.8;
    object.children.forEach(function(mesh) {
      console.log(mesh.name);
    });

    var head = object.getObjectByName("Layer_Horizontal_Frame_1_Head_ESEL101A");
    var sill = object.getObjectByName("Layer_Horizontal_Frame_2_Sill_ESEL102");
    var jamb1 = object.getObjectByName("Layer_Vertical_Frame_1_Jamb_1_ESEL104");
    var jamb2 = object.getObjectByName("Layer_Vertical_Frame_2_Jamb_2_ESEL104");
    var bead1 = object.getObjectByName("Layer_Horizontal_A_1_Glazing_Bead_Fixed__1_ESEL110");
    var vbead1 = object.getObjectByName("Layer_Vertical_A_1_Glazing_Bead_Fixed_1_ESEL110");

    var jambBox = new THREE.Box3().setFromObject(jamb1);
    var jambHeight = jambBox.max.z - jambBox.min.z;
    var newJambHeight = jambHeight*verticalScale;
    var headOffset = (newJambHeight-jambHeight)/2;
    console.log(jamb1);

    jamb1.scale.z = verticalScale;
    jamb2.scale.z = verticalScale;
    head.position.z = -headOffset;;
    sill.position.z = headOffset;
    bead1.position.z = -headOffset;

    console.log(headOffset);

    //var center1 = jamb1.geometry.center();
    //var center2 = jamb2.geometry.center();
    //var v1 = new THREE.Vector3(center1.x, center1.y, center1.z);
    //var v2 = new THREE.Vector3(center2.x, center2.y, center2.z);
    //jamb1.position.x = v1.distanceTo(v2)+10;
    //bead1.position.z = -headOffset;
    //vbead1.scale.z = verticalScale;
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
