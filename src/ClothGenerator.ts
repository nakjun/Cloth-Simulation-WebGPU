import { Mesh } from "./types";

export class ClothGenerator {
  constructor(
    private width: number,  // X 방향 분할 수
    private height: number, // Y 방향 분할 수
    private startX: number = 0, // 시작 X 좌표
    private startY: number = 0, // 시작 Y 좌표
    private spacing: number = 0.05 // 정점 간격
  ) {}

  generate(): Mesh {
    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    // 정점 생성
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        // 위치
        positions.push(
          this.startX + x * this.spacing,
          this.startY + y * this.spacing,
          0
        );

        // UV 좌표
        uvs.push(x / (this.width - 1), y / (this.height - 1));

        // 초기 노말 (위쪽 방향)
        normals.push(0, 0, 1);
      }
    }

    // 인덱스 생성 (삼각형)
    for (let y = 0; y < this.height - 1; y++) {
      for (let x = 0; x < this.width - 1; x++) {
        const topLeft = y * this.width + x;
        const topRight = topLeft + 1;
        const bottomLeft = (y + 1) * this.width + x;
        const bottomRight = bottomLeft + 1;

        // 첫 번째 삼각형
        indices.push(topLeft, bottomLeft, topRight);
        // 두 번째 삼각형
        indices.push(topRight, bottomLeft, bottomRight);
      }
    }

    return {
      positions: new Float32Array(positions),
      normals: new Float32Array(normals),
      uvs: new Float32Array(uvs),
      indices: new Uint16Array(indices)
    };
  }
} 

export default ClothGenerator;
