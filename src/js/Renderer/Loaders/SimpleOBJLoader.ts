import { LineParser, splitStringAtWhitespaces } from "./Parsing";

interface VertexPosition {
	x: number,
	y: number,
	z: number,
	w: number,
}

interface VertexTextureCoordinate {
	u: number,
	v: number,
	w: number,
}

interface VertexNormal {
	x: number,
	y: number,
	z: number,
}

interface Vertex {
	v: number,
	vt: number,
	vn: number,
}

type Face = Vertex[];
type Triangle = [Vertex, Vertex, Vertex];

export function parseOBJ(source: string) {
	let vertexPositions: VertexPosition[] = [];
	let vertexTextureCoordinates: VertexTextureCoordinate[] = [];
	let vertexNormals: VertexNormal[] = [];
	let faces: Face[] = [];

	const parser = new LineParser(source);

	while (!parser.eof()) {
		let line = parser.getLine().trim();

		// ignore empty lines and comments
		if (!line || line.charAt(0) === "#") { continue; }

		let elements = splitStringAtWhitespaces(line);
		let type = elements[0].toLowerCase();
		switch (type) {
			case "v": //vertex position
				vertexPositions.push({
					x: parseFloat(elements[1]),
					y: parseFloat(elements[2]),
					z: parseFloat(elements[3]),
					w: (elements.length === 5) ? parseFloat(elements[4]) : 1.0
				});
				break;

			case "vt": //texture coordinates
				vertexTextureCoordinates.push({
					u: parseFloat(elements[1]),
					v: parseFloat(elements[2]),
					w: (elements.length === 4) ? parseFloat(elements[3]) : 0.0
				});
				break;

			case "vn": // normals
				vertexNormals.push({
					x: parseFloat(elements[1]),
					y: parseFloat(elements[2]),
					z: parseFloat(elements[3]),
				});
				break;

			case "f": { // face
				let face = [];
				for (let i = 1; i < elements.length; ++i) {
					let faceElements = elements[i].split("/");
					face.push({
						v: parseInt(faceElements[0]),
						vt: parseInt(faceElements[1]),
						vn: parseInt(faceElements[2])
					});
				}
				faces.push(face);
				break;
			}

			default: // ignore every other line type
		}
	}

	return {
		vertices: vertexPositions,
		textureCoordinates: vertexTextureCoordinates,
		normals: vertexNormals,
		faces: faces
	};
}

/**
 * loads the parsed obj and creates the buffers
 * @param {string} source text source of OBJ file
 * @param {boolean} exportNormals default false
 * @param {boolean} exportTextureCoordinates default false
 */
export function loadOBJ(source: string, exportNormals = false, exportTextureCoordinates = false) {
	const obj = parseOBJ(source);
	const model = {
		vertexBuffer: [] as number[],
		indexBuffer: [] as number[],
	};
	const triangles: any[] = [];
	const vertices = [];
	const verticeDict: any = {};

	const vCount = obj.vertices.length;
	const vnCount = obj.normals.length;
	const vtCount = obj.textureCoordinates.length;

	// correct vertices indices
	for (let face of obj.faces) {
		for (let vert of face) {
			vert.v += (vert.v > 0) ? -1 : vCount;
			if (vert.vn) { vert.vn += (vert.vn > 0) ? -1 : vnCount; }
			if (vert.vt) { vert.vt += (vert.vt > 0) ? -1 : vtCount; }
		}
	}

	// turn face polygons into triangles
	for (let face of obj.faces) {
		for (let i = 2; i < face.length; ++i) {
			triangles.push([
				face[0],
				face[i - 1],
				face[i]]);
		}
	}

	// create vertex list
	for (let tri of triangles) {
		for (let i = 0; i < 3; ++i) {
			let vert = tri[i];
			const id = vert.v + "-" + vert.vt + "-" + vert.vn;
			if (id in verticeDict) {
				tri[i] = verticeDict[id];
			}
			else {
				tri[i] = vertices.length;
				verticeDict[id] = vertices.length;
				vertices.push({
					v: obj.vertices[vert.v],
					vn: obj.normals[vert.vn],
					vt: obj.textureCoordinates[vert.vt]
				});
			}
		}
	}

	// create buffers
	for (const vert of vertices) {
		model.vertexBuffer.push(
			vert.v.x / vert.v.w,
			vert.v.y / vert.v.w,
			vert.v.z / vert.v.w
		);
		if (exportNormals) {
			model.vertexBuffer.push(
				vert.vn.x,
				vert.vn.y,
				vert.vn.z
			);
		}
		if (exportTextureCoordinates) {
			model.vertexBuffer.push(
				vert.vt.u,
				vert.vt.v
			);
		}
	}

	for (let tri of triangles) {
		model.indexBuffer.push(tri[0], tri[1], tri[2]);
	}

	return model;
}
