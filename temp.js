window.Shadow_Demo = window.classes.Shadow_Demo =
class Shadow_Demo extends Scene_Component
  { constructor( context, control_box )     // The scene begins by requesting the camera, shapes, and materials it will need.
      { super(   context, control_box );    // First, include a secondary Scene that provides movement controls:
        if( !context.globals.has_controls   ) 
          context.register_scene_component( new Movement_Controls( context, control_box.parentElement.insertCell() ) ); 

        context.globals.graphics_state.camera_transform = Mat4.look_at( Vec.of( 0,10,20 ), Vec.of( 0,0,0 ), Vec.of( 0,1,0 ) );
        this.initial_camera_location = Mat4.inverse( context.globals.graphics_state.camera_transform );

        this.ud = 0;  // the up-down position of the character
        this.lr = 0; // the left-right position of the character

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
            triangle: context.get_instance( Phong_Shader).material(Color.of(0,0,0,1),{ambient: 1})

          }

        //this.lights = [ new Light( Vec.of( 5,10,5,1 ), Color.of( 0, 0, 1, 1 ), 100 ) ];
        this.lights = [new Light(Vec.of(20,10,15,1),Color.of(0,1,1,1),1000)];
      }
    make_control_panel()            // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
      { 
        this.key_triggered_button("Up", ["w"], () => {  // going Up with 'i'
                if(this.ud >= -96.8)  // 485 steps max upwards (from starting position) (not 484 because >=)
                  this.ud = this.ud - 0.2;
            });
        this.key_triggered_button("Down", ["s"], () => {  // going Down with 'k'
                if(this.ud <= 4.6)  // 24 steps max downwards
                  this.ud = this.ud + 0.2;
            });
        this.key_triggered_button("Left", ["a"], () => {  // going Left with 'j'
                if(this.lr >= -10.4)  //  53 steps max left
                  this.lr = this.lr - 0.2;
            });
        this.key_triggered_button("Right", ["d"], () => { // going right with 'l'
                if(this.lr <= 10.4) //  53 steps max right
                  this.lr = this.lr + 0.2;
            });
      }
    textures()
    {
//         var shadowDepthTextureSize = 1024;
//         var lightVertexGLSL = `
//             attribute vec3 aVertexPosition;

//             uniform mat4 uPMatrix;
//             uniform mat4 uMVMatrix;

//             void main (void) 
//             {
//                 gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
//             }
//        `
        //gotta figure out how to integrate shadows into tiny graphics cause the libraries they use have half of it in tiny graphics and half of it
        //we have to implement ourselves
    }
    draw_shad_map(graphics_state)
    {
            //Jacob - TRANSFORMATIONS FOR THE PREBAKED SHADOWS OF THE CLOSEST RIGHT BUILDING
         let pos = Mat4.identity();
         pos = pos.times(Mat4.translation([2.5,5.01,10]));
         pos = pos.times(Mat4.scale([1,1,2]));
         pos = pos.times(Mat4.translation([1,0,1]));
         pos = pos.times(Mat4.rotation(Math.PI*1.5,Vec.of(1,0,0)));
         this.shapes.shadow_square.draw(graphics_state, pos, this.materials.triangle);

           //Jacob - TRANSFORMATIONS FOR THE PREBAKED SHADOWS OF THE CLOSEST LEFT BUILDING
         let shadow_pos = Mat4.identity();
         shadow_pos = shadow_pos.times(Mat4.translation([0,0,-15]));
         shadow_pos = shadow_pos.times(Mat4.translation([2.5,5.01,10]));
         shadow_pos = shadow_pos.times(Mat4.scale([1,1,2]));
         shadow_pos = shadow_pos.times(Mat.of( [ 1,0,0,0 ], [ 0,1,0,0 ], [ .75,0,1,0 ], [ 0,0,0,1 ] ));
         shadow_pos = shadow_pos.times(Mat4.translation([1,0,1]));
         shadow_pos = shadow_pos.times(Mat4.rotation(Math.PI*1.5,Vec.of(1,0,0)));
         this.shapes.shadow_square.draw(graphics_state, shadow_pos, this.materials.triangle);
    }
    display( graphics_state )
      {        
        graphics_state.lights = this.lights;        // Use the lights stored in this.lights.
        const t = graphics_state.animation_time / 1000, dt = graphics_state.animation_delta_time / 1000;
        // our position matrix
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

        // the character
        pos = Mat4.identity().times(Mat4.translation([0,5.5,14])).times(Mat4.scale([0.3,0.5,0.3])).times(Mat4.translation([this.lr,0,this.ud]))
        this.shapes.body.draw(graphics_state, pos, this.materials.suns.override( {color: Color.of(1, 0, 0, 1)},{ambient:0,specular:1,gouraud:false} ));

        pos = Mat4.identity().times(Mat4.translation([20,10,15]));
        this.shapes.sub4.draw(graphics_state, pos, this.materials.suns);
        
        // you guys can start from here

        //Jacob - draw the shadow maps
        this.draw_shad_map(graphics_state);
      }
  }