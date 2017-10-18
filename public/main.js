window.onload=function(){
  if (orientation == null) {
    alert("please selct orientation");
  }
  title           = document.createElement('div');
  info            = document.createElement('div');
  mesh_info       = document.createElement('div');

  light            = null;
  model            = null;
  og_model         = null;
  og_parts         = null;
  original_height  = null;
  original_width   = null;
  current_mesh     = null;
  panel_dlo_ratios = {};

  append_title();
  append_info();
  append_mesh_info();

  init();
  events();
  animate();
}

function do_height_resize() {
  var scaler     = document.getElementById("hscaler");
  var value      = (scaler.value/100)+1;
  var new_height = original_height*value;
  resize_height(new_height, model);
  update_info();
  update_mesh_info(current_mesh);
}

function do_width_resize() {
  var scaler    = document.getElementById("wscaler");
  var value     = (scaler.value/100)+1;
  var new_width = original_width*value;
  resize_width(new_width, model);
  update_info();
  update_mesh_info(current_mesh);
}

function resize_width(new_width, model) {
  if (orientation == "vertical") {
    resize_width_vertical(new_width,model);
  }else{
    resize_width_horizontal(new_width,model);
  }
}

function resize_height(new_height,model) {
  if (orientation == "vertical") {
    resize_height_vertical(new_height,model);
  }else{
    resize_height_horizontal(new_height,model);
  }
}

// get center
// anything less subtract
// anything greater add
function stretch(mesh, points, axis, stretch_intervals=[]) {

  if (stretch_intervals && stretch_intervals.length === 2) {
    stretch_intervals = Object.keys(og_parts.panels).map(function (panel_key) {
      panel = og_parts.panels[panel_key];
      return [panel_left_max(panel), panel_right_min(panel)]
    });
  }


  var geometry = mesh.geometry;
  geometry.computeBoundingBox();
  var new_geo              = geometry.clone();
  var bounding_box         = new_geo.boundingBox;
	var translated_intervals = translate_stretch_intervals(stretch_intervals, bounding_box, axis, points);
	var center               = bounding_box.getCenter()[axis];

  var length = bounding_box.max[axis] - bounding_box.min[axis];

  new_geo.vertices.forEach(function(v) {
    translation = translated_intervals.reduce(function(acc, interval) {
      if (v[axis] >= (interval['points'][0] + 0.001)) {
        return acc + interval['translation']
      } else {
        return acc;
      }
    }, 0);

    v[axis] += translation - (points / 2)
  });

  // if (stretch_intervals.length > 1 && length <= points ) {
  //   debugger;
  // }

  return new_geo;
}

function truncate(number) {
 return Math.floor(number * 1000) / 1000.0;
}

function translate_stretch_intervals(stretch_intervals, box, axis, points) {
  if (stretch_intervals.length < 1) {
    return [{
      'points': [box.min[axis] + ((box.max[axis] - box.min[axis])/2), box.max[axis]],
      'translation': points
    }]
  }

  total_interval_length = stretch_intervals.reduce(function (acc, interval) {
                            return acc + interval[1] - interval[0]
                          }, 0);

	var min = box.min[axis];

	return stretch_intervals.map(function(stretch_interval) {
		return {
      'points': [stretch_interval[0], stretch_interval[1]],
      'translation': points * (stretch_interval[1] - stretch_interval[0]) / total_interval_length
    }
	});
}

function stretch_interval_ratios(mesh, axis, intervals) {
	if (intervals.length == 0) return [[0,1]]
	var mesh_len = mesh_length(mesh,axis);
	var ratios   = intervals.map(function(pair) {
		var a = [];
		a[0]  = pair[0]/mesh_len;
		a[1]  = pair[1]/mesh_len;
		return a;
	});
	return ratios;
}

function resize_panel_dlo(panel_name, height) {
  var parts = meshes_as_parts(model,false);
  var dlo_sum = vertical_panels_dlo_height_sum(parts);
  if (height >= dlo_sum) {
		return;
	}
  var frame_height = mesh_height(model);
  var new_ratios   = dlo_height_ratios(height, panel_name);
  panel_dlo_ratios = new_ratios;
  resize_height(frame_height, model);
}

function og_vertical_dlo_ratios() {
  var ratios = {};
  var panel_names = Object.keys(og_parts.panels).sort();
  panel_names.forEach(function(panel_name, index) {
    var og_dlo_ratio    = vertical_panels_dlo_ratio(panel_name);
    ratios[panel_name]  = og_dlo_ratio;
  });
  return ratios;
}

function og_horizontal_dlo_ratios() {
  var ratios = {};
  var panel_names = Object.keys(og_parts.panels).sort();
  panel_names.forEach(function(panel_name, index) {
    var og_dlo_ratio    = horizontal_panels_dlo_ratio(panel_name);
    ratios[panel_name]  = og_dlo_ratio;
  });
  return ratios;
}

function dlo_height_ratios(height, panel_name) {
  var new_ratios         = []
  var parts              = meshes_as_parts(model,false);
  var panel_names        = Object.keys(parts.panels).sort();
  var dlo_sum            = vertical_panels_dlo_height_sum(parts);
  var pheight            = panel_dlo_height(parts.panels[panel_name]);
  var old_difference     = dlo_sum-pheight;
  var new_difference     = dlo_sum-height;
  new_ratios[panel_name] = height/dlo_sum;

  panel_names.forEach(function(name, index) {
    var panel = parts.panels[name];
    if (name != panel_name) {
      var height         = panel_dlo_height(panel);
      var relative_ratio = height/old_difference;
      var new_height     = relative_ratio*new_difference;
      var new_ratio      = new_height/dlo_sum;
      new_ratios[name]   = new_ratio;
    }
  });
  return new_ratios;
}

function resize_width_horizontal(width, object) {
  // Note:  This method assumes a vertical assembly orientation
  // Frame, Rails, Panels
  // Translate then scale
  var og_object                  = og_model;
  var factor                     = width/mesh_width(og_object);
  var og_frame_box               = mesh_box(og_object);
  var parts                      = meshes_as_parts(object,false);
  var og_frame_height            = og_frame_box.max.y-og_frame_box.min.y;	
  var og_frame_width             = og_frame_box.max.x-og_frame_box.min.x;
  var og_horizontal_frame_offset = vertical_orientation_total_width_offset(og_parts);
  var og_frame_dlo               = og_frame_width-og_horizontal_frame_offset;

  var ftparts = Object.keys(parts.frame['top']).sort();
  var fbparts = Object.keys(parts.frame['bottom']).sort();
  var frparts = Object.keys(parts.frame['right']).sort();
  var flparts = Object.keys(parts.frame['left']).sort();

  // Translate frame left side
  flparts.forEach(function(order) {
    var mesh        = parts.frame['left'][order]['mesh'];
    var new_width   = og_frame_width*factor;
    var new_pos     = ((new_width-og_frame_width)/2);
    mesh.position.x = -new_pos;
  });

  // Translate frame right side
  frparts.forEach(function(order) {
    var mesh        = parts.frame['right'][order]['mesh'];
    var new_width   = og_frame_width*factor;
    var new_pos     = ((new_width-og_frame_width)/2);
    mesh.position.x = new_pos;
  });

  // Scale frame top parts
  ftparts.forEach(function(order) {
    var mesh          = parts.frame['top'][order]['mesh'];
    var og_mesh       = og_parts.frame['top'][order]['mesh'];
		var s_intervals   = og_parts.frame['top'][order]['stretch_intervals'];
    var og_width      = mesh_width(og_mesh);
    var offset        = og_frame_width-og_width;
    var new_width     = (og_frame_width*factor)-offset;
    var len_to_resize = new_width-og_width;
    var new_geo       = stretch(og_mesh, len_to_resize, 'x', s_intervals);
    mesh.geometry     = new_geo;
  });

  // Scale frame bottom parts
  fbparts.forEach(function(order) {
    var mesh          = parts.frame['bottom'][order]['mesh'];
    var og_mesh       = og_parts.frame['bottom'][order]['mesh'];
		var s_intervals   = og_parts.frame['bottom'][order]['stretch_intervals'];
    var og_width      = mesh_width(og_mesh);
    var offset        = og_frame_width-og_width;
    var new_width     = (og_frame_width*factor)-offset;
    var len_to_resize = new_width-og_width;
    var new_geo       = stretch(og_mesh, len_to_resize, 'x', s_intervals);
    mesh.geometry     = new_geo;
  });

  // Position panels
  var new_frame_width         = og_frame_width*factor;
  var horizontal_frame_offset = horizontal_panels_total_width_offset(og_parts);
  var og_dlo_sum              = horizontal_panels_dlo_width_sum(og_parts);
  var new_frame_dlo           = new_frame_width-horizontal_frame_offset;
  var panel_names             = Object.keys(parts.panels).sort();
  var colors                  = {"a":"red","b":"blue","c":"green"}

  panel_names.forEach(function(panel_name, index) {
    var panel           = parts.panels[panel_name];
    var previous        = previous_horizontal_panel_item(panel_name, parts);
    var previous_box    = mesh_box(previous);
    var og_previous     = previous_horizontal_panel_item(panel_name, og_parts);
    var og_panel        = og_parts.panels[panel_name];
    var og_panel_width  = panel_width(og_panel);
    var og_dlo_width    = panel_dlo_width(og_panel); 
    var og_dlo_ratio    = panel_dlo_ratios[panel_name];
    var og_previous     = previous_horizontal_panel_item(panel_name, og_parts);
    var og_previous_box = mesh_box(og_previous);
    var new_dlo_width   = new_frame_dlo*og_dlo_ratio;

    // translate left
    var plparts = Object.keys(panel['left']).sort();
    var prparts = Object.keys(panel['right']).sort();
    var ptparts = Object.keys(panel['top']).sort();
    var pbparts = Object.keys(panel['bottom']).sort();

    // translate left parts
    plparts.forEach(function(part) {
      var mesh         = panel['left'][part]['mesh'];
      var og_mesh      = og_panel['left'][part]['mesh'];
      var og_prev_dist = previous_item_left_offset(og_mesh, og_previous);
      var box          = mesh_box(og_mesh) 
      var from         = mesh_box(previous).max.x+og_prev_dist;
      var distance     = from-box.min.x;
      mesh.position.x  = distance
    });

    // translate right parts
    prparts.forEach(function(part) {
      var mesh        = panel['right'][part]['mesh'];
      var og_mesh     = og_panel['right'][part]['mesh'];
      var og_box      = mesh_box(og_mesh) 
      var width       = mesh_width(mesh);
      var new_pos     = panel_left_max(panel)+new_dlo_width+(width/2);
      mesh.position.x = new_pos-og_box.getCenter().x;
    });

    // scale top parts
    ptparts.forEach(function(part) {
      var mesh          = panel['top'][part]['mesh'];
      var og_mesh       = og_panel['top'][part]['mesh'];
      var og_width      = mesh_width(og_mesh);
      var dlo_offset    = og_width-og_dlo_width;
      var new_width     = (new_frame_dlo*og_dlo_ratio)+dlo_offset;
      var len_to_resize = new_width-og_width;
      var new_geo       = stretch(og_mesh, len_to_resize, 'x');
      mesh.geometry     = new_geo;

      // Re-center
      og_mesh.geometry.computeBoundingBox();
      var pmax        = panel_left_max(panel);
      var pmin        = panel_right_min(panel);
      var pwidth      = pmax-pmin;
      var pcenter     = pmax-(pwidth/2);
      var og_pcenter  = og_mesh.geometry.boundingBox.getCenter().x ;
      mesh.position.x = pcenter-og_pcenter;
    });

    // scale bottom parts
    pbparts.forEach(function(part) {
      var mesh          = panel['bottom'][part]['mesh'];
      var og_mesh       = og_panel['bottom'][part]['mesh'];
      var og_width      = mesh_width(og_mesh);
      var dlo_offset    = og_width-og_dlo_width;
      var new_width     = (new_frame_dlo*og_dlo_ratio)+dlo_offset;
      var len_to_resize = new_width-og_width;
      var new_geo       = stretch(og_mesh, len_to_resize, 'x');
      mesh.geometry     = new_geo;

      // Re-center
      og_mesh.geometry.computeBoundingBox();
      var pmax        = panel_left_min(panel);
      var pmin        = panel_right_max(panel);
      var pwidth      = pmax-pmin;
      var pcenter     = pmax-(pwidth/2);
      var og_pcenter  = og_mesh.geometry.boundingBox.getCenter().x ;
      mesh.position.x = pcenter-og_pcenter;
    });
  });

  // Position rails
  var rparts = Object.keys(parts.rails).sort();
  rparts.forEach(function(order) {
    var mesh = parts.rails[order]['mesh'];

    // Compute original center
    var og_previous_panel = previous_rail_panel(order, og_parts);
    var og_next_panel     = next_rail_panel(order, og_parts);
    var og_rtop           = panel_right_max(og_previous_panel);
    var og_rbottom        = panel_left_min(og_next_panel);
    var og_width          = og_rbottom - og_rtop;
    var og_center         = og_rtop+(og_width/2);

    // Compute new center
    var previous_panel  = previous_rail_panel(order, parts);
    var next_panel      = next_rail_panel(order, parts);
    var rtop            = panel_right_max(previous_panel);
    var rbottom         = panel_left_min(next_panel);
    var height          = rbottom - rtop;
    var center          = rtop+(height/2);

    // Offset between centers
    var newpos      = center-og_center
    mesh.position.x = newpos;
  });

}

function resize_height_horizontal(height, object) {
  // Note:  This method assumes a vertical assembly orientation
  // Frame, Rails, Panels
  // Translate then scale
  var og_object        = og_model;
  var factor           = height/mesh_height(og_object);
  var og_frame_box     = mesh_box(og_object);
  var parts            = meshes_as_parts(object,false);
  var og_frame_height  = og_frame_box.max.y-og_frame_box.min.y;	
  var og_frame_width   = og_frame_box.max.y-og_frame_box.min.y;

  var ftparts = Object.keys(parts.frame['top']).sort();
  var fbparts = Object.keys(parts.frame['bottom']).sort();
  var flparts = Object.keys(parts.frame['left']).sort();
  var frparts = Object.keys(parts.frame['right']).sort();

  // Translate frame top parts
  ftparts.forEach(function(order) {
    var mesh        = parts.frame['top'][order]['mesh'];
    var new_height  = og_frame_height*factor;
    var new_pos     = ((new_height-og_frame_height)/2);
    mesh.position.y = new_pos;
  });

  // Translate frame bottom parts
  fbparts.forEach(function(order) {
    var mesh        = parts.frame['bottom'][order]['mesh'];
    var new_height  = og_frame_height*factor;
    var new_pos     = ((new_height-og_frame_height)/2);
    mesh.position.y = -new_pos;
  });

  // Scale frame left parts
  flparts.forEach(function(order) {
    var mesh          = parts.frame['left'][order]['mesh'];
    var og_mesh       = og_parts.frame['left'][order]['mesh'];
    var og_height     = mesh_height(og_mesh);
    var offset        = og_frame_height-og_height;
    var new_height    = (og_frame_height*factor)-offset;
    var len_to_resize = new_height-og_height;
    var new_geo       = stretch(og_mesh, len_to_resize, 'y');
    mesh.geometry     = new_geo;
  });

  // Scale frame right parts
  frparts.forEach(function(order) {
    var mesh          = parts.frame['right'][order]['mesh'];
    var og_mesh       = og_parts.frame['right'][order]['mesh'];
    var og_height     = mesh_height(og_mesh);
    var offset        = og_frame_height-og_height;
    var new_height    = (og_frame_height*factor)-offset;
    var len_to_resize = new_height-og_height;
    var new_geo       = stretch(og_mesh, len_to_resize, 'y');
    mesh.geometry     = new_geo;
  });

  // Position panels
  var new_frame_height      = og_frame_height*factor;
  var height_offset         = horizontal_orientation_total_height_offset(og_parts);
  var new_frame_dlo         = new_frame_height-height_offset;
  var panel_names           = Object.keys(parts.panels).sort();
  var colors                = {"a":"red","b":"blue","c":"green"}
  
  panel_names.forEach(function(panel_name, index) {
    var panel           = parts.panels[panel_name];
    var previous        = previous_horizontal_vertical_panel_item(panel_name, parts);
    var previous_box    = mesh_box(previous);
    var og_previous     = previous_horizontal_vertical_panel_item(panel_name, og_parts);
    var og_panel        = og_parts.panels[panel_name];
    var og_panel_height = panel_height(og_panel);
    var og_dlo_height   = panel_dlo_height(og_panel); 
    var og_dlo_ratio    = 1;
    var og_previous     = previous_horizontal_vertical_panel_item(panel_name, og_parts);
    var og_previous_box = mesh_box(og_previous);
    var new_dlo_height  = new_frame_dlo*og_dlo_ratio;

    // translate top parts
    var ptparts = Object.keys(panel['top']).sort();
    ptparts.forEach(function(part) {
      var mesh         = panel['top'][part]['mesh'];
      var og_mesh      = og_panel['top'][part]['mesh'];
      var og_prev_dist = previous_item_top_offset(og_mesh, og_previous);
      var box          = mesh_box(og_mesh) 
      var from         = mesh_box(previous).max.y-og_prev_dist;
      var distance     = from-box.max.y;
      mesh.position.y  = distance
    });

    // translate bottom parts
    var pbparts = Object.keys(panel['bottom']).sort();
    pbparts.forEach(function(part) {
      var mesh        = panel['bottom'][part]['mesh'];
      var og_mesh     = og_panel['bottom'][part]['mesh'];
      var og_box      = mesh_box(og_mesh) 
      var height      = mesh_height(mesh);
      var new_pos     = panel_top_min(panel)-new_dlo_height-(height/2);
      mesh.position.y = new_pos-og_box.getCenter().y;
    });	

    // scale left parts
    var plparts = Object.keys(panel['left']).sort();
    plparts.forEach(function(part) {
      var mesh          = panel['left'][part]['mesh'];
      var og_mesh       = og_panel['left'][part]['mesh'];
      var og_height     = mesh_height(og_mesh);
      var dlo_offset    = og_height-og_dlo_height;
      var new_height    = (new_frame_dlo*og_dlo_ratio)+dlo_offset;
      var len_to_resize = new_height-og_height;
      var new_geo       = stretch(og_mesh, len_to_resize, 'y');
      mesh.geometry     = new_geo;

      // Re-center
      og_mesh.geometry.computeBoundingBox();
      var pmax        = panel_top_max(panel);
      var pmin        = panel_bottom_min(panel);
      var pheight     = pmax-pmin;
      var pcenter     = pmax-(pheight/2);
      var og_pcenter  = og_mesh.geometry.boundingBox.getCenter().y ;
      mesh.position.y = pcenter-og_pcenter;
    });

    // scale right parts
    var plparts = Object.keys(panel['right']).sort();
    plparts.forEach(function(part) {
      var mesh          = panel['right'][part]['mesh'];
      var og_mesh       = og_panel['right'][part]['mesh'];
      var og_height     = mesh_height(og_mesh);
      var dlo_offset    = og_height-og_dlo_height;
      var new_height    = (new_frame_dlo*og_dlo_ratio)+dlo_offset;
      var len_to_resize = new_height-og_height;
      var new_geo       = stretch(og_mesh, len_to_resize, 'y');
      mesh.geometry     = new_geo;

      // Re-center
      var pmax        = panel_top_max(panel);
      var pmin        = panel_bottom_min(panel);
      var pheight     = pmax-pmin;
      var pcenter     = pmax-(pheight/2);
      var og_pmax     = panel_top_max(og_panel);
      var og_pmin     = panel_bottom_min(og_panel);
      var og_pheight  = og_pmax-og_pmin;
      var og_pcenter  = og_pmax-(og_pheight/2);
      mesh.position.y = pcenter-og_pcenter;
    });
  });

  // Scale rails
  var rparts = Object.keys(parts.rails).sort();
  rparts.forEach(function(order) {
    var mesh          = parts.rails[order]['mesh'];
    var og_mesh       = og_parts.rails[order]['mesh'];
    var og_height     = mesh_height(og_mesh);
    var offset        = og_frame_height-og_height;
    var new_height    = (og_frame_height*factor)-offset;
    var len_to_resize = new_height-og_height;
    var new_geo       = stretch(og_mesh, len_to_resize, 'y');
    mesh.geometry     = new_geo;
  });
}

function resize_height_vertical(height, object) {
  // Note:  This method assumes a vertical assembly orientation
  // Frame, Rails, Panels
  // Translate then scale
  var og_object        = og_model;
  var factor           = height/mesh_height(og_object);
  var og_frame_box     = mesh_box(og_object);
  var parts            = meshes_as_parts(object,false);
  var og_frame_height  = og_frame_box.max.y-og_frame_box.min.y;	
  var og_frame_width   = og_frame_box.max.y-og_frame_box.min.y;

  var ftparts = Object.keys(parts.frame['top']).sort();
  var fbparts = Object.keys(parts.frame['bottom']).sort();
  var flparts = Object.keys(parts.frame['left']).sort();
  var frparts = Object.keys(parts.frame['right']).sort();

  // Translate frame top parts
  ftparts.forEach(function(order) {
    var mesh        = parts.frame['top'][order]['mesh'];
    var new_height  = og_frame_height*factor;
    var new_pos     = ((new_height-og_frame_height)/2);
    mesh.position.y = new_pos;
  });

  // Translate frame bottom parts
  fbparts.forEach(function(order) {
    var mesh        = parts.frame['bottom'][order]['mesh'];
    var new_height  = og_frame_height*factor;
    var new_pos     = ((new_height-og_frame_height)/2);
    mesh.position.y = -new_pos;
  });

  // Scale frame left parts
  flparts.forEach(function(order) {
    var mesh          = parts.frame['left'][order]['mesh'];
    var og_mesh       = og_parts.frame['left'][order]['mesh'];
    var og_height     = mesh_height(og_mesh);
    var offset        = og_frame_height-og_height;
    var new_height    = (og_frame_height*factor)-offset;
    var len_to_resize = new_height-og_height;
    var new_geo       = stretch(og_mesh, len_to_resize, 'y');
    mesh.geometry     = new_geo;
  });

  // Scale frame right parts
  frparts.forEach(function(order) {
    var mesh          = parts.frame['right'][order]['mesh'];
    var og_mesh       = og_parts.frame['right'][order]['mesh'];
    var og_height     = mesh_height(og_mesh);
    var offset        = og_frame_height-og_height;
    var new_height    = (og_frame_height*factor)-offset;
    var len_to_resize = new_height-og_height;
    var new_geo       = stretch(og_mesh, len_to_resize, 'y');
    mesh.geometry     = new_geo;
  });

  // Position panels
  var new_frame_height      = og_frame_height*factor;
  var vertical_frame_offset = vertical_orientation_total_height_offset(og_parts);
  var og_dlo_sum            = vertical_panels_dlo_height_sum(og_parts);
  var new_frame_dlo         = new_frame_height-vertical_frame_offset;
  var panel_names           = Object.keys(parts.panels).sort();
  var colors                = {"a":"red","b":"blue","c":"green"}

  panel_names.forEach(function(panel_name, index) {
    var panel           = parts.panels[panel_name];
    var previous        = previous_vertical_panel_item(panel_name, parts);
    var previous_box    = mesh_box(previous);
    var og_previous     = previous_vertical_panel_item(panel_name, og_parts);
    var og_panel        = og_parts.panels[panel_name];
    var og_panel_height = panel_height(og_panel);
    var og_dlo_height   = panel_dlo_height(og_panel); 
    var og_dlo_ratio    = panel_dlo_ratios[panel_name];
    var og_previous     = previous_vertical_panel_item(panel_name, og_parts);
    var og_previous_box = mesh_box(og_previous);
    var new_dlo_height  = new_frame_dlo*og_dlo_ratio;

    // translate top parts
    var ptparts = Object.keys(panel['top']).sort();
    ptparts.forEach(function(part) {
      var mesh         = panel['top'][part]['mesh'];
      var og_mesh      = og_panel['top'][part]['mesh'];
      var og_prev_dist = previous_item_top_offset(og_mesh, og_previous);
      var box          = mesh_box(og_mesh) 
      var from         = mesh_box(previous).max.y-og_prev_dist;
      var distance     = from-box.max.y;
      mesh.position.y  = distance
    });

    // translate bottom parts
    var pbparts = Object.keys(panel['bottom']).sort();
    pbparts.forEach(function(part) {
      var mesh        = panel['bottom'][part]['mesh'];
      var og_mesh     = og_panel['bottom'][part]['mesh'];
      var og_box      = mesh_box(og_mesh) 
      var height      = mesh_height(mesh);
      var new_pos     = panel_top_min(panel)-new_dlo_height-(height/2);
      mesh.position.y = new_pos-og_box.getCenter().y;
    });	

    // scale left parts
    var plparts = Object.keys(panel['left']).sort();
    plparts.forEach(function(part) {
      var mesh          = panel['left'][part]['mesh'];
      var og_mesh       = og_panel['left'][part]['mesh'];
      var og_height     = mesh_height(og_mesh);
      var dlo_offset    = og_height-og_dlo_height;
      var new_height    = (new_frame_dlo*og_dlo_ratio)+dlo_offset;
      var len_to_resize = new_height-og_height;
      var new_geo       = stretch(og_mesh, len_to_resize, 'y');
      mesh.geometry     = new_geo;

      // Re-center
      og_mesh.geometry.computeBoundingBox();
      var pmax        = panel_top_max(panel);
      var pmin        = panel_bottom_min(panel);
      var pheight     = pmax-pmin;
      var pcenter     = pmax-(pheight/2);
      var og_pcenter  = og_mesh.geometry.boundingBox.getCenter().y ;
      mesh.position.y = pcenter-og_pcenter;
    });

    // scale right parts
    var plparts = Object.keys(panel['right']).sort();
    plparts.forEach(function(part) {
      var mesh          = panel['right'][part]['mesh'];
      var og_mesh       = og_panel['right'][part]['mesh'];
      var og_height     = mesh_height(og_mesh);
      var dlo_offset    = og_height-og_dlo_height;
      var new_height    = (new_frame_dlo*og_dlo_ratio)+dlo_offset;
      var len_to_resize = new_height-og_height;
      var new_geo       = stretch(og_mesh, len_to_resize, 'y');
      mesh.geometry     = new_geo;

      // Re-center
      var pmax        = panel_top_max(panel);
      var pmin        = panel_bottom_min(panel);
      var pheight     = pmax-pmin;
      var pcenter     = pmax-(pheight/2);
      var og_pmax     = panel_top_max(og_panel);
      var og_pmin     = panel_bottom_min(og_panel);
      var og_pheight  = og_pmax-og_pmin;
      var og_pcenter  = og_pmax-(og_pheight/2);
      mesh.position.y = pcenter-og_pcenter;
    });
  });

  // Position rails
  var rparts = Object.keys(parts.rails).sort();
  rparts.forEach(function(order) {
    var mesh = parts.rails[order];

    // Compute original center
    var og_previous_panel = previous_rail_panel(order, og_parts);
    var og_next_panel     = next_rail_panel(order, og_parts);
    var og_rtop           = panel_bottom_min(og_previous_panel);
    var og_rbottom        = panel_top_max(og_next_panel);
    var og_height         = og_rtop-og_rbottom;
    var og_center         = og_rtop-(og_height/2);

    // Compute new center
    var previous_panel  = previous_rail_panel(order, parts);
    var next_panel      = next_rail_panel(order, parts);
    var rtop            = panel_bottom_min(previous_panel);
    var rbottom         = panel_top_max(next_panel);
    var height          = rtop-rbottom;
    var center          = rtop-(height/2);

    // Offset between centers
    var newpos      = center-og_center
    mesh.position.y = newpos;
  });
}

function horizontal_panels_dlo_ratio(panel_name) {
  var og_dlo_sum      = horizontal_panels_dlo_width_sum(og_parts);
  var og_panel        = og_parts.panels[panel_name];
  var og_panel_width  = panel_width(og_panel);
  var og_dlo_width    = panel_dlo_width(og_panel); 
  var og_dlo_ratio    = og_dlo_width/og_dlo_sum;
  return og_dlo_ratio;
}

function vertical_panels_dlo_ratio(panel_name) {
  var og_dlo_sum      = vertical_panels_dlo_height_sum(og_parts);
  var og_panel        = og_parts.panels[panel_name];
  var og_panel_height = panel_height(og_panel);
  var og_dlo_height   = panel_dlo_height(og_panel); 
  var og_dlo_ratio    = og_dlo_height/og_dlo_sum;
  return og_dlo_ratio;
}

function resize_width_vertical(width, object) {
  // Note:  This method assumes a vertical assembly orientation
  // Frame, Rails, Panels
  // Translate then scale
  var og_object                  = og_model;
  var factor                     = width/mesh_width(og_object);
  var og_frame_box               = mesh_box(og_object);
  var parts                      = meshes_as_parts(object,false);
  var og_parts                   = meshes_as_parts(og_object,true);
  var og_frame_height            = og_frame_box.max.y-og_frame_box.min.y;	
  var og_frame_width             = og_frame_box.max.x-og_frame_box.min.x;
  var og_horizontal_frame_offset = vertical_orientation_total_width_offset(og_parts);
  var og_frame_dlo               = og_frame_width-og_horizontal_frame_offset;

  var ftparts = Object.keys(parts.frame['top']).sort();
  var fbparts = Object.keys(parts.frame['bottom']).sort();
  var frparts = Object.keys(parts.frame['right']).sort();
  var flparts = Object.keys(parts.frame['left']).sort();

  // Translate frame left side
  flparts.forEach(function(order) {
    var mesh        = parts.frame['left'][order]['mesh'];
    var new_width   = og_frame_width*factor;
    var new_pos     = ((new_width-og_frame_width)/2);
    mesh.position.x = -new_pos;
  });

  // Translate frame right side
  frparts.forEach(function(order) {
    var mesh        = parts.frame['right'][order]['mesh'];
    var new_width   = og_frame_width*factor;
    var new_pos     = ((new_width-og_frame_width)/2);
    mesh.position.x = new_pos;
  });

  // Scale frame top parts
  ftparts.forEach(function(order) {
    var mesh          = parts.frame['top'][order]['mesh'];
    var og_mesh       = og_parts.frame['top'][order]['mesh'];
    var og_width      = mesh_width(og_mesh);
    var offset        = og_frame_width-og_width;
    var new_width     = (og_frame_width*factor)-offset;
    var len_to_resize = new_width-og_width;
    var new_geo       = stretch(og_mesh, len_to_resize, 'x');
    mesh.geometry     = new_geo;
  });

  // Scale frame bottom parts
  fbparts.forEach(function(order) {
    var mesh          = parts.frame['bottom'][order]['mesh'];
    var og_mesh       = og_parts.frame['bottom'][order]['mesh'];
    var og_width      = mesh_width(og_mesh);
    var offset        = og_frame_width-og_width;
    var new_width     = (og_frame_width*factor)-offset;
    var len_to_resize = new_width-og_width;
    var new_geo       = stretch(og_mesh, len_to_resize, 'x');
    mesh.geometry     = new_geo;
  });

  // Position panels
  // NOTE: Remember some of these vars are relative to orientation
  // Change later for doors
  var new_frame_width          = og_frame_width*factor;
  var horizontal_frame_offset  = vertical_orientation_total_width_offset(og_parts);
  var new_frame_dlo            = new_frame_width-horizontal_frame_offset;
  var og_dlo_sum               = vertical_panels_dlo_width_sum(og_parts);

  var panel_names = Object.keys(parts.panels).sort();
  var colors     = {"a":"red","b":"blue","c":"green"}

  panel_names.forEach(function(panel_name, index) {
    var name           = panel_name;
    var panel          = parts.panels[panel_name];
    var og_panel       = og_parts.panels[panel_name];
    var og_panel_width = panel_width(og_panel);
    var og_dlo_width   = panel_dlo_width(og_panel); 
    var og_dlo_ratio   = 1; // This is only for vertical stack horizontal scaling with 1 panel
    var new_dlo_width  = new_frame_dlo*og_dlo_ratio;

    // translate left
    var plparts = Object.keys(panel['left']).sort();
    var prparts = Object.keys(panel['right']).sort();
    var ptparts = Object.keys(panel['top']).sort();
    var pbparts = Object.keys(panel['bottom']).sort();

    // translate left parts
    plparts.forEach(function(part) {
      var mesh            = panel['left'][part]['mesh'];
      var width           = mesh_width(mesh);
      mesh.position.x     = -(new_dlo_width-og_dlo_width)/2;
    });

    // translate right parts
    prparts.forEach(function(part) {
      var mesh        = panel['right'][part]['mesh'];
      var width       = mesh_width(mesh);
      mesh.position.x = (new_dlo_width-og_dlo_width)/2;
    });

    // scale top parts
    ptparts.forEach(function(part) {
      var mesh          = panel['top'][part]['mesh'];
      var og_mesh       = og_panel['top'][part]['mesh'];
      var og_width      = mesh_width(og_mesh);
      var offset        = og_frame_width-og_width;
      var new_width     = (og_frame_width*factor)-offset;
      var len_to_resize = new_width-og_width;
      var new_geo       = stretch(og_mesh, len_to_resize, 'x');
      mesh.geometry     = new_geo;
    });

    // scale bottom parts
    pbparts.forEach(function(part) {
      var mesh          = panel['bottom'][part]['mesh'];
      var og_mesh       = og_panel['bottom'][part]['mesh'];
      var og_width      = mesh_width(og_mesh);
      var offset        = og_frame_width-og_width;
      var new_width     = (og_frame_width*factor)-offset;
      var len_to_resize = new_width-og_width;
      var new_geo       = stretch(og_mesh, len_to_resize, 'x');
      mesh.geometry     = new_geo;
    });
  });

  // Scale rail - same as top
  var rparts = Object.keys(parts.rails).sort();
  rparts.forEach(function(order) {
    var mesh          = parts.rails[order]['mesh'];
    var og_mesh       = og_parts.rails[order]['mesh'];
    var og_width      = mesh_width(og_mesh);
    var offset        = og_frame_width-og_width;
    var new_width     = (og_frame_width*factor)-offset;
    var len_to_resize = new_width-og_width;
    var new_geo       = stretch(og_mesh, len_to_resize, 'x');
    mesh.geometry     = new_geo;
  });
}

function mesh_box(mesh) {
  var box = new THREE.Box3().setFromObject(mesh); 
  return box;
}

function mesh_height(mesh) {
  var box = mesh_box(mesh);
  return box.max.y - box.min.y;
}

function mesh_width(mesh) {
  var box = mesh_box(mesh);
  return box.max.x - box.min.x;
}

function mesh_length(mesh,axis) {
	if (axis == 'x') {
		return mesh_width(mesh);
	}
	return mesh_height(mesh);
}

function previous_rail_panel(rail, parts) {
  var rails_keys = Object.keys(parts.rails);
  var rail_index = rails_keys.indexOf(rail);
  var panel_keys = Object.keys(parts.panels).sort();
  var panel_key  = panel_keys[rail_index];
  return parts.panels[panel_key];
}

function next_rail_panel(rail, parts) {
  var rails_keys = Object.keys(parts.rails);
  var panel_keys = Object.keys(parts.panels).sort();
  var rail_index   = rails_keys.indexOf(rail);
  var panel_index  = rail_index+1
  var panel_key  = panel_keys[panel_index];
  return parts.panels[panel_key];
}

function previous_item_left_offset(current, previous) {
  var current_box  = mesh_box(current);
  var previous_box = mesh_box(previous);
  return current_box.min.x - previous_box.max.x;
}

function previous_item_right_offset(current, previous) {
  var current_box  = mesh_box(current);
  var previous_box = mesh_box(previous);
  return previous_box.min.x - current_box.max.x;
}

function previous_item_top_offset(current, previous) {
  var current_box  = mesh_box(current);
  var previous_box = mesh_box(previous);
  return previous_box.max.y - current_box.max.y;
}

function previous_horizontal_panel_item(panel_name, parts) {
  var panel = parts.panels[panel_name];
  if (panel_name == "a") {
    var left_stack_items = Object.keys(parts.frame['left']).sort();
    var last_frame_left = parts.frame['left'][left_stack_items[left_stack_items.length-1]]['mesh'];
    return last_frame_left;
  }else{
    var panel_names = Object.keys(parts.panels).sort();
    var current_panel_index = panel_names.indexOf(panel_name);
    var prev_panel_name = panel_names[current_panel_index-1];
    var prev_panel = parts.panels[prev_panel_name];
    var right_stack_items = Object.keys(prev_panel['right']).sort();
    var last_panel_right = prev_panel['right'][right_stack_items[right_stack_items.length-1]]['mesh'];
    return last_panel_right
  }
}

function previous_horizontal_vertical_panel_item(panel_name, parts) {
  var top_stack_items = Object.keys(parts.frame['top']).sort();
  var last_frame_top = parts.frame['top'][top_stack_items[top_stack_items.length-1]]['mesh'];
  return last_frame_top;
}

function previous_vertical_panel_item(panel_name, parts) {
  var panel = parts.panels[panel_name];
  if (panel_name == "a") {
    var top_stack_items = Object.keys(parts.frame['top']).sort();
    var last_frame_top = parts.frame['top'][top_stack_items[top_stack_items.length-1]]['mesh'];
    return last_frame_top;
  }else{
    var panel_names = Object.keys(parts.panels);
    var current_panel_index = panel_names.indexOf(panel_name);
    var prev_panel_name = panel_names[current_panel_index-1];
    var prev_panel = parts.panels[prev_panel_name];
    var bottom_stack_items = Object.keys(prev_panel['bottom']).sort();
    var last_panel_bottom = prev_panel['bottom'][bottom_stack_items[bottom_stack_items.length-1]]['mesh'];
    return last_panel_bottom
  }
}

function previous_vertical_panel_left_item(panel_name, parts) {
  var top_stack_items = Object.keys(parts.frame['left']).sort();
  var last_frame_top  = parts.frame['left'][top_stack_items[top_stack_items.length-1]]['mesh'];
  return last_frame_top;
}

function previous_vertical_panel_right_item(panel_name, parts) {
  var top_stack_items = Object.keys(parts.frame['right']).sort();
  var last_frame_top  = parts.frame['right'][top_stack_items[top_stack_items.length-1]]['mesh'];
  return last_frame_top;
}

function horizontal_panels_total_width_offset(parts) {
  var sum = 0
  var panel_names = Object.keys(parts.panels).sort();
  sum += panel_left_max(parts.panels[panel_names[0]]) - frame_left_min(parts.frame);
  if (panel_names.length > 1) {
    for (i=0; i<panel_names.length-1;i++) {
      var pone = parts.panels[panel_names[i]];
      var ptwo = parts.panels[panel_names[i+1]];
      sum += panel_left_max(ptwo) - panel_right_min(pone);
    }
  }
  sum += frame_right_max(parts.frame) - panel_right_min(parts.panels[panel_names[panel_names.length-1]]);
  return sum;
}

function horizontal_orientation_total_height_offset(parts) {
  var sum = 0;
  var panel_names = Object.keys(parts.panels).sort();
  sum += frame_top_max(parts.frame) - panel_top_min(parts.panels[panel_names[0]]);
  sum += panel_bottom_max(parts.panels[panel_names[0]]) - frame_bottom_min(parts.frame);
  return sum;
}

// sum of all horizontal part offsets
// Note:: This assumes a vertical assembly orientation with no vertical rails
function vertical_orientation_total_width_offset(parts) {
  var sum = 0;
  var panel_names = Object.keys(parts.panels).sort();
  sum += panel_left_max(parts.panels[panel_names[0]]) - frame_left_min(parts.frame);
  sum += frame_right_max(parts.frame) - panel_right_min(parts.panels[panel_names[0]]);
  return sum;
}

// sum of all horizontal part offsets
function vertical_orientation_total_height_offset(parts) {
  var sum = 0
  var panel_names = Object.keys(parts.panels).sort();
  sum += (frame_top_max(parts.frame) - panel_top_min(parts.panels[panel_names[0]]));
  if (panel_names.length > 1) {
    for (i=0; i<panel_names.length-1;i++) {
      var pone = parts.panels[panel_names[i]];
      var ptwo = parts.panels[panel_names[i+1]];
      sum += panel_bottom_max(pone) - panel_top_min(ptwo);
    }
  }
  sum += panel_bottom_max(parts.panels[panel_names[panel_names.length-1]]) - frame_bottom_min(parts.frame);
  return sum;
}

function vertical_panels_dlo_height_sum(parts) {
  var dlosum = 0;
  var panel_names = Object.keys(parts.panels).sort();
  panel_names.forEach(function(name) {
    var panel = parts.panels[name];
    dlosum += panel_dlo_height(panel);
  });
  return dlosum;
}

function vertical_panels_dlo_width_sum(parts) {
  var dlosum = 0;
  var panel_names = Object.keys(parts.panels).sort();
  panel_names.forEach(function(name) {
    var panel = parts.panels[name];
    dlosum += panel_dlo_width(panel);
  });
  return dlosum;
}

function horizontal_panels_dlo_width_sum(parts) {
  var dlosum = 0;
  var panel_names = Object.keys(parts.panels).sort();
  panel_names.forEach(function(name) {
    var panel = parts.panels[name];
    dlosum += panel_dlo_width(panel);
  });
  return dlosum;
}

function panel_width_offset(panel) {
  var width     = panel_width(panel);
  var dlo_width  = panel_dlo_width(panel);
  return width-dlo_width;
}

function panel_dlo_width(panel) {
  return panel_inner_width(panel);
}

function panel_height_offset(panel) {
  var height = panel_height(panel);
  var dlo_height = panel_dlo_height(panel);
  return height-dlo_height;
}

function panel_dlo_height(panel) {
  return panel_inner_height(panel);
}

function panel_inner_width(panel) {
  var pmax = panel_right_min(panel);
  var pmin = panel_left_max(panel);
  return pmax-pmin;
}

function panel_inner_height(panel) {
  var pmax = panel_top_min(panel);
  var pmin = panel_bottom_max(panel);
  return pmax-pmin;
}

function panel_height(panel) {
  var pmax = panel_top_max(panel);
  var pmin = panel_bottom_min(panel);
  return pmax-pmin;
}

function panel_width(panel) {
  var pmax = panel_right_max(panel);
  var pmin = panel_left_min(panel);
  return pmax-pmin;
}

function frame_top_max(frame) {
  var parts = Object.keys(frame['top']).sort();
  var box = mesh_box(frame['top'][parts[0]]['mesh'])
  return box.max.y;
}

function frame_bottom_min(frame) {
  var parts = Object.keys(frame['bottom']).sort();
  var box = mesh_box(frame['bottom'][parts[0]]['mesh'])
  return box.min.y;
}

function frame_left_min(frame) {
  var parts = Object.keys(frame['left']).sort();
  var box = mesh_box(frame['left'][parts[0]]['mesh'])
  return box.min.x;
}

function frame_right_max(frame) {
  var parts = Object.keys(frame['right']).sort();
  var box = mesh_box(frame['right'][parts[0]]['mesh'])
  return box.max.x;
}

function panel_bottom_max(panel) {
  var parts = Object.keys(panel['bottom']).sort();
  var box = mesh_box(panel['bottom'][parts[parts.length-1]]['mesh'])
  return box.max.y;
}

function panel_top_min(panel) {
  var parts = Object.keys(panel['top']).sort();
  var box = mesh_box(panel['top'][parts[parts.length-1]]['mesh'])
  return box.min.y;
}

function panel_top_max(panel) {
  var parts = Object.keys(panel['top']).sort();
  var box = mesh_box(panel['top'][parts[0]]['mesh'])
  return box.max.y;
}

function panel_bottom_min(panel) {
  var parts = Object.keys(panel['bottom']).sort();
  var box = mesh_box(panel['bottom'][parts[0]]['mesh'])
  return box.min.y;
}

function panel_right_max(panel) {
  var parts = Object.keys(panel['right']).sort();
  var box = mesh_box(panel['right'][parts[0]]['mesh'])
  return box.max.x;
}

function panel_right_min(panel) {
  var parts = Object.keys(panel['right']).sort();
  var box = mesh_box(panel['right'][parts[parts.length-1]]['mesh']);
  return box.min.x;
}

function panel_left_min(panel) {
  var parts = Object.keys(panel['left']).sort();
  var box = mesh_box(panel['left'][parts[0]]['mesh'])
  return box.min.x;
}

function panel_left_max(panel) {
  var parts = Object.keys(panel['left']).sort();
  var box = mesh_box(panel['left'][parts[parts.length-1]]['mesh']);
  return box.max.x;
}



function mesh_parts_from_name(mesh) {
  var mesh_parts = mesh.name.split("_").map(function(m) {
    return m.toLowerCase();	
  });
  return mesh_parts;
}

function parse_stretch_interval_float(point) {
	return parseFloat(point.split("d").join("."));
}

function parse_stretch_intervals(mesh_parts) {
  if (mesh_parts.length < stretch_interval_first_index(mesh_parts)+1) return null;
  var points = mesh_parts.slice(5).reduce(function(result, value, index, array) {
    if (index % 2 === 0) {
      result.push(array.slice(index, index + 2));
		}	
    return result;
  }, []);
	var intervals = points.map(function(pair) {
		return [
			parse_stretch_interval_float(pair[0]),
			parse_stretch_interval_float(pair[1])
		];
	});
  return intervals;
}

function stretch_interval_first_index(parts) {
	var name = parts[1];
	if (name == 'frame') {
		return 5;
	}else if (name == 'rail') {
		return 4;
	}else if (name == 'panel') {
		return 6;
	}
}

function meshes_as_parts(object, clone) {
  // ie: Layer_A_Top_1_Glazing_Bead_Fixed__1_ESEL110
  var parts = {frame:{}, panels:{}, rails:{}};
  object.children.forEach(function(mesh) {
    var mesh_parts        = mesh_parts_from_name(mesh);
    var stretch_intervals = parse_stretch_intervals(mesh_parts);
    var name = mesh_parts[1];
    if (name == "frame") {
      var position = mesh_parts[2];
      var stack_pos = mesh_parts[3];
      if (parts[name][position]) {
        parts[name][position][stack_pos] = {'mesh':(clone ? mesh.clone() : mesh)};
      }else{
        parts[name][position] = {};
        parts[name][position][stack_pos] = {'mesh':(clone ? mesh.clone() : mesh)};
      }
      if (stretch_intervals) {
        parts[name][position][stack_pos]['stretch_intervals'] = stretch_intervals;
      }else{
        parts[name][position][stack_pos]['stretch_intervals'] = [];
			}
    }else if (name == "rail") {
      var position = mesh_parts[2];
      parts['rails'][position] = {'mesh':(clone ? mesh.clone() : mesh)};
      if (stretch_intervals) {
        parts['rails'][position]['stretch_intervals'] = stretch_intervals;
      }else{
        parts['rails'][position]['stretch_intervals'] = [];
			}
    }else if (name == "panel") {
      var panel_name = mesh_parts[2];
      var position   = mesh_parts[3];
      var stack_pos  = mesh_parts[4];
      if (parts['panels'][panel_name]) {
        if (parts['panels'][panel_name][position]) {
          parts['panels'][panel_name][position][stack_pos] = {'mesh':(clone ? mesh.clone() : mesh)};
        }else{
          parts['panels'][panel_name][position] = {};
          parts['panels'][panel_name][position][stack_pos] = {'mesh':(clone ? mesh.clone() : mesh)};
        }
      }else{
        parts['panels'][panel_name] = {};
        parts['panels'][panel_name][position] = {};
        parts['panels'][panel_name][position][stack_pos] = {'mesh':(clone ? mesh.clone() : mesh)};
      }
      if (stretch_intervals) {
        parts['panels'][panel_name][position][stack_pos]['stretch_intervals'] = stretch_intervals;
      }else{
        parts['panels'][panel_name][position][stack_pos]['stretch_intervals'] = [];
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
  renderer  = new THREE.WebGLRenderer({antialias:true});
  camera    = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 2000 );
  renderer.setSize( window.innerWidth, window.innerHeight );
  container.appendChild( renderer.domElement );
  camera.position.z = 150;
  
  load_controls();

  light = new THREE.DirectionalLight( 0xffffff, 1 );
  light.position = camera.position;
  scene.add(light);

  var loader = new THREE.OBJLoader();
  loader.load(obj_file, function ( object ) {
    object.name = "esmodel";
    object.children.forEach(function(mesh) {
      console.log(mesh['name']);
      // if (mesh['name'] == 'Layer_Rail_1_ESEL108A') {
      //   mesh.visible = false;
      // }
      var geometry = new THREE.Geometry().fromBufferGeometry(mesh.geometry);
      mesh.geometry = geometry;
      mesh.geometry.dynamic = true;
      mesh.geometry.verticesNeedUpdate = true;
      mesh.callback = function(mesh) { 
        update_mesh_info(mesh);
        select_color(mesh);
        current_mesh = mesh;
      }
    }); 

    model            = object;
    og_model         = object.clone();
    original_height  = mesh_height(og_model);
    original_width   = mesh_width(og_model);
    og_parts         = meshes_as_parts(og_model,true);
    if (orientation == "vertical") {
      panel_dlo_ratios = og_vertical_dlo_ratios();
    }else{
      panel_dlo_ratios = og_horizontal_dlo_ratios();
    }
    scene.add(object);
    update_info();
  });

  
}

function events() {
  document.getElementById("container").addEventListener("mousedown", function(event) {
    canvas_click(event);
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

function center() {
  controls.target.set(0, 0, 0);
  camera.position.copy(controls.target).add(new THREE.Vector3(0, 0, 150));
}

function load_controls() {
  controls = new THREE.OrbitControls( camera );
  controls.rotateSpeed = 0.5;
  controls.zoomSpeed = 0.5;
  controls.panSpeed = 0.5;
  controls.enableZoom = true;
  controls.enableRotate = true;
  controls.enablePan = true;
  controls.enableDamping = false;
  //controls.minPolarAngle = Math.PI/2;
  //controls.maxPolarAngle = Math.PI/2;
  controls.dampingFactor = 10;
}

function animate() {
  requestAnimationFrame( animate );
  render();
}

function render() {
  controls.update();
  renderer.render( scene, camera );
  light.position.copy(camera.position);
}

function canvas_click( event ) {
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

  if (intersects.length == 0) {
    clear_all_colors();
    clear_mesh_info();
  }
}

function append_title() {
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
  title.innerHTML = name;
  document.body.appendChild(title);
}

function append_info() {
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

function append_mesh_info() {
  mesh_info.style.position = 'absolute';
  mesh_info.style.top = '90px';
  mesh_info.style.width = '100%';
  mesh_info.style.textAlign = 'center';
  mesh_info.style.color = '#fff';
  mesh_info.style.fontWeight = 'bold';
  mesh_info.style.fontSize = '18px';
  mesh_info.style.backgroundColor = 'transparent';
  mesh_info.style.zIndex = '1';
  mesh_info.style.fontFamily = 'Monospace';
  mesh_info.innerHTML = "";
  document.body.appendChild(mesh_info);
}

function update_info() {
  info.innerHTML = "Width: "+display_in_inches(mesh_width(model))+" Height: "+display_in_inches(mesh_height(model));
}

function update_mesh_info(mesh) {
  if (!mesh)
    return;
  var parts = mesh_parts_from_name(mesh);
  var type  = parts[1];
  var ref   = parts[parts.length-1];
  var name;
  var position;
  var stack_pos;
  var length;
  var width;
  console.log(mesh['name']);

/*  if (type == "frame") {
    position = parts[2];
    stack_pos = parts[3];
    name = parts.slice(4,parts.length-1).join(" ");
  }else if (type == "rail") {
    position = "top";
    name = parts.slice(3,parts.length-1).join(" ");
  }else if (type.length == 1) {
    position = parts[2];
    stack_pos = parts[3];
    name = parts.slice(4,parts.length-2).join(" ");
  }

  if (position == "top" || position == "bottom") {
    length = mesh_width(mesh);
    width  = mesh_height(mesh);
  }else{
    length = mesh_height(mesh);
    width  = mesh_width(mesh);
  }

  mesh_info.innerHTML = name.toUpperCase()+"<br/>ES Part #: "+ref.toUpperCase()+"<br/>Length: "+display_in_inches(length);
  mesh_info.innerHTML += " width: "+display_in_inches(width);*/
}

function clear_mesh_info() {
  mesh_info.innerHTML = "";
}

function clear_all_colors() {
  model.children.forEach(function(c) {
    c.material.color = new THREE.Color( 1, 1, 1);
  });
}

function select_color(mesh) {
  clear_all_colors(); 
  mesh.material.color = new THREE.Color( 'skyblue' );
}

function display_in_inches(num) {
  var remainder = num % 1;
  if (remainder == 0) {
    return num;
  }
  var fraction = new Fraction(remainder);
  return Math.floor(num) + " " + round_to_sixteenth(remainder) + "\"";
}

function round_to_sixteenth(fraction) {
  var round = (Math.round(fraction * 16) / 16.0);
  var fraction = new Fraction(round);
  return fraction.numerator + "/" + fraction.denominator;
}

