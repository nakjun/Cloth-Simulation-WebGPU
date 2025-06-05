import React, { useEffect, useRef } from 'react';

import ObjLoader from "./ObjLoader";
import WebGPUCanvas from "./WebGPUCanvas";
import Camera from "./PerspectiveCamera";
import DefaultProgram from "./programs/DefaultProgram";
import Transformation from "./Transformation";
import Cloth from "./Cloth";
import ClothGenerator from "./ClothGenerator";

function Initialize() {
  const OBJECT_URL: string = "./cloth_20_30_l.obj";
  const VERTEX_SPACING = 0.05;

  (async () => {
    try {
      const [gpuCanvas] = await Promise.all([
        WebGPUCanvas.init("gfx-main"),
      ]);

      // const mesh = objLoader.parse(objFile);

      // 대신 ClothGenerator 사용
      const clothGenerator = new ClothGenerator(20, 30); // 20x30 격자 생성
      const mesh = clothGenerator.generate();

      const modelTransformation = new Transformation();
      modelTransformation.scale = [1.0, 1.0, 1.0];
      modelTransformation.rotationXYZ = [0, 1, 0];

      // 버퍼 및 바인드 그룹 생성
      const meshBuffers = gpuCanvas.createMeshBuffers(mesh);

      // WebGPU 프로그램 초기화
      const program = DefaultProgram.init(gpuCanvas);
      program.registerModelMatrices(1);

      // 씬 오브젝트 초기화
      const lightModel = new Transformation();
      lightModel.translation = [5.0, 0.0, 0.0];
      lightModel.rotationXYZ = [0, 0, 0];

      const perspectiveCamera = new Camera(
        (2 * Math.PI) / 5,
        gpuCanvas.aspectRatio,
        0.1,
        100
      );

      perspectiveCamera.translation = [0, 0.0, 2.1];

      // 물리 객체 생성
      const thickness = VERTEX_SPACING;
      const cloth = new Cloth(mesh, thickness);

      // 물리 파라미터 초기화
      const dt = 1.0 / 60.0;
      const steps = 10;
      const sdt = dt / steps;
      const gravity = new Float32Array([-1.1, -9.8, 2.5]);

      cloth.registerDistanceConstraint(0.0);
      cloth.registerPerformantBendingConstraint(1.0);
      cloth.registerSelfCollision();
      // cloth.registerIsometricBendingConstraint(10.0)

      console.log(gpuCanvas);

      // 애니메이션 루프 시작
      gpuCanvas.draw((renderPassAPI: any) => {
        gravity[2] = Math.cos(Date.now() / 2000) * 15.5;
        cloth.preIntegration(sdt);
        for (let i = 0; i < steps; i++) {
          cloth.preSolve(sdt, gravity);
          cloth.solve(sdt);
          cloth.postSolve(sdt);
        }

        cloth.updateVertexNormals();

        gpuCanvas.device.queue.writeBuffer(
          meshBuffers.position.data,
          0,
          cloth.positions,
          0,
          meshBuffers.position.length
        );
        gpuCanvas.device.queue.writeBuffer(
          meshBuffers.normals.data,
          0,
          cloth.normals,
          0,
          meshBuffers.normals.length
        );
        program
          .activate(renderPassAPI)
          .updateCameraUniforms(perspectiveCamera)
          .updateModelUniforms(
            modelTransformation.modelMatrix,
            modelTransformation.getNormalMatrix(perspectiveCamera.viewMatrix),
            0
          )
          .updateLightModelPositionUniform(lightModel.position)
          .render(renderPassAPI, meshBuffers);
        });
        console.log(cloth);
    } catch (e) {
      const errorContainerEl = document.getElementById("error-text");
      if (errorContainerEl) {
        errorContainerEl.innerHTML = e as string;
      }
      throw e;
    }
  })();
}

function App() {
  // 최초 1회만 Initialize 실행
  const started = useRef(false);

  useEffect(() => {
    if (!started.current) {
      Initialize();
      started.current = true;
    }
  }, []);

  return (
    <div className="App">
      <div id="fpsDisplay"></div>
      {/* WebGPU 캔버스가 이 div에 생성되어야 하므로 id를 맞춰줌 */}
      <div id="canvas-container">
        <canvas id="gfx-main" width="1920" height="800"></canvas>
      </div>
      <div id="error-text" style={{ color: 'red' }}></div>
    </div>
  );
}

export default App;
