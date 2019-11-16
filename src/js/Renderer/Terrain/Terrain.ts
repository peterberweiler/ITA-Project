import { mat2, mat4, vec3 } from "gl-matrix";
import Global from "../Global";
import Renderer from "../Renderer";
import Shader from "../Shader";
import Texture from "../Texture";

let gl: WebGL2RenderingContext;
const TILE_RESOLUTION: number = 32;
const TILE_VERTEX_RESOLUTION: number = TILE_RESOLUTION + 1;
const CLIPMAP_RESOLUTION = (TILE_RESOLUTION * 4) + 1;
const CLIPMAP_VERTEX_RESOLUTION = CLIPMAP_RESOLUTION + 1;
const NUM_CLIPMAP_LEVELS = 6;
const fragSource = require("../../Shader/terrain.fs").default;
const vertSource = require("../../Shader/terrain.vs").default;

export default class Terrain {
	private terrainShader: Shader;
	private uTransformLocation: WebGLUniformLocation;
	private uScaleLocation: WebGLUniformLocation;
	private uBiasLocation: WebGLUniformLocation;
	private uRotationLocation: WebGLUniformLocation;
	private uTexelSizeInMetersLocation: WebGLUniformLocation;
	private uHeightScaleInMetersLocation: WebGLUniformLocation;
	private uCamPosLocation: WebGLUniformLocation;
	private uHeightmapTexture: WebGLUniformLocation;
	private uShadowmapTexture: WebGLUniformLocation;
	private fbo: WebGLFramebuffer | null;
	private depthAttachment: Texture;
	private colorAttachment: Texture;
	private readBackDepthAttachment: Texture;
	private vao: WebGLBuffer;
	private vbo: WebGLBuffer;
	private ibo: WebGLBuffer;
	private tileIndexCount: number = 0;
	private fillerIndexCount: number = 0;
	private crossIndexCount: number = 0;
	private trimIndexCount: number = 0;
	private seamIndexCount: number = 0;
	private rotations: mat2[];

	private texelSizeInMeters: number = 1.0;
	private heightScaleInMeters: number = 1.0;
	private worldSpaceMousePos: vec3 = vec3.create();

	constructor() {
		gl = Global.gl;

		this.terrainShader = new Shader(vertSource, fragSource);
		this.uTransformLocation = this.terrainShader.getUniformLocation("uTransform");
		this.uScaleLocation = this.terrainShader.getUniformLocation("uScale");
		this.uBiasLocation = this.terrainShader.getUniformLocation("uBias");
		this.uRotationLocation = this.terrainShader.getUniformLocation("uRotation");
		this.uTexelSizeInMetersLocation = this.terrainShader.getUniformLocation("uTexelSizeInMeters");
		this.uHeightScaleInMetersLocation = this.terrainShader.getUniformLocation("uHeightScaleInMeters");
		this.uCamPosLocation = this.terrainShader.getUniformLocation("uCamPos");
		this.uHeightmapTexture = this.terrainShader.getUniformLocation("uHeightmapTexture");
		this.uShadowmapTexture = this.terrainShader.getUniformLocation("uShadowmapTexture");

		this.fbo = gl.createFramebuffer();
		this.depthAttachment = new Texture();
		this.depthAttachment.bind(0);
		gl.texStorage2D(gl.TEXTURE_2D, 1, gl.DEPTH_COMPONENT32F, gl.canvas.width, gl.canvas.height);
		this.colorAttachment = new Texture();
		this.colorAttachment.bind(0);
		gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, gl.canvas.width, gl.canvas.height);
		this.readBackDepthAttachment = new Texture();
		this.readBackDepthAttachment.bind(0);
		gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA16F, gl.canvas.width, gl.canvas.height);
		Renderer.checkGLError();

		gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.depthAttachment.id, 0);
		Renderer.checkGLError();
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.colorAttachment.id, 0);
		Renderer.checkGLError();
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, this.readBackDepthAttachment.id, 0);
		Renderer.checkGLError();
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);

		this.rotations = new Array(4);
		for (let i = 0; i < 4; ++i) {
			this.rotations[i] = mat2.create();
			mat2.identity(this.rotations[i]);
		}

		mat2.rotate(this.rotations[1], this.rotations[1], (270 / 180) * Math.PI);
		mat2.rotate(this.rotations[2], this.rotations[2], (90 / 180) * Math.PI);
		mat2.rotate(this.rotations[3], this.rotations[3], (180 / 180) * Math.PI);

		this.tileIndexCount = TILE_RESOLUTION * TILE_RESOLUTION * 6;
		this.fillerIndexCount = TILE_RESOLUTION * 24;
		this.crossIndexCount = (TILE_RESOLUTION * 24) + 6;
		this.trimIndexCount = ((CLIPMAP_VERTEX_RESOLUTION * 2) - 1) * 6;
		this.seamIndexCount = CLIPMAP_VERTEX_RESOLUTION * 6;

		const tileVertexCount = TILE_VERTEX_RESOLUTION * TILE_VERTEX_RESOLUTION;
		const fillerVertexCount = TILE_VERTEX_RESOLUTION * 8;
		const crossVertexCount = TILE_VERTEX_RESOLUTION * 8;
		const trimVertexCount = ((CLIPMAP_VERTEX_RESOLUTION * 2) + 1) * 2;
		const seamVertexCount = CLIPMAP_VERTEX_RESOLUTION * 4;

		let vertexData = new Float32Array((tileVertexCount + fillerVertexCount + crossVertexCount + trimVertexCount + seamVertexCount) * 2);
		let indexData = new Uint16Array(this.tileIndexCount + this.fillerIndexCount + this.crossIndexCount + this.trimIndexCount + this.seamIndexCount);

		let currentVertexOffset = 0;
		let currentIndexOffset = 0;
		let currentVertexBaseOffset = 0;

		// tile
		{
			// generate vertex buffer data for tiles
			for (let y = 0; y < TILE_VERTEX_RESOLUTION; ++y) {
				for (let x = 0; x < TILE_VERTEX_RESOLUTION; ++x) {
					vertexData[currentVertexOffset++] = x;
					vertexData[currentVertexOffset++] = y;
				}
			}

			// generate index buffer data for tiles
			for (let y = 0; y < TILE_RESOLUTION; ++y) {
				for (let x = 0; x < TILE_RESOLUTION; ++x) {
					indexData[currentIndexOffset++] = (y * TILE_VERTEX_RESOLUTION) + x;
					indexData[currentIndexOffset++] = ((y + 1) * TILE_VERTEX_RESOLUTION) + x;
					indexData[currentIndexOffset++] = ((y + 1) * TILE_VERTEX_RESOLUTION) + x + 1;

					indexData[currentIndexOffset++] = (y * TILE_VERTEX_RESOLUTION) + x;
					indexData[currentIndexOffset++] = ((y + 1) * TILE_VERTEX_RESOLUTION) + x + 1;
					indexData[currentIndexOffset++] = (y * TILE_VERTEX_RESOLUTION) + x + 1;
				}
			}
		}

		currentVertexBaseOffset += tileVertexCount;

		// filler
		{
			// generate vertex buffer data for filler mesh
			for (let i = 0; i < TILE_VERTEX_RESOLUTION; ++i) {
				vertexData[currentVertexOffset++] = TILE_RESOLUTION + i + 1;
				vertexData[currentVertexOffset++] = 0;
				vertexData[currentVertexOffset++] = TILE_RESOLUTION + i + 1;
				vertexData[currentVertexOffset++] = 1;
			}
			for (let i = 0; i < TILE_VERTEX_RESOLUTION; ++i) {
				vertexData[currentVertexOffset++] = 1;
				vertexData[currentVertexOffset++] = TILE_RESOLUTION + i + 1;
				vertexData[currentVertexOffset++] = 0;
				vertexData[currentVertexOffset++] = TILE_RESOLUTION + i + 1;
			}
			for (let i = 0; i < TILE_VERTEX_RESOLUTION; ++i) {
				vertexData[currentVertexOffset++] = (TILE_RESOLUTION + i) * -1;
				vertexData[currentVertexOffset++] = 1;
				vertexData[currentVertexOffset++] = (TILE_RESOLUTION + i) * -1;
				vertexData[currentVertexOffset++] = 0;
			}
			for (let i = 0; i < TILE_VERTEX_RESOLUTION; ++i) {
				vertexData[currentVertexOffset++] = 0;
				vertexData[currentVertexOffset++] = (TILE_RESOLUTION + i) * -1;
				vertexData[currentVertexOffset++] = 1;
				vertexData[currentVertexOffset++] = (TILE_RESOLUTION + i) * -1;
			}

			// generate index buffer data for filler mesh
			for (let i = 0; i < TILE_RESOLUTION * 4; ++i) {
				let arm = Math.floor(i / TILE_RESOLUTION);

				let bl = ((arm + i) * 2) + 0;
				let br = ((arm + i) * 2) + 1;
				let tl = ((arm + i) * 2) + 2;
				let tr = ((arm + i) * 2) + 3;

				if (arm % 2 === 0) {
					indexData[currentIndexOffset++] = br + currentVertexBaseOffset;
					indexData[currentIndexOffset++] = bl + currentVertexBaseOffset;
					indexData[currentIndexOffset++] = tr + currentVertexBaseOffset;
					indexData[currentIndexOffset++] = bl + currentVertexBaseOffset;
					indexData[currentIndexOffset++] = tl + currentVertexBaseOffset;
					indexData[currentIndexOffset++] = tr + currentVertexBaseOffset;
				}
				else {
					indexData[currentIndexOffset++] = br + currentVertexBaseOffset;
					indexData[currentIndexOffset++] = bl + currentVertexBaseOffset;
					indexData[currentIndexOffset++] = tl + currentVertexBaseOffset;
					indexData[currentIndexOffset++] = br + currentVertexBaseOffset;
					indexData[currentIndexOffset++] = tl + currentVertexBaseOffset;
					indexData[currentIndexOffset++] = tr + currentVertexBaseOffset;
				}
			}
		}

		currentVertexBaseOffset += fillerVertexCount;

		// cross
		{
			// generate vertex buffer data for cross mesh

			// horizontal vertices
			for (let i = 0; i < TILE_VERTEX_RESOLUTION * 2; ++i) {
				vertexData[currentVertexOffset++] = i - TILE_RESOLUTION;
				vertexData[currentVertexOffset++] = 0;
				vertexData[currentVertexOffset++] = i - TILE_RESOLUTION;
				vertexData[currentVertexOffset++] = 1;
			}

			const startOfVertical = TILE_VERTEX_RESOLUTION * 4;

			// vertical vertices
			for (let i = 0; i < TILE_VERTEX_RESOLUTION * 2; ++i) {
				vertexData[currentVertexOffset++] = 0;
				vertexData[currentVertexOffset++] = i - TILE_RESOLUTION;
				vertexData[currentVertexOffset++] = 1;
				vertexData[currentVertexOffset++] = i - TILE_RESOLUTION;
			}

			// generate index buffer data for filler mesh

			// horizontal indices
			for (let i = 0; i < (TILE_RESOLUTION * 2) + 1; ++i) {
				let bl = (i * 2) + 0;
				let br = (i * 2) + 1;
				let tl = (i * 2) + 2;
				let tr = (i * 2) + 3;

				indexData[currentIndexOffset++] = br + currentVertexBaseOffset;
				indexData[currentIndexOffset++] = bl + currentVertexBaseOffset;
				indexData[currentIndexOffset++] = tr + currentVertexBaseOffset;
				indexData[currentIndexOffset++] = bl + currentVertexBaseOffset;
				indexData[currentIndexOffset++] = tl + currentVertexBaseOffset;
				indexData[currentIndexOffset++] = tr + currentVertexBaseOffset;
			}

			// vertical indices
			for (let i = 0; i < (TILE_RESOLUTION * 2) + 1; ++i) {
				if (i === TILE_RESOLUTION) {
					continue;
				}

				let bl = (i * 2) + 0 + startOfVertical;
				let br = (i * 2) + 1 + startOfVertical;
				let tl = (i * 2) + 2 + startOfVertical;
				let tr = (i * 2) + 3 + startOfVertical;

				indexData[currentIndexOffset++] = br + currentVertexBaseOffset;
				indexData[currentIndexOffset++] = bl + currentVertexBaseOffset;
				indexData[currentIndexOffset++] = tr + currentVertexBaseOffset;
				indexData[currentIndexOffset++] = bl + currentVertexBaseOffset;
				indexData[currentIndexOffset++] = tl + currentVertexBaseOffset;
				indexData[currentIndexOffset++] = tr + currentVertexBaseOffset;
			}
		}

		currentVertexBaseOffset += crossVertexCount;

		// trim
		{
			// generate vertex buffer data for trim

			// vertical part of L
			for (let i = 0; i < CLIPMAP_VERTEX_RESOLUTION + 1; ++i) {
				vertexData[currentVertexOffset++] = 0;
				vertexData[currentVertexOffset++] = CLIPMAP_VERTEX_RESOLUTION - i;
				vertexData[currentVertexOffset++] = 1;
				vertexData[currentVertexOffset++] = CLIPMAP_VERTEX_RESOLUTION - i;
			}

			const startOfHorizontal = (CLIPMAP_VERTEX_RESOLUTION + 1) * 2;

			// horizontal part of L
			for (let i = 0; i < CLIPMAP_VERTEX_RESOLUTION; ++i) {
				vertexData[currentVertexOffset++] = i + 1;
				vertexData[currentVertexOffset++] = 0;
				vertexData[currentVertexOffset++] = i + 1;
				vertexData[currentVertexOffset++] = 1;
			}

			// generate index buffer data for tiles
			for (let i = 0; i < CLIPMAP_VERTEX_RESOLUTION; ++i) {
				indexData[currentIndexOffset++] = ((i + 0) * 2) + 1 + currentVertexBaseOffset;
				indexData[currentIndexOffset++] = ((i + 0) * 2) + 0 + currentVertexBaseOffset;
				indexData[currentIndexOffset++] = ((i + 1) * 2) + 0 + currentVertexBaseOffset;

				indexData[currentIndexOffset++] = ((i + 1) * 2) + 1 + currentVertexBaseOffset;
				indexData[currentIndexOffset++] = ((i + 0) * 2) + 1 + currentVertexBaseOffset;
				indexData[currentIndexOffset++] = ((i + 1) * 2) + 0 + currentVertexBaseOffset;
			}
			for (let i = 0; i < CLIPMAP_VERTEX_RESOLUTION - 1; ++i) {
				indexData[currentIndexOffset++] = ((i + 0) * 2) + 1 + startOfHorizontal + currentVertexBaseOffset;
				indexData[currentIndexOffset++] = ((i + 0) * 2) + 0 + startOfHorizontal + currentVertexBaseOffset;
				indexData[currentIndexOffset++] = ((i + 1) * 2) + 0 + startOfHorizontal + currentVertexBaseOffset;

				indexData[currentIndexOffset++] = ((i + 1) * 2) + 1 + startOfHorizontal + currentVertexBaseOffset;
				indexData[currentIndexOffset++] = ((i + 0) * 2) + 1 + startOfHorizontal + currentVertexBaseOffset;
				indexData[currentIndexOffset++] = ((i + 1) * 2) + 0 + startOfHorizontal + currentVertexBaseOffset;
			}
		}

		currentVertexBaseOffset += trimVertexCount;

		// seam
		{
			// generate vertex buffer for seam mesh
			for (let i = 0; i < CLIPMAP_VERTEX_RESOLUTION; ++i) {
				vertexData[currentVertexOffset + (((CLIPMAP_VERTEX_RESOLUTION * 0) + i) * 2) + 0] = i;
				vertexData[currentVertexOffset + (((CLIPMAP_VERTEX_RESOLUTION * 0) + i) * 2) + 1] = 0;
				vertexData[currentVertexOffset + (((CLIPMAP_VERTEX_RESOLUTION * 1) + i) * 2) + 0] = CLIPMAP_VERTEX_RESOLUTION;
				vertexData[currentVertexOffset + (((CLIPMAP_VERTEX_RESOLUTION * 1) + i) * 2) + 1] = i;
				vertexData[currentVertexOffset + (((CLIPMAP_VERTEX_RESOLUTION * 2) + i) * 2) + 0] = CLIPMAP_VERTEX_RESOLUTION - i;
				vertexData[currentVertexOffset + (((CLIPMAP_VERTEX_RESOLUTION * 2) + i) * 2) + 1] = CLIPMAP_VERTEX_RESOLUTION;
				vertexData[currentVertexOffset + (((CLIPMAP_VERTEX_RESOLUTION * 3) + i) * 2) + 0] = 0;
				vertexData[currentVertexOffset + (((CLIPMAP_VERTEX_RESOLUTION * 3) + i) * 2) + 1] = CLIPMAP_VERTEX_RESOLUTION - i;
			}

			currentVertexOffset += CLIPMAP_VERTEX_RESOLUTION * 8;

			// generate index buffer data for seam mesh
			for (let i = 0; i < CLIPMAP_VERTEX_RESOLUTION * 4; i += 2) {
				indexData[currentIndexOffset++] = i + 1 + currentVertexBaseOffset;
				indexData[currentIndexOffset++] = i + currentVertexBaseOffset;
				indexData[currentIndexOffset++] = i + 2 + currentVertexBaseOffset;
			}

			// make the last triangle wrap around
			indexData[currentIndexOffset - 1] = 0;
		}

		currentVertexBaseOffset += seamVertexCount;

		const vaoBuffer = gl.createVertexArray();
		const vertexBuffer = gl.createBuffer();
		const indexBuffer = gl.createBuffer();

		if (!vertexBuffer || !indexBuffer || !vaoBuffer) { throw new Error("Couldn't create vertex or indexbuffer."); }

		this.vao = vaoBuffer;
		this.vbo = vertexBuffer;
		this.ibo = indexBuffer;

		gl.bindVertexArray(this.vao);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
		gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexData, gl.STATIC_DRAW);

		// vertex positions
		gl.enableVertexAttribArray(0);
		gl.vertexAttribPointer(this.terrainShader.getAttributeLocation("aPosition"), 2, gl.FLOAT, false, 8, 0);

		gl.bindVertexArray(null);
	}

	draw(viewProjection: mat4, camPos: vec3, heightMap: WebGLTexture, shadowMap: WebGLTexture, readMouseWorldSpacePos: boolean = false, mousePosX: number = 0, mousePosY: number = 0) {
		const drawMode = gl.TRIANGLES;

		gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
		let buffers: number[] = [gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1];
		gl.drawBuffers(buffers);

		gl.clearBufferfv(gl.COLOR, 0, [0.529, 0.808, 0.922, 1.0]);
		gl.clearBufferfv(gl.COLOR, 1, [0.0, 0.0, 0.0, 1.0]);
		gl.clearBufferfv(gl.DEPTH, 0, [1.0]);

		this.terrainShader.use();

		gl.bindVertexArray(this.vao);

		this.terrainShader.setUniformMat4(this.uTransformLocation, viewProjection);
		this.terrainShader.setUniformF(this.uTexelSizeInMetersLocation, this.texelSizeInMeters);
		this.terrainShader.setUniformF(this.uHeightScaleInMetersLocation, this.heightScaleInMeters);
		this.terrainShader.setUniformVec3(this.uCamPosLocation, camPos);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, heightMap);
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, shadowMap);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		this.terrainShader.setUniformI(this.uHeightmapTexture, 0);
		this.terrainShader.setUniformI(this.uShadowmapTexture, 1);

		for (let level = 0; level < NUM_CLIPMAP_LEVELS; ++level) {
			const scale = 1 << level;
			this.terrainShader.setUniformF(this.uScaleLocation, scale);

			const snappedPosX = Math.floor(camPos[0] / scale) * scale;
			const snappedPosY = Math.floor(camPos[2] / scale) * scale;

			const tileSize = TILE_RESOLUTION << level;
			const baseX = snappedPosX - (TILE_RESOLUTION << (level + 1));
			const baseY = snappedPosY - (TILE_RESOLUTION << (level + 1));
			const nextScale = scale * 2;
			const nextSnappedPosX = Math.floor(camPos[0] / nextScale) * nextScale;
			const nextSnappedPosY = Math.floor(camPos[2] / nextScale) * nextScale;

			// draw trim and seam
			{
				let offsetX = baseX - scale;
				let offsetY = baseY - scale;
				let dX = camPos[0] - nextSnappedPosX;
				let dY = camPos[2] - nextSnappedPosY;
				let r = 0;
				if (dX < scale) {
					r |= 2;
					offsetX += scale * (CLIPMAP_RESOLUTION + 2);
				}
				if (dY < scale) {
					r |= 1;
					offsetY += scale * (CLIPMAP_RESOLUTION + 2);
				}

				//this.terrainShader.setUniformVec3(this.uColorLocation, [0, 1, 0]);
				this.terrainShader.setUniformMat2(this.uRotationLocation, this.rotations[r]);
				this.terrainShader.setUniformVec2(this.uBiasLocation, [offsetX, offsetY]);
				gl.drawElements(drawMode, this.trimIndexCount, gl.UNSIGNED_SHORT, (this.tileIndexCount + this.fillerIndexCount + this.crossIndexCount) * 2);

				// draw seam
				gl.drawElements(drawMode, this.seamIndexCount, gl.UNSIGNED_SHORT, (this.tileIndexCount + this.fillerIndexCount + this.crossIndexCount + this.trimIndexCount) * 2);
			}

			// all following drawcalls dont need a rotation
			this.terrainShader.setUniformMat2(this.uRotationLocation, this.rotations[0]);

			// draw tiles
			//this.terrainShader.setUniformVec3(this.uColorLocation, [0, 0, 1]);
			for (let y = 0; y < 4; ++y) {
				for (let x = 0; x < 4; ++x) {
					if (level !== 0 && x > 0 && x < 3 && y > 0 && y < 3) {
						continue;
					}
					let offsetX = x > 1 ? scale : 0;
					let offsetY = y > 1 ? scale : 0;
					offsetX += baseX + (x * tileSize);
					offsetY += baseY + (y * tileSize);
					this.terrainShader.setUniformVec2(this.uBiasLocation, [offsetX, offsetY]);

					gl.drawElements(drawMode, this.tileIndexCount, gl.UNSIGNED_SHORT, 0);
				}
			}

			// draw filler
			{
				//this.terrainShader.setUniformVec3(this.uColorLocation, [1, 0, 0]);
				this.terrainShader.setUniformVec2(this.uBiasLocation, [snappedPosX, snappedPosY]);
				gl.drawElements(drawMode, this.fillerIndexCount, gl.UNSIGNED_SHORT, (this.tileIndexCount) * 2);
			}
		}

		// draw cross
		{
			// color is still set from drawing filler
			// rotation is still set from everything after drawing trim
			this.terrainShader.setUniformF(this.uScaleLocation, 1);
			this.terrainShader.setUniformVec2(this.uBiasLocation, [Math.floor(camPos[0]), Math.floor(camPos[2])]);
			gl.drawElements(drawMode, this.crossIndexCount, gl.UNSIGNED_SHORT, (this.tileIndexCount + this.fillerIndexCount) * 2);
		}

		gl.bindVertexArray(null);

		Renderer.checkGLError();

		if (readMouseWorldSpacePos) {
			gl.readBuffer(gl.COLOR_ATTACHMENT1);
			let resultBuffer = new Float32Array(4);
			gl.readPixels(mousePosX, gl.canvas.height - mousePosY, 1, 1, gl.RGBA, gl.FLOAT, resultBuffer);
			this.worldSpaceMousePos[0] = resultBuffer[0];
			this.worldSpaceMousePos[1] = resultBuffer[1];
			this.worldSpaceMousePos[2] = resultBuffer[2];
		}

		gl.readBuffer(gl.COLOR_ATTACHMENT0);
		Renderer.checkGLError();
		gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
		Renderer.checkGLError();
		gl.blitFramebuffer(0, 0, gl.canvas.width, gl.canvas.height, 0, 0, gl.canvas.width, gl.canvas.height, gl.COLOR_BUFFER_BIT, gl.NEAREST);
		Renderer.checkGLError();
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		Renderer.checkGLError();
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
		Renderer.checkGLError();
	}

	resize() {
		// delete textures
		gl.deleteTexture(this.depthAttachment.id);
		gl.deleteTexture(this.colorAttachment.id);
		gl.deleteTexture(this.readBackDepthAttachment.id);

		// create them again
		let id = gl.createTexture();
		if (!id) { throw new Error("Couldn't create texture."); }
		this.depthAttachment.id = id;

		id = gl.createTexture();
		if (!id) { throw new Error("Couldn't create texture."); }
		this.colorAttachment.id = id;

		id = gl.createTexture();
		if (!id) { throw new Error("Couldn't create texture."); }
		this.readBackDepthAttachment.id = id;

		this.depthAttachment.bind(0);
		gl.texStorage2D(gl.TEXTURE_2D, 1, gl.DEPTH_COMPONENT32F, gl.canvas.width, gl.canvas.height);
		this.colorAttachment = new Texture();
		this.colorAttachment.bind(0);
		gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, gl.canvas.width, gl.canvas.height);
		this.readBackDepthAttachment = new Texture();
		this.readBackDepthAttachment.bind(0);
		gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA16F, gl.canvas.width, gl.canvas.height);
		Renderer.checkGLError();

		gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.depthAttachment.id, 0);
		Renderer.checkGLError();
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.colorAttachment.id, 0);
		Renderer.checkGLError();
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, this.readBackDepthAttachment.id, 0);
		Renderer.checkGLError();
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	}

	getMouseWorldSpacePos() {
		return this.worldSpaceMousePos;
	}
}
