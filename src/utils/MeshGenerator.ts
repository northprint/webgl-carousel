export interface Triangle {
  vertices: Float32Array; // 9 values: 3 vertices × 3 coordinates
  center: Float32Array; // 3 values: x, y, z
  normal: Float32Array; // 3 values: nx, ny, nz
  index: number;
}

export interface TriangleMesh {
  positions: Float32Array;
  texCoords: Float32Array;
  normals: Float32Array;
  indices: Uint16Array;
  triangles: Triangle[];
  instanceData?: Float32Array;
}

export class MeshGenerator {
  /**
   * Generate a triangulated grid mesh
   */
  static generateTriangleGrid(
    width: number,
    height: number,
    subdivisions: number = 10,
  ): TriangleMesh {
    const cellsX = subdivisions;
    const cellsY = subdivisions;
    const verticesX = cellsX + 1;
    const verticesY = cellsY + 1;
    const numVertices = verticesX * verticesY;
    const numTriangles = cellsX * cellsY * 2;

    // Create arrays
    const positions = new Float32Array(numVertices * 3);
    const texCoords = new Float32Array(numVertices * 2);
    const normals = new Float32Array(numVertices * 3);
    const indices = new Uint16Array(numTriangles * 3);
    const triangles: Triangle[] = [];

    // Generate vertices
    for (let y = 0; y <= cellsY; y++) {
      for (let x = 0; x <= cellsX; x++) {
        const index = y * verticesX + x;
        const u = x / cellsX;
        const v = y / cellsY;

        // Position (normalized to -1 to 1)
        positions[index * 3] = ((u * 2 - 1) * width) / 2;
        positions[index * 3 + 1] = ((v * 2 - 1) * height) / 2;
        positions[index * 3 + 2] = 0;

        // Texture coordinates
        texCoords[index * 2] = u;
        texCoords[index * 2 + 1] = 1 - v; // Flip Y for texture coordinates

        // Normal (pointing towards viewer)
        normals[index * 3] = 0;
        normals[index * 3 + 1] = 0;
        normals[index * 3 + 2] = 1;
      }
    }

    // Generate indices and triangles
    let triangleIndex = 0;
    for (let y = 0; y < cellsY; y++) {
      for (let x = 0; x < cellsX; x++) {
        const topLeft = y * verticesX + x;
        const topRight = topLeft + 1;
        const bottomLeft = (y + 1) * verticesX + x;
        const bottomRight = bottomLeft + 1;

        // First triangle (top-left, bottom-left, top-right)
        indices[triangleIndex * 3] = topLeft;
        indices[triangleIndex * 3 + 1] = bottomLeft;
        indices[triangleIndex * 3 + 2] = topRight;

        // Create triangle object
        const tri1 = this.createTriangle(positions, [topLeft, bottomLeft, topRight], triangleIndex);
        triangles.push(tri1);
        triangleIndex++;

        // Second triangle (top-right, bottom-left, bottom-right)
        indices[triangleIndex * 3] = topRight;
        indices[triangleIndex * 3 + 1] = bottomLeft;
        indices[triangleIndex * 3 + 2] = bottomRight;

        // Create triangle object
        const tri2 = this.createTriangle(
          positions,
          [topRight, bottomLeft, bottomRight],
          triangleIndex,
        );
        triangles.push(tri2);
        triangleIndex++;
      }
    }

    return {
      positions,
      texCoords,
      normals,
      indices,
      triangles,
    };
  }

  /**
   * Generate instance data for triangles (for instanced rendering)
   */
  static generateTriangleInstances(mesh: TriangleMesh): Float32Array {
    const numTriangles = mesh.triangles.length;
    const instanceData = new Float32Array(numTriangles * 12); // 3 positions + 3 velocity + 3 rotation + 3 extra

    for (let i = 0; i < numTriangles; i++) {
      const offset = i * 12;
      const triangle = mesh.triangles[i];

      // Position (triangle center)
      instanceData[offset] = triangle?.center[0] ?? 0;
      instanceData[offset + 1] = triangle?.center[1] ?? 0;
      instanceData[offset + 2] = triangle?.center[2] ?? 0;

      // Velocity (initially zero)
      instanceData[offset + 3] = 0;
      instanceData[offset + 4] = 0;
      instanceData[offset + 5] = 0;

      // Rotation (initially zero)
      instanceData[offset + 6] = 0;
      instanceData[offset + 7] = 0;
      instanceData[offset + 8] = 0;

      // Extra data (scale, lifetime, etc.)
      instanceData[offset + 9] = 1; // scale
      instanceData[offset + 10] = 0; // lifetime
      instanceData[offset + 11] = i / numTriangles; // normalized index
    }

    return instanceData;
  }

  /**
   * Create a delaunay triangulation from random points
   */
  static generateDelaunayMesh(
    width: number,
    height: number,
    numPoints: number = 100,
  ): TriangleMesh {
    // Generate random points
    const points: Array<[number, number]> = [];

    // Add corner points to ensure full coverage
    points.push([-width / 2, -height / 2]);
    points.push([width / 2, -height / 2]);
    points.push([-width / 2, height / 2]);
    points.push([width / 2, height / 2]);

    // Add random interior points
    for (let i = 0; i < numPoints - 4; i++) {
      const x = (Math.random() - 0.5) * width;
      const y = (Math.random() - 0.5) * height;
      points.push([x, y]);
    }

    // Simple triangulation (for demonstration - in production use a proper Delaunay library)
    const triangles = this.simpleTriangulation(points);

    const numVertices = points.length;
    const numTriangles = triangles.length;

    const positions = new Float32Array(numVertices * 3);
    const texCoords = new Float32Array(numVertices * 2);
    const normals = new Float32Array(numVertices * 3);
    const indices = new Uint16Array(numTriangles * 3);
    const triangleObjects: Triangle[] = [];

    // Fill vertex data
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      if (!point) continue;
      positions[i * 3] = point[0] ?? 0;
      positions[i * 3 + 1] = point[1] ?? 0;
      positions[i * 3 + 2] = 0;

      const point2 = points[i];
      if (!point2) continue;
      texCoords[i * 2] = (point2[0] ?? 0) / width + 0.5;
      texCoords[i * 2 + 1] = 1 - ((point2[1] ?? 0) / height + 0.5);

      normals[i * 3] = 0;
      normals[i * 3 + 1] = 0;
      normals[i * 3 + 2] = 1;
    }

    // Fill index data and create triangle objects
    for (let i = 0; i < triangles.length; i++) {
      const tri = triangles[i];
      if (!tri) continue;
      indices[i * 3] = tri[0] ?? 0;
      indices[i * 3 + 1] = tri[1] ?? 0;
      indices[i * 3 + 2] = tri[2] ?? 0;

      const triangleObj = this.createTriangle(positions, tri ?? [0, 0, 0], i);
      triangleObjects.push(triangleObj);
    }

    return {
      positions,
      texCoords,
      normals,
      indices,
      triangles: triangleObjects,
    };
  }

  private static createTriangle(
    positions: Float32Array,
    vertexIndices: number[],
    index: number,
  ): Triangle {
    const vertices = new Float32Array(9);
    let centerX = 0,
      centerY = 0,
      centerZ = 0;

    for (let i = 0; i < 3; i++) {
      const vIdx = vertexIndices[i];
      if (vIdx === undefined) continue;
      vertices[i * 3] = positions[vIdx * 3] ?? 0;
      vertices[i * 3 + 1] = positions[vIdx * 3 + 1] ?? 0;
      vertices[i * 3 + 2] = positions[vIdx * 3 + 2] ?? 0;

      centerX += vertices[i * 3] ?? 0;
      centerY += vertices[i * 3 + 1] ?? 0;
      centerZ += vertices[i * 3 + 2] ?? 0;
    }

    const center = new Float32Array([centerX / 3, centerY / 3, centerZ / 3]);

    // Calculate normal using cross product
    const v1 = [
      (vertices[3] ?? 0) - (vertices[0] ?? 0),
      (vertices[4] ?? 0) - (vertices[1] ?? 0),
      (vertices[5] ?? 0) - (vertices[2] ?? 0),
    ];
    const v2 = [
      (vertices[6] ?? 0) - (vertices[0] ?? 0),
      (vertices[7] ?? 0) - (vertices[1] ?? 0),
      (vertices[8] ?? 0) - (vertices[2] ?? 0),
    ];

    const normal = new Float32Array([
      (v1[1] ?? 0) * (v2[2] ?? 0) - (v1[2] ?? 0) * (v2[1] ?? 0),
      (v1[2] ?? 0) * (v2[0] ?? 0) - (v1[0] ?? 0) * (v2[2] ?? 0),
      (v1[0] ?? 0) * (v2[1] ?? 0) - (v1[1] ?? 0) * (v2[0] ?? 0),
    ]);

    // Normalize
    const n0 = normal[0] ?? 0;
    const n1 = normal[1] ?? 0;
    const n2 = normal[2] ?? 0;
    const length = Math.sqrt(n0 ** 2 + n1 ** 2 + n2 ** 2);
    if (length > 0) {
      normal[0] = n0 / length;
      normal[1] = n1 / length;
      normal[2] = n2 / length;
    }

    return {
      vertices,
      center,
      normal,
      index,
    };
  }

  private static simpleTriangulation(
    points: Array<[number, number]>,
  ): Array<[number, number, number]> {
    // Very simple triangulation - just connect nearby points
    // In production, use a proper Delaunay triangulation library
    const triangles: Array<[number, number, number]> = [];

    // Sort points by x coordinate
    const sortedIndices = Array.from({ length: points.length }, (_, i) => i).sort((a, b) => {
      const pa = points[a];
      const pb = points[b];
      return (pa?.[0] ?? 0) - (pb?.[0] ?? 0);
    });

    // Create triangles by connecting nearby points
    for (let i = 0; i < sortedIndices.length - 2; i++) {
      for (let j = i + 1; j < Math.min(i + 5, sortedIndices.length - 1); j++) {
        for (let k = j + 1; k < Math.min(i + 6, sortedIndices.length); k++) {
          const a = sortedIndices[i];
          const b = sortedIndices[j];
          const c = sortedIndices[k];

          if (a === undefined || b === undefined || c === undefined) continue;

          // Check if triangle is valid (not too thin)
          const area =
            Math.abs(
              ((points[b]?.[0] ?? 0) - (points[a]?.[0] ?? 0)) *
                ((points[c]?.[1] ?? 0) - (points[a]?.[1] ?? 0)) -
                ((points[c]?.[0] ?? 0) - (points[a]?.[0] ?? 0)) *
                  ((points[b]?.[1] ?? 0) - (points[a]?.[1] ?? 0)),
            ) / 2;

          if (area > 0.01) {
            triangles.push([a, b, c] as [number, number, number]);
          }
        }
      }
    }

    return triangles;
  }
}
