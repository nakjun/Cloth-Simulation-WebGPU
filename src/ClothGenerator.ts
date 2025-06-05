import { Mesh } from "./types";
import { vec3 } from "gl-matrix";

export class ClothGenerator {
  constructor(
    private N: number,  // X 방향 분할 수
    private M: number,  // Y 방향 분할 수
    private startX: number = 10, // 시작 X 좌표
    private startY: number = 10, // 시작 Y 좌표
    private xSize: number = 10,  // X 방향 크기
    private ySize: number = 10   // Y 방향 크기
  ) {}

  generate(): Mesh {
    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    // 간격 계산
    const distX = this.xSize / this.N;
    const distY = this.ySize / this.M;

    // 정점 생성
    for (let i = 0; i < this.N; i++) {
      for (let j = 0; j < this.M; j++) {
        // 위치 계산
        const posX = this.startX + (distX * j);
        const posY = this.startY - (distY * i);
        const posZ = -10.0;
        positions.push(posX, posY, posZ);

        // UV 좌표
        uvs.push(
          j / (this.M - 1),  // U 좌표
          i / (this.N - 1)   // V 좌표
        );
        
        // 초기 노말 (위쪽 방향)
        normals.push(0, 0, 1);
      }
    }

    // 인덱스 생성 (삼각형)
    for (let i = 0; i < this.N - 1; i++) {
      for (let j = 0; j < this.M - 1; j++) {
        const topLeft = i * this.M + j;
        const topRight = topLeft + 1;
        const bottomLeft = (i + 1) * this.M + j;
        const bottomRight = bottomLeft + 1;

        // 첫 번째 삼각형
        indices.push(topLeft, bottomLeft, topRight);
        // 두 번째 삼각형
        indices.push(topRight, bottomLeft, bottomRight);
      }
    }

    // 노말 재계산
    this.calculateNormals(positions, normals, indices);

    return {
      positions: new Float32Array(positions),
      normals: new Float32Array(normals),
      uvs: new Float32Array(uvs),
      indices: new Uint16Array(indices)
    };
  }

  private calculateNormals(positions: number[], normals: number[], indices: number[]): void {
    // 모든 노말을 0으로 초기화
    for (let i = 0; i < normals.length; i++) {
      normals[i] = 0;
    }

    // 각 삼각형에 대해 노말 계산
    for (let i = 0; i < indices.length; i += 3) {
      const i1 = indices[i] * 3;
      const i2 = indices[i + 1] * 3;
      const i3 = indices[i + 2] * 3;

      const v1 = vec3.fromValues(
        positions[i1],
        positions[i1 + 1],
        positions[i1 + 2]
      );
      const v2 = vec3.fromValues(
        positions[i2],
        positions[i2 + 1],
        positions[i2 + 2]
      );
      const v3 = vec3.fromValues(
        positions[i3],
        positions[i3 + 1],
        positions[i3 + 2]
      );

      // 삼각형의 노말 계산
      const edge1 = vec3.create();
      const edge2 = vec3.create();
      vec3.subtract(edge1, v2, v1);
      vec3.subtract(edge2, v3, v1);

      const normal = vec3.create();
      vec3.cross(normal, edge1, edge2);
      vec3.normalize(normal, normal);

      // 각 정점의 노말에 더하기
      for (let j = 0; j < 3; j++) {
        normals[i1 + j] += normal[j];
        normals[i2 + j] += normal[j];
        normals[i3 + j] += normal[j];
      }
    }

    // 모든 노말 정규화
    for (let i = 0; i < normals.length; i += 3) {
      const normal = vec3.fromValues(normals[i], normals[i + 1], normals[i + 2]);
      vec3.normalize(normal, normal);
      normals[i] = normal[0];
      normals[i + 1] = normal[1];
      normals[i + 2] = normal[2];
    }
  }
}

export default ClothGenerator;
