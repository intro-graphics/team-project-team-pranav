class Shadow_Shader extends Phong_Shader {
	vertex_glsl_code() {
		return `
			precision mediump float;
			attribute vec3 object_space_pos;
			attribute vec3 normal;
			attribute vec2 tex_coord;
			uniform mat4 camera_transform;
			uniform mat4 camera_model_transform;
			uniform mat4 projection_camera_model_transform;
			uniform mat3 inverse_transpose_modelview;
			mat4 inverse(mat4 a) {
				mat4 b;
				b[0][0] = a[0][0] * a[1][1] - a[0][1] * a[1][0];
				b[0][1] = a[0][0] * a[1][2] - a[0][2] * a[1][0];
				b[0][2] = a[0][0] * a[1][3] - a[0][3] * a[1][0];
				b[1][0] = a[0][1] * a[1][2] - a[0][2] * a[1][1];
				b[1][1] = a[0][1] * a[1][3] - a[0][3] * a[1][1];
				b[1][2] = a[0][2] * a[1][3] - a[0][3] * a[1][2];
				b[2][0] = a[2][0] * a[3][1] - a[2][1] * a[3][0];
				b[2][1] = a[2][0] * a[3][2] - a[2][2] * a[3][0];
				b[2][2] = a[2][0] * a[3][3] - a[2][3] * a[3][0];
				b[3][0] = a[2][1] * a[3][2] - a[2][2] * a[3][1];
				b[3][1] = a[2][1] * a[3][3] - a[2][3] * a[3][1];
				b[3][2] = a[2][2] * a[3][3] - a[2][3] * a[3][2];
				b[3][3] = b[0][0] * b[3][2] - b[0][1] * b[3][1] 
						+ b[0][2] * b[3][0] + b[1][0] * b[2][2]
						- b[1][1] * b[2][1] + b[1][2] * b[2][0];
				return mat4(
					a[1][1] * b[3][2] - a[1][2] * b[3][1] + a[1][3] * b[3][0],
					a[0][2] * b[3][1] - a[0][1] * b[3][2] - a[0][3] * b[3][0],
					a[3][1] * b[1][2] - a[3][2] * b[1][1] + a[3][3] * b[1][0],
					a[2][2] * b[1][1] - a[2][1] * b[1][2] - a[2][3] * b[1][0],
					a[1][2] * b[2][2] - a[1][0] * b[3][2] - a[1][3] * b[2][1],
					a[0][0] * b[3][2] - a[0][2] * b[2][2] + a[0][3] * b[2][1],
					a[3][2] * b[0][2] - a[3][0] * b[1][2] - a[3][3] * b[0][1],
					a[2][0] * b[1][2] - a[2][2] * b[0][2] + a[2][3] * b[0][1],
					a[1][0] * b[3][1] - a[1][1] * b[2][2] + a[1][3] * b[2][0],
					a[0][1] * b[2][2] - a[0][0] * b[3][1] - a[0][3] * b[2][0],
					a[3][0] * b[1][1] - a[3][1] * b[0][2] + a[3][3] * b[0][0],
					a[2][1] * b[0][2] - a[2][0] * b[1][1] - a[2][3] * b[0][0],
					a[1][1] * b[2][1] - a[1][0] * b[3][0] - a[1][2] * b[2][0],
					a[0][0] * b[3][0] - a[0][1] * b[2][1] + a[0][2] * b[2][0],
					a[3][1] * b[0][1] - a[3][0] * b[1][0] - a[3][2] * b[0][0],
					a[2][0] * b[1][0] - a[2][1] * b[0][1] + a[2][2] * b[0][0]
				) / b[3][3];
			}
            void main(void) {
				mat4 projection = projection_camera_model_transform * inverse(camera_model_transform);
				mat4 cameraview = camera_transform;
				mat4 modelworld = inverse(camera_transform) * camera_model_transform;
				vec4 m = lightPosition[0];
				vec4 g = vec4(0.0, 1.0001, 0.0, 1.0);;
				mat4 groundTranslation = mat4(
					1.0, 0.0, 0.0, 0.0,
					0.0, 1.0, 0.0, 0.0,
					0.0, 0.0, 1.0, 0.0,
					m.x,m.y+g.y,m.z,m.w
				);
				mat4 shadowProjection = mat4(
					1.0, 0.0, 0.0, 0.0,
					0.0, 1.0, 0.0, -1.0 / m.y,
					0.0, 0.0, 1.0, 0.0,
					0.0, 0.0, 0.0, 0.0
				);
				mat4 lightTranslation = mat4(
					1.0, 0.0, 0.0, 0.0,
					0.0, 1.0, 0.0, 0.0,
					0.0, 0.0, 1.0, 0.0,
					-m.x,-m.y-g.y,-m.z,m.w
				);
				gl_Position
				= projection
  				* cameraview
  				* groundTranslation
  				* shadowProjection
  				* lightTranslation
  				* modelworld
 				* vec4(object_space_pos, 1.0);
				f_tex_coord = tex_coord;
            }
		`;
	}
	fragment_glsl_code() {
		return `
            precision mediump float;
			uniform sampler2D texture;
            void main(void) {
                gl_FragColor = vec4(0.0, 0.0, 0.0, 0.9);
            }
		`;
	}
};
