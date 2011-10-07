#info Mandelbulb Distance Estimator
#define providesInit
#define providesNormal
#include "DE-Raytracer.frag"
#include "MathUtils.frag"
#group Mandelbulb


// Number of fractal iterations.
uniform int Iterations;  slider[0,9,100]

// Number of color iterations.
uniform int ColorIterations;  slider[0,9,100]

// Mandelbulb exponent (8 is standard)
uniform float Power; slider[0,8,16]

// Bailout radius
uniform float Bailout; slider[0,5,30]

// Alternate is slightly different, but looks more like a Mandelbrot for Power=2
uniform bool AlternateVersion; checkbox[false]

uniform vec3 RotVector; slider[(0,0,0),(1,1,1),(1,1,1)]

uniform float RotAngle; slider[0.00,0,180]

mat3 rot;

void init() {
	rot = rotationMatrix3(normalize(RotVector), RotAngle);
}

// This is my power function, based on the standard spherical coordinates as defined here:
// http://en.wikipedia.org/wiki/Spherical_coordinate_system
//
// It seems to be similar to the one Quilez uses:
// http://www.iquilezles.org/www/articles/mandelbulb/mandelbulb.htm
//
// Notice the north and south poles are different here.
void powN1(inout vec3 z, float r, inout float dr) {
	// extract polar coordinates
	float theta = acos(z.z/r);
	float phi = atan(z.y,z.x);
	dr =  pow( r, Power-1.0)*Power*dr + 1.0;
	
	// scale and rotate the point
	float zr = pow( r,Power);
	theta = theta*Power;
	phi = phi*Power;
	
	// convert back to cartesian coordinates
	z = zr*vec3(sin(theta)*cos(phi), sin(phi)*sin(theta), cos(theta));
}

// This is a power function taken from the implementation by Enforcer:
// http://www.fractalforums.com/mandelbulb-implementation/realtime-renderingoptimisations/
//
// I cannot follow its derivation from spherical coordinates,
// but it does give a nice mandelbrot like object for Power=2
void powN2(inout vec3 z, float zr0, inout float dr) {
	float zo0 = asin( z.z/zr0 );
	float zi0 = atan( z.y,z.x );
	float zr = pow( zr0, Power-1.0 );
	float zo = zo0 * Power;
	float zi = zi0 * Power;
	dr = zr*dr*Power + 1.0;
	zr *= zr0;
	z  = zr*vec3( cos(zo)*cos(zi), cos(zo)*sin(zi), sin(zo) );
}


vec3 gradient = vec3(0.0);

vec3 normal(vec3 pos, float normalDistance) {
	return normalize(gradient);
}

vec4 mul(vec4  a, vec4 b) {
	return vec4(
		a.x*b.x + a.y*b.y  + a.z*b.z-a.w*b.w,
		a.x*b.y + a.y*b.x-a.z*b.w+a.w*b.z,
		a.x*b.z+a.y*b.w+a.z*b.x-a.w*b.y,
		a.x*b.w+ a.y*b.z - a.z*b.y+a.w*b.x);
}


int Iter = 0;
float potential2( in vec3 pos)
{
	vec3 z = pos;
	float r2 = dot(z,z);
	for( int i=1; i<Iterations; i++ )
	{
		// convert to spherical
		float r = sqrt(r2);
		float theta = acos(z.z/r);
		float phi = atan(z.y,z.x);
		
		// scale and rotate the point
		float zr = pow( r,Power);
		theta = theta*Power;
		phi = phi*Power;
		
		// convert back to cartesian coordinates, and add constant
		z = zr*vec3(sin(theta)*cos(phi), sin(phi)*sin(theta), cos(theta))+pos;
		//if( (m > Bailout && Iter==0) || Iter == i )
		r2 = dot(z,z);
		if (r2 > Bailout)
		{
			//  resPot = 0.5*log(m)/pow(8.0,float(i));
			//            if (Iter == 0) Iter = i;
			// return log(m);
			return 0.5*log(r2)/pow(Power,float(i));
		}
	}	
	return 0.0;	
}

vec3 BulbPower(vec3 z, float power) {
	float r = length(z);
	vec3 s = vec3(r,acos(z.z/r),atan(z.y,z.x)); // spherical (r,theta,phi)
	s = vec3(pow(s.x,Power), s.y*Power, s.z*Power);
	z = s.x*vec3(sin(s.y)*cos(s.z), sin(s.z)*sin(s.y), cos(s.y));
	return z;
}

float potential(in vec3 pos)
{
	vec3 z = pos;
	for(int i=1; i<Iterations; i++ )
	{
 		z = BulbPower(z, Power) + pos;
		if (dot(z,z) > Bailout) return log(length(z))/pow(Power,float(i));
	}	
	return 0.0;	
}


uniform float EPS; slider[0,5,10]
vec3 e = vec3(0.0,pow(10.0,-EPS),0.0);

// Compute the distance from `pos` to the Mandelbox.
float DE(vec3 p) {
	//   Iter = 0;
	float pot = potential(p);
	if (pot==0.0 ) return 0.0;
	gradient = (vec3(potential(p+e.yxx),  potential(p+e.xyx), potential(p+e.xxy))-pot)/e.y;
	//   return (0.5/exp(pot))*sinh(pot)/length(gradient);
	return 0.5*pot/length(gradient);
}

#preset Default
FOV = 0.62536
Eye = -2.02889,-0.0740503,-0.808901
Target = 6.2469,0.270218,2.34088
Up = -0.544511,0.439421,0.714435
AntiAlias = 1
Detail = -2.81064
DetailAO = -0.5
FudgeFactor = 0.80392
MaxRaySteps = 164
BoundingSphere = 2
Dither = 0.5
AO = 0,0,0,0.7
Specular = 2.4348
SpecularExp = 16
SpotLight = 1,1,1,0.73563
SpotLightDir = -0.52,0.1
CamLight = 1,1,1,0.77273
CamLightMin = 0
Glow = 1,1,1,0
Fog = 0.10738
HardShadow = 0
Reflection = 0
BaseColor = 1,1,1
OrbitStrength = 0.5625
X = 0.411765,0.6,0.560784,-0.21312
Y = 0.666667,0.666667,0.498039,0.86886
Z = 0.666667,0.333333,1,-0.18032
R = 0.4,0.7,1,0.0909
BackgroundColor = 0.6,0.6,0.45
GradientBackground = 0.3
CycleColors = true
Cycles = 18.1816
FloorNormal = 0,0,0
FloorHeight = 0
FloorColor = 1,1,1
Iterations = 12
ColorIterations = 2
Power = 8
Bailout = 6.279
AlternateVersion = true
RotVector = 1,1,1
RotAngle = 0
#endpreset

#preset Octobulb
FOV = 0.62536
Eye = -0.184126,0.843469,1.32991
Target = 1.48674,-5.55709,-4.56665
Up = -0.240056,-0.718624,0.652651
AntiAlias = 1
Detail = -2.47786
DetailAO = -0.21074
FudgeFactor = 1
MaxRaySteps = 164
BoundingSphere = 2
Dither = 0.5
AO = 0,0,0,0.7
Specular = 1
SpecularExp = 27.082
SpotLight = 1,1,1,0.94565
SpotLightDir = 0.5619,0.18096
CamLight = 1,1,1,0.23656
CamLightMin = 0.15151
Glow = 0.415686,1,0.101961,0.18421
Fog = 0.60402
HardShadow = 0.72308
Reflection = 0
BaseColor = 1,1,1
OrbitStrength = 0.62376
X = 0.411765,0.6,0.560784,-0.37008
Y = 0.666667,0.666667,0.498039,0.86886
Z = 0.666667,0.333333,1,-0.25984
R = 0.4,0.7,1,0.36508
BackgroundColor = 0.666667,0.666667,0.498039
GradientBackground = 0.5
CycleColors = true
Cycles = 7.03524
FloorNormal = 0,0,0
FloorHeight = 0
FloorColor = 1,1,1
Iterations = 14
ColorIterations = 6
Power = 8.18304
Bailout = 6.279
AlternateVersion = true
RotVector = 1,0,0
RotAngle = 77.8374
#endpreset