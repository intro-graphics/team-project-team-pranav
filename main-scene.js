//ignore this comment
//Jacob
function findNormal(point1,point2,point3)                                      //Find normal given three points
{
  let v1 = point1.minus(point2);
  let v2 = point1.minus(point3);
  return v1.cross(v2);
}
//This is to check when the ray intersects with the plane,you can find this formula online
//ray and plane intersection formula
function intersect(normals,init,ray,plane_point)                                
{
    let dot = (ray[0]*normals[0]+ray[1]*normals[1]+ray[2]*normals[2]);
    if (dot == 0)                                                                //if they're parallel just return something bad
      {
      	return -9999;
      }	
	let d = -(normals[0]*plane_point[0]+normals[1]*plane_point[1]+normals[2]*plane_point[2]);
	let t = -(d+init[0]*normals[0]+init[1]*normals[1]+init[2]*normals[2])/dot;
	return t;
}
function bounded ( intercept, bound_low, bound_high)
{
	if(intercept <bound_low || intercept >bound_high)                  //check that the point is between low and high
	{
	  return false
	}
	return true
}
//This assumes that the object was originally a cube, it transforms the corners of the cube. With that it can get 
//the four norms we need to calculate intersections of our raycasting
//this function returns a list of lists. Each list inside the bigger list is the face of one side and point on that face, needed
//for calculations of intersections
function getFaceNormals(pos)                                          
{
	    let back_bottom_left = (pos.times(Vec.of(-1,-1,-1,1)));
        let front_bottom_left = (pos.times(Vec.of(-1,-1,1,1)));
        let front_top_left = (pos.times(Vec.of(-1,1,1,1)));
        let back_top_left = (pos.times(Vec.of(-1,1,-1,1)));
        let back_bottom_right = (pos.times(Vec.of(1,-1,-1,1)));
        let front_bottom_right = (pos.times(Vec.of(1,-1,1,1)));
        let front_top_right = (pos.times(Vec.of(1,1,1,1)));
        let back_top_right = (pos.times(Vec.of(1,1,-1,1)));
        let left_face = findNormal(back_bottom_left,front_bottom_left,front_top_left);
        let right_face = findNormal(back_bottom_right,front_bottom_right,front_top_right);
        let front_face = findNormal(front_bottom_right,front_top_right,front_top_left);
        let back_face = findNormal(back_bottom_right,back_top_right,back_top_left);
        return [[left_face,back_bottom_left],[right_face,back_bottom_right],[back_face,back_bottom_right],[front_face,front_bottom_left]];
}

//Jacob:idea here is to basically do ray casting from the vampire to the sun and see if anything blocks the way
//this function checks if the given bounded information will block the sun from view in which case we know it's in shadow
function inShadLR(start,ray,norm_and_pt,y_bound_low,y_bound_high,z_bound_low,z_bound_high)
{
  y_bound_low +=.5;                                                      //the center of the character is .5 above ground, adjust here
  y_bound_high +=.5
  let scale_factor = intersect(norm_and_pt[0],start,ray,norm_and_pt[1])           //find what t is for the intersection
  if(scale_factor==-9999)                                                //is parallel
  {                                                                      //therefore can't be blocked by LR return false
    return false
  }
  let y_intercept = scale_factor*ray[1] + start[1];                      //scale then add initial position for intersection of ray and plane
  if(!bounded(y_intercept,y_bound_low,y_bound_high))                     //if not between specified bounds the plane doesn't cover you
    return false;
  let z_intercept = scale_factor*ray[2] + start[2];                      //^same as before
  if(!bounded(z_intercept,z_bound_low,z_bound_high))
    return false;
  return true;                                                           //since its bounded in both y and z that means this blocks the sun
}

//Jacob: same situation up top but for Front and Back planes
function inShadFB(start,ray,norm_and_pt,y_bound_low,y_bound_high,x_bound_low,x_bound_high)
{
  y_bound_low +=.5;                                                      //the center of the character is .5 above ground, adjust here
  y_bound_high +=.5
  let scale_factor = intersect(norm_and_pt[0],start,ray,norm_and_pt[1])  //find t to determine where it intersects
  if(scale_factor == -9999)                                              //in this case its parallel 
  {                                                                      //therefore it can't be blocked by front back walls return false
    return false
  }                           
  let y_intercept = scale_factor*ray[1] + start[1];                      //scale then add initial position for intersection of ray and plane
  if(!bounded(y_intercept,y_bound_low,y_bound_high))                     //if not between specified bounds the plane doesn't cover you
    return false;
  let x_intercept = scale_factor*ray[0] + start[0];                      //^same as before
  if(!bounded(x_intercept,x_bound_low,x_bound_high))
    return false;
  return true;                                                           //since its bounded in both y and z that means this blocks the sun
}

function inShadow(start,ray,bound)
{
	len = bound.length;
	var i =0;
        for(i=0;i<len;i++)
        {
        	if(inShadLR(start,ray,bound[i][0][0],bound[i][0][1],bound[i][0][2],bound[i][0][3],bound[i][0][4]) 
        	|| inShadLR(start,ray,bound[i][1][0],bound[i][1][1],bound[i][1][2],bound[i][1][3],bound[i][1][4])
        	|| inShadFB(start,ray,bound[i][2][0],bound[i][2][1],bound[i][2][2],bound[i][2][3],bound[i][2][4])
        	|| inShadFB(start,ray,bound[i][3][0],bound[i][3][1],bound[i][3][2],bound[i][3][3],bound[i][3][4]))
        	{
              return true;
        	}
        }
    return false;
}



window.Shadow_Demo = window.classes.Shadow_Demo =
class Shadow_Demo extends Scene_Component
  { constructor( context, control_box )     // The scene begins by requesting the camera, shapes, and materials it will need.
      { super(   context, control_box );    // First, include a secondary Scene that provides movement controls:
        if( !context.globals.has_controls   ) 
          context.register_scene_component( new Movement_Controls( context, control_box.parentElement.insertCell() ) ); 

        context.globals.graphics_state.camera_transform = Mat4.look_at( Vec.of( 0,10,30 ), Vec.of( 0,0,0 ), Vec.of( 0,1,0 ) );
        this.initial_camera_location = Mat4.inverse( context.globals.graphics_state.camera_transform );
        
        this.bgm = document.getElementById("bgm");
        this.bgm.play();
        this.bgm.loop = true;
        this.skillsfx = document.getElementById("skillsfx");
        this.footstepsfx = document.getElementById("footstepsfx");
        this.footstepsfx.volume = 0.4;
        this.lowhealthsfx = document.getElementById("lowhealthsfx");
		
        // Pranav's variables
        this.drawTheChar = true;    // whether to trigger the draw_char function
        this.boom = false;  // whether to trigger an explosion during the draw_char function
        this.initial_blow = 0;  // the time you died
        this.move_dist = 0.2;   // the movement distance of the character in each axis
        this.ud = 0;  // the up-down position of the character
        this.lr = 0; // the left-right position of the character
        this.maxHealth = 500;   // health shouldn't be able to rise higher than this, should be equal to charHealth at the start
        this.redC = 1; // if in shadow, reduce to 0.5 and make it look darker
        this.shad_bound_box = [];        //add info to this list so we can check for shadow detection
        
        this.car1ud = 0;
        this.car1lr = 0;
        this.car2ud = 0;
        this.car2lr = 0;
		
        this.extend_shadow = false; //Jacob - extend shadow skill is turned off
        this.counter = 0; //Jacob - counts to set how long extend_shadow lasts
        this.player_in_shadow = false;//Suvir- tells if in shadow or not
        this.charHealth = 500; //Suvir- health of the character
    
        
        this.collisionBuildW = false; //Suvir- detects collision for building
        this.collisionBuildA = false;
        this.collisionBuildS = false;
        this.collisionBuildD = false;

		// Chang Chun's UI variables, find elements in the HTML and create nodes to store values
		// grabs the health text
		this.healthElement = document.querySelector("#health");
		this.healthNode = document.createTextNode("");
		this.healthElement.appendChild(this.healthNode);
		this.healthNode.nodeValue = "♥♥♥♥♥♥♥♥♥♥";
		
		// grabs the mana text
		this.manaDivElement = document.querySelector("#manadiv");
		this.manaElement = document.querySelector("#mana");	

        const r = context.width/context.height;
        context.globals.graphics_state.projection_transform = Mat4.perspective( Math.PI/4, r, .1, 1000 );
		
        const shapes = { // Shapes from Assignment Three
                         sub1: new (Subdivision_Sphere.prototype.make_flat_shaded_version())(1),
                         sub2: new (Subdivision_Sphere.prototype.make_flat_shaded_version())(2),
                         sub3: new (Subdivision_Sphere)(3),

                         // Shapes used so far                     
                         sub4: new (Subdivision_Sphere)(4), 
                         body: new (Cube)(),
                         shadow_square: new Square()
                       }
        this.submit_shapes( context, shapes );
        this.materials =
          { 
            // the only material used so far
            suns: context.get_instance( Phong_Shader ).material( Color.of(1, 0, 0, 1), 
            { 
              ambient: .75, specularity: 1
            }),

            // materials from Assignment Three
            planets: context.get_instance( Phong_Shader ).material(Color.of(0, 0, 0, 1)),
            test: context.get_instance( Phong_Shader ).material( Color.of(0, 0, 1, 1), { ambient: 0.2 } ),
            shadow_mat: context.get_instance( Phong_Shader).material(Color.of(0,0,0,1),{ambient: 1}),
            shadow: context.get_instance(Shadow_Shader)
			.material(Color.of(0,0,0,1),
			{ambient: 1.0, diffusivity: 0.0, specularity: 0.0 })

          }
          this.materials["shadow"] = context.get_instance(Shadow_Shader)
			.material(Color.of(0,0,0,1),
			{ambient: 1.0, diffusivity: 0.0, specularity: 0.0 });
			
      }
	  
      make_control_panel()            // Pranav - Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
      { /* 05-22-20 - Pranav
            if the charHealth is less than 0, the character is dead, so don't move then
            also, this.move_dist is the constant of move_dist, if it's value is changed, the max steps in each direction must be changed too 
        */
        this.key_triggered_button("Up", ["w"], () => {  // going Up with 'i'
                if(this.ud >= (-146 * this.move_dist) && this.charHealth > 0&&!this.collisionBuildW)  // 146 steps max upwards (from starting position) (not 484 because >=)
                {
                 
                  
                  this.ud = this.ud - 0.2;
                  this.footstepsfx.play();
                }
			  
            });
        this.key_triggered_button("Down", ["s"], () => {  // going Down with 'k'
                if(this.ud <= (6 * this.move_dist) && this.charHealth > 0&&!this.collisionBuildS)  // 6 steps max downwards
                {
                    this.ud = this.ud + 0.2;
                    this.footstepsfx.play();
                }
            });
        this.key_triggered_button("Left", ["a"], () => {  // going Left with 'j'
                if(this.lr >= (-17 * this.move_dist) && this.charHealth > 0&&!this.collisionBuildA)  //  17 steps max left
               {   this.lr = this.lr - 0.2;
                  this.footstepsfx.play();
               }
            });
        this.key_triggered_button("Right", ["d"], () => { // going right with 'l'
                if(this.lr <= (13 * this.move_dist) && this.charHealth > 0&&!this.collisionBuildD) //  13 steps max right
                {  this.lr = this.lr + 0.2;
                   this.footstepsfx.play();
                }
            });
        this.key_triggered_button("Extend_Shadow", ["q"], () => { // going right with 'l'
                this.extend_shadow = true;
            });
      }
    // Pranav's code for the world
    draw_map(graphics_state)
    {
        let pos = Mat4.identity();
        this.shad_bound_box = [];  //reset the shadow boundary box every iteration
        //Jacob - the second draw of all the buildings and players are the shadow maps
        // the road
        pos = pos.times(Mat4.translation([-3.5,-9.05,40]))
          .times(Mat4.scale([3.5,5,100]))
          .times(Mat4.rotation(Math.PI / 2, Vec.of(0, 1, 0))).times(Mat4.translation([1, 1, 1]));
        this.shapes.body.draw(graphics_state, pos, this.materials.suns.override( {color: Color.of(0.5, 0.5, 0.5, 1)},{ambient:0,specular:1,gouraud:false} ));

        // the grass to the right
        pos = pos.times(Mat4.scale([1,1,8])).times(Mat4.translation([0, -0.01, 1.125]))
        this.shapes.body.draw(graphics_state, pos, this.materials.suns.override( {color: Color.of(0.5, 1, 0.5, 1)},{ambient:0,specular:1,gouraud:false} ));

        // the grass to the left
        pos = pos.times(Mat4.translation([0, 0, -2]))
        this.shapes.body.draw(graphics_state, pos, this.materials.suns.override( {color: Color.of(0.5, 1, 0.5, 1)}, {ambient:0,specular:1,gouraud:false}));

        // the cave
        pos = Mat4.identity().times(Mat4.scale([3.5,3.2,3])).times(Mat4.translation([0,0,-6]));
        this.shapes.sub4.draw(graphics_state, pos, this.materials.suns.override( {color: Color.of(0.5, 0.25, 0, 1)},{ambient:0,specular:1,gouraud:false} ));
        this.shapes.sub4.draw(graphics_state,pos,this.materials.shadow)
        
        //the cave entrance
        pos = Mat4.identity().times(Mat4.scale([2.5,3,3])).times(Mat4.translation([0,0,-5.6]));
        this.shapes.sub4.draw(graphics_state, pos, this.materials.suns.override( {color: Color.of(0, 0, 0, 1)},{ambient:0,specular:1,gouraud:false} ));
        this.shapes.sub4.draw(graphics_state,pos,this.materials.shadow)
      
        // the green building ALL BUILDINGS WILL FOLLOW THIS PROCESS
        // use transformations, draw building, draw shadow, then get the norms of the four sides not top and bottom
        //then push into shad_bound_box the boundary information we need so we can decide whether player is in this 
        //buildings shadow later
        pos = Mat4.identity().times(Mat4.translation([0,1,0])).times(Mat4.scale([1,2,2])).times(Mat4.translation([1,1,1]));
        this.shapes.body.draw(graphics_state, pos, this.materials.suns.override( {color: Color.of(0.25, 0.9, 0, 1)},{ambient:0,specular:1,gouraud:false} ));
        this.shapes.body.draw(graphics_state,pos,this.materials.shadow);

        let faceNorms = getFaceNormals(pos);                              //Get the LR and FB normals as well as one point on it
        //Pass in the normals and points, as long as the boundaries of the buildings
        //Manually input list of bounding cases 0,1,5,0,4 and 2,1,5,0,4 is for Left Right
        //0 means the plane x = 0 ,1 is the lowerest y of the building
        //5 is the highest y of building
        //0 is the furthest z, 4 is the closest
        //categorized like this first the first two pairs
        //([normal of left or right face, point inside it], y_bound_low, y_bound_high, z_bound_low, z_bound_high)
        //For the second pair of 5's faceNorms[2],1,5,0,2 and faceNorms[3],1,5,0,2
        //This is for the front and back plane 
        //Format: ([normal of front or back face, point inside it], y_bound_low, y_bound_high, x_bound_low, x_bound_high)
        this.shad_bound_box.push([[faceNorms[0],1,5,0,4],[faceNorms[1],1,5,0,4],[faceNorms[2],1,5,0,2],[faceNorms[3],1,5,0,2]]);

      


        //  the yellow building
        pos = Mat4.identity().times(Mat4.translation([-8,1,4])).times(Mat4.scale([1,2,2])).times(Mat4.translation([1,1,1]));
        this.shapes.body.draw(graphics_state, pos, this.materials.suns.override( {color: Color.of(1, 1, 0.5, 1)},{ambient:0,specular:1,gouraud:false} ));
        this.shapes.body.draw(graphics_state,pos,this.materials.shadow);
        faceNorms = getFaceNormals(pos);
        this.shad_bound_box.push([[faceNorms[0],1,5,4,8],[faceNorms[1],1,5,4,8],[faceNorms[2],1,5,-8,-6],[faceNorms[3],1,5,-8,-6]]);

        // the gray building
        pos = Mat4.identity().times(Mat4.translation([8,1,2])).times(Mat4.scale([1,2,2])).times(Mat4.translation([1,1,1]));
        this.shapes.body.draw(graphics_state, pos, this.materials.suns.override( {color: Color.of(0.5, 0.5, 0.5, 1)},{ambient:0,specular:1,gouraud:false} ));
        this.shapes.body.draw(graphics_state,pos,this.materials.shadow);
        faceNorms = getFaceNormals(pos);
        this.shad_bound_box.push([[faceNorms[0],1,5,2,6],[faceNorms[1],1,5,2,6],[faceNorms[2],1,5,8,10],[faceNorms[3],1,5,8,10]])


        // the skybox (can be seen if you tilt the camera)
        pos = Mat4.identity().times(Mat4.scale([100,100,100]))
        this.shapes.body.draw(graphics_state, pos, this.materials.suns.override( {color: Color.of(0.25, 0.9, 1, 1)} ));
        
        //Jacob - This is the sun 
        const t = graphics_state.animation_time / 1000;
        let period = t*(2*Math.PI)/10;                               //calculate period for when to change color and when to change radius
        let x_period = Math.sin(period)/2;                            //figure out the period to create a circular path
        let y_period = (2+Math.sin(period*2))/2.5;
        pos = Mat4.identity().times(Mat4.translation([50*x_period,10*y_period+20,15]));
        this.shapes.sub4.draw(graphics_state, pos, this.materials.suns);

        let car_period = 5.5 * Math.sin( Math.PI * ( (t/1.5) % 2) /2 );

        // car 1
        //x length is 2
        //z length is 1
       
        let x_start_pos = 2-car_period;
        
        if(this.ud<=-1&&this.ud>=-2.6)
        {
          console.log("x_startpos: "+x_start_pos);
          if(x_start_pos-0.6<=this.lr&&x_start_pos+1.6>= this.lr)
          {
            this.charHealth=0;
          }
          
        }
        
        pos = Mat4.identity().times(Mat4.translation([x_start_pos,1,12])).times(Mat4.scale([0.7,0.4,0.5])).times(Mat4.translation([1,1,1]));
        this.shapes.body.draw(graphics_state, pos, this.materials.suns.override( {color: Color.of(0.25, 0.9, 0, 1)},{ambient:0,specular:1,gouraud:false} ));
        this.shapes.body.draw(graphics_state,pos,this.materials.shadow);
        faceNorms = getFaceNormals(pos);
        this.shad_bound_box.push([[faceNorms[0],1,1.8,12,13],[faceNorms[1],1,1.8,12,13],
                                  [faceNorms[2],1,1.8,x_start_pos,x_start_pos+2*0.7],[faceNorms[3],1,1.8,x_start_pos,x_start_pos+2*0.7]]);


        // car 2
        
       
        
        x_start_pos = -3.5 + car_period
        if(this.ud<=-19&&this.ud>=-20.6)
        {
          console.log("x_startpos: "+x_start_pos);
          if(x_start_pos-0.6<=this.lr&&x_start_pos+1.6>= this.lr)
          {
            this.charHealth=0;
          }
          
        }
        pos = Mat4.identity().times(Mat4.translation([x_start_pos,1,-6])).times(Mat4.scale([0.7,0.4,0.5])).times(Mat4.translation([1,1,1]));
        this.shapes.body.draw(graphics_state, pos, this.materials.suns.override( {color: Color.of(0.25, 0.9, 0, 1)},{ambient:0,specular:1,gouraud:false} ));
        this.shapes.body.draw(graphics_state,pos,this.materials.shadow);
        faceNorms = getFaceNormals(pos);
        this.shad_bound_box.push([[faceNorms[0],1,1.8,-6,-5],[faceNorms[1],1,1.8,-6,-5],
                                  [faceNorms[2],1,1.8,x_start_pos,x_start_pos+2*0.7],[faceNorms[3],1,1.8,x_start_pos,x_start_pos+2*0.7]]);
    }
    
    draw_char(graphics_state, time) //Jacob - draw char and their skills
    {	
      /* 05-22-20 - Pranav
            this.boom becoming true begins the blow_up sequence, which leads to death. We want to see the character disappear in the explosion,
            so if the value returned is less than 100, keep drawing them. Since they can't move once their health is less than 0, we don't have to
            worry that the character will move back into shadows to replenish health.
      */

      //building 1
     if(this.lr>=-0.4&&this.lr<=1.8&&this.ud-0.2<=-10&&this.ud>=-14.6)
      {
        this.collisionBuildW = true;
      }
      else
      {
        this.collisionBuildW=false;
      }
      if(this.lr>=-0.4&&this.lr<=1.8&&this.ud<=-10&&this.ud+0.2>=-14.6)
      {
        this.collisionBuildS = true;
      }
      else
      {
        this.collisionBuildS=false;
      }
      if(this.lr>=-0.4&&this.lr-0.2<=1.8&&this.ud<=-10&&this.ud>=-14.6)
      {
        this.collisionBuildA = true;
      }
      else
      {
        this.collisionBuildA=false;
      }
      if(this.lr+0.2>=-0.6&&this.lr<=1.8&&this.ud<=-10&&this.ud>=-14.6)
      {
        this.collisionBuildD = true;
      }
      else
      {
        this.collisionBuildD=false;
      }
      
      if(this.boom)
      {
          if(this.blow_up(graphics_state, time) > 100)
            return;
      }
      if(this.ud<=-29&&this.lr>=-1.8&&this.lr<=1.2)
      {
        console.log("in cave");
      }
      let shadowPos = Mat4.identity();
          shadowPos = shadowPos.times(Mat4.translation([2.5,5.01,10]));
          shadowPos = shadowPos.times(Mat4.scale([1,1,2]));
          shadowPos = shadowPos.times(Mat4.translation([1,0,1]));
          shadowPos = shadowPos.times(Mat4.rotation(Math.PI*1.5,Vec.of(1,0,0)));
          //console.log("shadowPos: "+ shadowPos);
          //pos[0][3] argument is left right
          //2.5<x<4.2
       //pos[2][3] argument is up down
          //10.5<y<13.7
        if(this.counter > 0)
            this.counter++;
        let pos = Mat4.identity();
        // Pranav's character, translate to origin, scale then move to wherever you want
        pos = Mat4.identity().times(Mat4.translation([0,1,14]))
            .times(Mat4.translation([this.lr,0,this.ud]))
            .times(Mat4.scale([0.3,0.5,0.3]))
            .times(Mat4.translation([1,1,1]));
        console.log("this.ud: "+ this.ud);
        console.log("this.lr: "+ this.lr);

        if(this.charHealth <= 0 && !this.boom)  // if the charHealth is lower than 0, turn on this.boom so that the explosion will start
                                                // this has to only happen when boom is false, otherwise, initial_blow will keep being reset, glitching the explosion 
        {
            this.boom = true;
			
			var deathSound = document.getElementById("deathsfx"); // ouch
			deathSound.play();
			
			setTimeout(this.show_death_text, 1000);
            this.initial_blow = time;
            return;
        }
        //Draw the person
        let origin_pos = (pos.times(Vec.of(0,0,0,1))); //This is the center position of the person
        let ray = this.lights[0].position.minus(origin_pos);  //This is the vector from the position of the person to sun
        let g = this.lights;
        var inShad = inShadow(origin_pos,ray,this.shad_bound_box);
        if(inShad)                                    //if not blocked by any of the four planes in shadow
        {
          this.shapes.body.draw
            (graphics_state, pos, this.materials.suns.override( {color: Color.of(.5, 0, 0, 1)},{ambient:0,specular:1,gouraud:false} ));
          if(this.maxHealth > this.charHealth)    // don't go above max health
                this.charHealth += 1;
        }
        else                                                        //else not in shadow
        {
          this.shapes.body.draw
            (graphics_state, pos, this.materials.suns.override( {color: Color.of(1, 0, 0, 1)},{ambient:0,specular:1,gouraud:false} ));
          if(this.charHealth > 0)    // don't go above max health
                this.charHealth -= 1;
        }
        this.shapes.body.draw(graphics_state,pos,this.materials.shadow); //Draw its shadow

        //Jacob - If skill extend_shadow is on, draw the shadow in front of the character, order of transformations is to move to origin, scale, rotate
        //then move to where the character is
        if(this.extend_shadow || (this.counter < 120 && this.counter > 0))
        {
            if(this.extend_shadow) //Jacob - if extend_shadow is pressed set counter to 1
			{
                this.counter = 1;
				this.manaDivElement.style.opacity = "1.0";
				this.skillsfx.play();
			}
            //Jacob - transformation for the extend_shadow skill
            pos = Mat4.identity();
            pos = pos.times(Mat4.translation([0,5.01,12])).times(Mat4.translation([this.lr,0,this.ud]))
            pos = pos.times(Mat4.rotation(Math.PI/2,Vec.of(1,0,0)));
            pos = pos.times(Mat4.scale([.3,1,1]));
            pos = pos.times(Mat4.translation([1,1,0]));
            this.shapes.shadow_square.draw(graphics_state, pos, this.materials.shadow_mat);
        }
        else
		{
            this.counter = 0;               //Jacob - if counter goes over 120 or is 0, reset back to 0
			this.manaDivElement.style.opacity = "0";
		}
        this.extend_shadow = false;         //set extend_shadow back to false
    }

    blow_up(graphics_state, time)   // 05-22-20 Pranav - Added this to create an explosion, if you need something changed, let me know, don't change urself
                                    // this function is triggered through draw_char if boom has been made true
    {
        let boom_pos = Mat4.identity();
        // Pranav's character, translate to origin, scale then move to wherever you want
        boom_pos = Mat4.identity().times(Mat4.translation([0.4,1,14]))
            .times(Mat4.translation([this.lr,0,this.ud]));
        
        // console.log("This is", time);
        // console.log("That is", this.initial_blow);
        let scaleT = ((time - this.initial_blow)*100) % 200;
        let col = Math.sin(Math.PI * 0.005 * scaleT);
        let big = 2 * col;

        boom_pos = boom_pos.times(Mat4.scale([big, big, big]));
        this.shapes.sub4.draw(graphics_state, boom_pos, this.materials.suns.override( {color: Color.of(1, (0.5*col) , 0, 1), diffusivity:0, specularity:0} ));
        
        if( (time - this.initial_blow)*100 >= 200 )
        {
            this.drawTheChar = false;   // after the explosion is done, don't draw the character again
            return 200;
        }

        return scaleT;
    }
	
	// Chang Chun's code for showing death screen and playing death sound
	show_death_text()
	{
		// get You Died text and show it
		var deathText = document.querySelector("#deathoverlay");
		deathText.style.top = "200px";
		deathText.style.fontSize = "144px";
		deathText.style.opacity = "0.8";
		
		this.bgm.pause(); // (jazz music stops)
		
		var youdiedSound = document.getElementById("youdied"); // this game is the Dark Souls of graphics projects
		youdiedSound.play();
	}
	
	// Chang Chun's code for updating the UI
	update_UI()
	{
		// update health
		var numBars = Math.ceil(this.charHealth/50);
		if ( numBars < 0 )
      numBars = 0;
    if ( numBars < 5 && numBars > 0 )
			this.lowhealthsfx.play();
		var BarsText = "";
		for ( var i = 0; i < numBars; i++ )
			BarsText += "♥";
		this.healthNode.nodeValue = BarsText;
		this.healthElement.style.animationDuration = (numBars/10).toFixed(1) + "s";

		// update mana
		var numBarsMana = 5 - Math.ceil(this.counter/24);
		if ( numBarsMana < 0 )
			numBarsMana = 0;
		this.manaElement.style.opacity = (numBarsMana/5).toFixed(1);
		
	}

    display( graphics_state )
      {   
        const t = graphics_state.animation_time / 1000, dt = graphics_state.animation_delta_time / 1000;     
        let period = t*(2*Math.PI)/10;                               //calculate period for when to change color and when to change radius
        let x_period = Math.sin(period)/2;                            //figure out the period to create a circular path
        let y_period = (2+Math.sin(period*2))/2.5;
        this.lights = [new Light(Vec.of(50*x_period,10*y_period+10,15,1),Color.of(0,1,1,1),100)]; //Jacob- Set light where sun is
        graphics_state.lights = this.lights;        // Use the lights stored in this.lights.
        // our position matrix

        // console.log(this.ud)
        // console.log(this.lr)
        console.log(this.charHealth);

        this.draw_map(graphics_state);
       
       if(this.drawTheChar) // 05-22-20 Pranav - If you're dead, don't try and draw stuff
            this.draw_char(graphics_state, t);
        
		this.update_UI()
      }
  }
