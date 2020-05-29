window.Shadow_Demo = window.classes.Shadow_Demo =
class Shadow_Demo extends Scene_Component
  { constructor( context, control_box )     // The scene begins by requesting the camera, shapes, and materials it will need.
      { super(   context, control_box );    // First, include a secondary Scene that provides movement controls:
        if( !context.globals.has_controls   ) 
          context.register_scene_component( new Movement_Controls( context, control_box.parentElement.insertCell() ) ); 

        context.globals.graphics_state.camera_transform = Mat4.look_at( Vec.of( 0,10,20 ), Vec.of( 0,0,0 ), Vec.of( 0,1,0 ) );
        this.initial_camera_location = Mat4.inverse( context.globals.graphics_state.camera_transform );
        
        // Pranav's variables
        this.drawTheChar = true;    // whether to trigger the draw_char function
        this.boom = false;  // whether to trigger an explosion during the draw_char function
        this.initial_blow = 0;  // the time you died
        this.move_dist = 0.2;   // the movement distance of the character in each axis
        this.ud = 0;  // the up-down position of the character
        this.lr = 0; // the left-right position of the character
        this.maxHealth = 500;   // health shouldn't be able to rise higher than this, should be equal to charHealth at the start
        this.redC = 1; // if in shadow, reduce to 0.5 and make it look darker

        this.extend_shadow = false; //Jacob - extend shadow skill is turned off
        this.counter = 0; //Jacob - counts to set how long extend_shadow lasts
        this.player_in_shadow = false;//Suvir- tells if in shadow or not
        this.charHealth = 500; //Suvir- health of the character

		// Chang Chun's UI variables, find elements in the HTML and create nodes to store values
		// grabs the health text
		this.healthElement = document.querySelector("#health");
		this.healthNode = document.createTextNode("");
		this.healthElement.appendChild(this.healthNode);
		this.healthNode.nodeValue = "♥♥♥♥♥";
		
		// variables to govern the glow of the hearts
		this.healthGlowFrames = (this.charHealth/100).toFixed(0);
		this.healthGlow = 10;
		this.healthBrighten = false;

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
            shadow_mat: context.get_instance( Phong_Shader).material(Color.of(0,0,0,1),{ambient: 1})

          }
        this.lights = [new Light(Vec.of(20,10,15,1),Color.of(0,1,1,1),1000)];  // Jacob - set light at where the Sun is
      }
    make_control_panel()            // Pranav - Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
      { /* 05-22-20 - Pranav
            if the charHealth is less than 0, the character is dead, so don't move then
            also, this.move_dist is the constant of move_dist, if it's value is changed, the max steps in each direction must be changed too 
        */
        this.key_triggered_button("Up", ["w"], () => {  // going Up with 'i'
                if(this.ud >= (-146 * this.move_dist) && this.charHealth > 0)  // 146 steps max upwards (from starting position) (not 484 because >=)
                  this.ud = this.ud - 0.2;
            });
        this.key_triggered_button("Down", ["s"], () => {  // going Down with 'k'
                if(this.ud <= (6 * this.move_dist) && this.charHealth > 0)  // 6 steps max downwards
                  this.ud = this.ud + 0.2;
            });
        this.key_triggered_button("Left", ["a"], () => {  // going Left with 'j'
                if(this.lr >= (-17 * this.move_dist) && this.charHealth > 0)  //  17 steps max left
                  this.lr = this.lr - 0.2;
            });
        this.key_triggered_button("Right", ["d"], () => { // going right with 'l'
                if(this.lr <= (13 * this.move_dist) && this.charHealth > 0) //  13 steps max right
                  this.lr = this.lr + 0.2;
            });
        this.key_triggered_button("Extend_Shadow", ["q"], () => { // going right with 'l'
                this.extend_shadow = true;
            });
      }
    draw_shad_map(graphics_state)
    {
            //Jacob - TRANSFORMATIONS FOR THE PREBAKED SHADOWS OF THE CLOSEST RIGHT BUILDING
         let pos = Mat4.identity();
         pos = pos.times(Mat4.translation([2.5,5.01,10]));
         pos = pos.times(Mat4.scale([1,1,2]));
         pos = pos.times(Mat4.translation([1,0,1]));
         pos = pos.times(Mat4.rotation(Math.PI*1.5,Vec.of(1,0,0)));
         this.shapes.shadow_square.draw(graphics_state, pos, this.materials.shadow_mat);

           //Jacob - TRANSFORMATIONS FOR THE PREBAKED SHADOWS OF THE CLOSEST LEFT BUILDING
         let shadow_pos = Mat4.identity();
         shadow_pos = shadow_pos.times(Mat4.translation([0,0,-15]));
         shadow_pos = shadow_pos.times(Mat4.translation([2.5,5.01,10]));
         shadow_pos = shadow_pos.times(Mat4.scale([1,1,2]));
         shadow_pos = shadow_pos.times(Mat.of( [ 1,0,0,0 ], [ 0,1,0,0 ], [ .75,0,1,0 ], [ 0,0,0,1 ] ));
         shadow_pos = shadow_pos.times(Mat4.translation([1,0,1]));
         shadow_pos = shadow_pos.times(Mat4.rotation(Math.PI*1.5,Vec.of(1,0,0)));
         this.shapes.shadow_square.draw(graphics_state, shadow_pos, this.materials.shadow_mat);
    }
    // Pranav's code for the world
    draw_map(graphics_state)
    {
         let pos = Mat4.identity();

        // the road
        pos = pos.times(Mat4.scale([3.5,5,100])).times(Mat4.rotation(Math.PI / 2, Vec.of(0, 1, 0))).times(Mat4.translation([0, 0, 0]));
        this.shapes.body.draw(graphics_state, pos, this.materials.suns.override( {color: Color.of(0.5, 0.5, 0.5, 1)},{ambient:0,specular:1,gouraud:false} ));

        // the grass to the right
        pos = pos.times(Mat4.scale([1,1,8])).times(Mat4.translation([0, 0, 1.125]))
        this.shapes.body.draw(graphics_state, pos, this.materials.suns.override( {color: Color.of(0.5, 1, 0.5, 1)},{ambient:0,specular:1,gouraud:false} ));

        // the grass to the left
        pos = pos.times(Mat4.translation([0, 0, -2.25]))
        this.shapes.body.draw(graphics_state, pos, this.materials.suns.override( {color: Color.of(0.5, 1, 0.5, 1)}, {ambient:0,specular:1,gouraud:false}));

        // the cave
        pos = Mat4.identity().times(Mat4.scale([3.5,3.2,3])).times(Mat4.translation([0,1.5,-6]));
        this.shapes.sub4.draw(graphics_state, pos, this.materials.suns.override( {color: Color.of(0.5, 0.25, 0, 1)},{ambient:0,specular:1,gouraud:false} ));
        
        //the cave entrance
        pos = Mat4.identity().times(Mat4.scale([2.5,3,3])).times(Mat4.translation([0,1.3,-5.6]));
        this.shapes.sub4.draw(graphics_state, pos, this.materials.suns.override( {color: Color.of(0, 0, 0, 1)},{ambient:0,specular:1,gouraud:false} ));

        // the blue building
        pos = Mat4.identity().times(Mat4.translation([6,5,0])).times(Mat4.scale([1.5,2,2]));
        this.shapes.body.draw(graphics_state, pos, this.materials.suns.override( {color: Color.of(0.25, 0.9, 1, 1)},{ambient:0,specular:1,gouraud:false} ));

        //  the yellow building
        pos = pos.times(Mat4.translation([-8,0,4]))
        this.shapes.body.draw(graphics_state, pos, this.materials.suns.override( {color: Color.of(1, 1, 0.5, 1)},{ambient:0,specular:1,gouraud:false} ));

        // the gray building
        pos = pos.times(Mat4.translation([8,0,2]))
        this.shapes.body.draw(graphics_state, pos, this.materials.suns.override( {color: Color.of(0.5, 0.5, 0.5, 1)},{ambient:0,specular:1,gouraud:false} ));

        // the skybox (can be seen if you tilt the camera)
        pos = Mat4.identity().times(Mat4.scale([100,100,100]))
        this.shapes.body.draw(graphics_state, pos, this.materials.suns.override( {color: Color.of(0.25, 0.9, 1, 1)} ));
        
        //Jacob - This is the sun 
        pos = Mat4.identity().times(Mat4.translation([20,10,15]));
        this.shapes.sub4.draw(graphics_state, pos, this.materials.suns);
    }
    draw_char(graphics_state, time) //Jacob - draw char and their skills
    {
      /* 05-22-20 - Pranav
            this.boom becoming true begins the blow_up sequence, which leads to death. We want to see the character disappear in the explosion,
            so if the value returned is less than 100, keep drawing them. Since they can't move once their health is less than 0, we don't have to
            worry that the character will move back into shadows to replenish health.
      */
      if(this.boom)
      {
          if(this.blow_up(graphics_state, time) > 100)
            return;
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
        pos = Mat4.identity().times(Mat4.translation([0,5,14]))
            .times(Mat4.translation([this.lr,0,this.ud]))
            .times(Mat4.scale([0.3,0.5,0.3]))
            .times(Mat4.translation([1,1,1]));
        console.log("x axis: "+ (pos[0][3]));
        console.log("y axis: "+ pos[2][3]);

        if(pos[0][3]>2.9&&pos[0][3]<4.1&&pos[2][3]<pos[0][3]-3.6&&pos[2][3]>pos[0][3]-5.8)
        {
            console.log("in shadow 2");
            if(this.maxHealth > this.charHealth)    // don't go above max health
                this.charHealth+=1
            this.redC = 0.5;    // in shadow, then darken color
        }
        else if(!(pos[0][3]<2.5||pos[0][3]>4.2||pos[2][3]<10.5||pos[2][3]>13.7))
        {
            console.log("in shadow 1")
            if(this.maxHealth > this.charHealth)    // don't go above max health
                this.charHealth+=1
            this.redC = 0.5;    // in shadow, then darken color
        }
        else
        {
          console.log("in no shadow");
          this.redC = 1;    // not in shadow, same color
          this.charHealth -= 1;
        }

        if(this.charHealth <= 0 && !this.boom)  // if the charHealth is lower than 0, turn on this.boom so that the explosion will start
                                                // this has to only happen when boom is false, otherwise, initial_blow will keep being reset, glitching the explosion 
        {
            this.boom = true;
            this.initial_blow = time;
            return;
        }

        this.shapes.body.draw(graphics_state, pos, this.materials.suns.override( {color: Color.of(this.redC, 0, 0, 1)},{ambient:0,specular:1,gouraud:false} ));
        //console.log("charHealth: "+this.charHealth);
        //Jacob - If skill extend_shadow is on, draw the shadow in front of the character, order of transformations is to move to origin, scale, rotate
        //then move to where the character is
        if(this.extend_shadow || (this.counter < 120 && this.counter > 0))
        {
            if(this.extend_shadow) //Jacob - if extend_shadow is pressed set counter to 1
                this.counter = 1;
            //Jacob - transformation for the extend_shadow skill
            pos = Mat4.identity();
            pos = pos.times(Mat4.translation([0,5.01,12])).times(Mat4.translation([this.lr,0,this.ud]))
            pos = pos.times(Mat4.rotation(Math.PI/2,Vec.of(1,0,0)));
            pos = pos.times(Mat4.scale([.3,1,1]));
            pos = pos.times(Mat4.translation([1,1,0]));
            this.shapes.shadow_square.draw(graphics_state, pos, this.materials.shadow_mat);
        }
        else
            this.counter = 0;               //Jacob - if counter goes over 120 or is 0, reset back to 0
        this.extend_shadow = false;         //set extend_shadow back to false
    }

    blow_up(graphics_state, time)   // 05-22-20 Pranav - Added this to create an explosion, if you need something changed, let me know, don't change urself
                                    // this function is triggered through draw_char if boom has been made true
    {
        let boom_pos = Mat4.identity();
        // Pranav's character, translate to origin, scale then move to wherever you want
        boom_pos = Mat4.identity().times(Mat4.translation([0.4,5,14]))
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
	
		// Chang Chun's code for updating the UI
	update_UI()
		{
			var numBars = (this.charHealth/100).toFixed(0);
			if ( numBars < 0 )
				numBars = 0;
			var BarsText = "";
			var LostBarsText = "";
			for ( var i = 0; i < numBars; i++ )
				BarsText += "♥";
			this.healthNode.nodeValue = BarsText;
			
			this.healthGlowFrames--;
			
			if (this.healthGlowFrames == 0)
			{
				if (this.healthGlow == 10)
					this.healthBrighten = false;
				else if (this.healthGlow == 0)
					this.healthBrighten = true;
				if ( this.healthBrighten )
					this.healthGlow++;
				else 
					this.healthGlow--;
				this.healthElement.style.textShadow = "0px 0px " + this.healthGlow + "px red" + ",0px 0px " + this.healthGlow + "px red" + ",0px 0px " + this.healthGlow + "px red";
			
				this.healthGlowFrames = numBars;
			}
			
		}

    display( graphics_state )
      {        
        graphics_state.lights = this.lights;        // Use the lights stored in this.lights.
        const t = graphics_state.animation_time / 1000, dt = graphics_state.animation_delta_time / 1000;
        // our position matrix

        // console.log(this.ud)
        // console.log(this.lr)
        console.log(this.charHealth);

        this.draw_map(graphics_state);
       
       if(this.drawTheChar) // 05-22-20 Pranav - If you're dead, don't try and draw stuff
            this.draw_char(graphics_state, t);
        // you guys can start from here
        
        //Jacob - draw the shadow maps
        this.draw_shad_map(graphics_state);
		this.update_UI()
      }
  }
