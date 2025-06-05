import { RawShaderData } from "../../types";

const FRAGMENT_ENTRY_POINT = "fragment_main";
const VERTEX_ENTRY_POINT = "vertex_main";
const STEP_MODE = "vertex";
const FORMAT = "float32x3";
const STRIDE = Float32Array.BYTES_PER_ELEMENT * 3;

const code = `
    struct VertexOut {
        @builtin(position) position : vec4<f32>,
        @location(1) vPos: vec4<f32>,
        @location(2) vNormal: vec4<f32>,
        @location(3) vTexCoord: vec2<f32>,
    };

    @group(0) @binding(0) var<uniform> viewMatrix : mat4x4<f32>;
    @group(0) @binding(1) var<uniform> projectionMatrix : mat4x4<f32>;
    @group(0) @binding(2) var<uniform> cameraPosition : vec3<f32>;
    @group(1) @binding(0) var<uniform> modelMatrix : mat4x4<f32>;
    @group(1) @binding(1) var<uniform> normalMatrix : mat4x4<f32>;
    @group(2) @binding(0) var<uniform> lightModelPosition : vec3<f32>;
    @group(3) @binding(0) var myTexture: texture_2d<f32>;
    @group(3) @binding(1) var mySampler: sampler;

    @vertex
    fn ${VERTEX_ENTRY_POINT}(
        @location(0) position: vec4<f32>,
        @location(1) normal: vec4<f32>,
        @location(2) texCoord: vec2<f32>) -> VertexOut
    {
        var output : VertexOut;
        output.position = projectionMatrix * viewMatrix * modelMatrix * position;
        output.vNormal = normalize(normalMatrix * normal);
        output.vPos = modelMatrix * position;
        output.vTexCoord = texCoord;
        return output;
    } 

    @fragment
    fn ${FRAGMENT_ENTRY_POINT}(fragData: VertexOut) -> @location(0) vec4<f32>
    {
        let diffuseLightStrength = 1.5;
        let ambientLightIntensity = 1.0;
        let specularStrength = 0.1;
        let specularShininess = 64.;

        let vNormal = normalize(fragData.vNormal.xyz);
        let vPosition = fragData.vPos.xyz;
        let vCameraPosition = cameraPosition;
        let lightPosition = lightModelPosition.xyz;

        let lightDir = normalize(lightPosition - vPosition);
        let lightMagnitude = dot(vNormal, lightDir);
        let diffuseLightFinal: f32 = diffuseLightStrength * max(lightMagnitude, 0);

        let viewDir = normalize(vCameraPosition - vPosition);
        let reflectDir = reflect(-lightDir, vNormal);  
        let spec = pow(max(dot(viewDir, reflectDir), 0.0), specularShininess);
        let specularFinal = specularStrength * spec;  

        let lightFinal = specularFinal + diffuseLightFinal + ambientLightIntensity;
        
        let textureColor = textureSample(myTexture, mySampler, fragData.vTexCoord);
        // return vec4(fragData.vTexCoord, 0.0, 1.0);  // red = U, green = V
        // let finalLight = max(lightFinal, 1.0);
        // return vec4(finalLight,finalLight,finalLight,1.0);
        return vec4<f32>(textureColor.rgb * lightFinal, textureColor.a);         
    } 
`;

export default {
  code,
  primitive: {
    topology: "triangle-list",
    frontFace: "ccw",
    cullMode: "back",
  },
  fragment: {
    entryPoint: FRAGMENT_ENTRY_POINT,
  },
  vertex: {
    entryPoint: VERTEX_ENTRY_POINT,
    buffers: [
      {
        arrayStride: STRIDE,
        attributes: [
          {
            format: FORMAT,
            offset: 0,
            shaderLocation: 0,
          },
        ],
        stepMode: STEP_MODE,
      },
      {
        arrayStride: STRIDE,
        attributes: [
          {
            format: FORMAT,
            offset: 0,
            shaderLocation: 1,
          },
        ],
        stepMode: STEP_MODE,
      },
      {
        arrayStride: Float32Array.BYTES_PER_ELEMENT * 2, // vec2<f32> for UV coordinates
        attributes: [
          {
            format: "float32x2",
            offset: 0,
            shaderLocation: 2,
          },
        ],
        stepMode: STEP_MODE,
      },
    ],
  },
} as RawShaderData;
