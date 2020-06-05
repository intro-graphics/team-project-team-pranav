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
        return [[left_face,back_bottom_left],[right_face,front_bottom_right],[back_face,back_bottom_right],[front_face,front_bottom_left]];
}

//Jacob:idea here is to basically do ray casting from the vampire to the sun and see if anything blocks the way
//this function checks if the given bounded information will block the sun from view in which case we know it's in shadow
function blockedInShad(start,ray,norm_and_pt,x_bound_1,x_bound_2,y_bound_low,y_bound_high,z_bound_1,z_bound_2)
{
  let x_bound_low = Math.min(x_bound_1,x_bound_2);            //Set the bouds for x and z, the - and + .01 is for floating point precision
  x_bound_low -=.01;
  let x_bound_high = Math.max(x_bound_1,x_bound_2);
  x_bound_high+=.01;
  let z_bound_low = Math.min(z_bound_1,z_bound_2);
  z_bound_low-=.01;
  let z_bound_high = Math.max(z_bound_1,z_bound_2);
  z_bound_high +=.01;
  y_bound_low +=.5;                                                      //the center of the character is .5 above ground, adjust here
  y_bound_high +=.5;
  let scale_factor = intersect(norm_and_pt[0],start,ray,norm_and_pt[1])           //find what t is for the intersection
  if(scale_factor==-9999)                                                //is parallel
  {                                                                      //therefore can't be blocked by LR return false
    return false
  }
  let x_intercept = scale_factor*ray[0] + start[0]
  if(!bounded(x_intercept,x_bound_low,x_bound_high))                     //if not between specified bounds the plane doesn't cover you
    return false;
  let y_intercept = scale_factor*ray[1] + start[1];                      //scale then add initial position for intersection of ray and plane
  if(!bounded(y_intercept,y_bound_low,y_bound_high))                     //if not between specified bounds the plane doesn't cover you
    return false;
  let z_intercept = scale_factor*ray[2] + start[2];                      //^same as before
  if(!bounded(z_intercept,z_bound_low,z_bound_high))
    return false;
  return true;                                                           //since its bounded in both x,y,z that means this blocks the sun
}

function inShadow(start,ray,bound)                                        //Checks if any of the buildings block the vampire making it in shadow
{
	len = bound.length;
	var i =0;
        for(i=0;i<len;i++)
        {
        	if(blockedInShad(start,ray,bound[i][0][0],bound[i][0][1],bound[i][0][2],bound[i][0][3],bound[i][0][4],bound[i][0][5],bound[i][0][6]) 
        	|| blockedInShad(start,ray,bound[i][1][0],bound[i][1][1],bound[i][1][2],bound[i][1][3],bound[i][1][4],bound[i][1][5],bound[i][1][6])
        	|| blockedInShad(start,ray,bound[i][2][0],bound[i][2][1],bound[i][2][2],bound[i][2][3],bound[i][2][4],bound[i][2][5],bound[i][2][6])
        	|| blockedInShad(start,ray,bound[i][3][0],bound[i][3][1],bound[i][3][2],bound[i][3][3],bound[i][3][4],bound[i][3][5],bound[i][3][6]))
        	{
              return true;
        	}
        }
    return false;
}
/*
This function when given the faces of the normals and the four corner points, will return a list of the bound box
to the caller. The bound box contains four normals, a point on each face and then the boundaries of that face.
If the objects were to be rectangular but rotated in the air, then we'd have to change this function to incorporate
all six faces. Currently all objects are still on the ground and rectagular so we are fine for now. 
*/
function boundBox(faceNorms,y_bound_low,y_bound_high)          
{
	let back_bottom_left = faceNorms[0][1];                              //get the respective points so we can determine bounds
    let front_bottom_right = faceNorms[1][1];
    let back_bottom_right = faceNorms[2][1];
    let front_bottom_left = faceNorms[3][1];
    return ([[faceNorms[0],back_bottom_left[0],front_bottom_left[0],y_bound_low,y_bound_high,back_bottom_left[2],front_bottom_left[2]],
             [faceNorms[1],back_bottom_right[0],front_bottom_right[0],y_bound_low,y_bound_high,back_bottom_right[2],front_bottom_right[2]],
             [faceNorms[2],back_bottom_left[0],back_bottom_right[0],y_bound_low,y_bound_high,back_bottom_left[2],back_bottom_right[2]],
             [faceNorms[3],front_bottom_left[0],front_bottom_right[0],y_bound_low,y_bound_high,front_bottom_left[2],front_bottom_right[2]]]);
}