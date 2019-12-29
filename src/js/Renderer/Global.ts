import Layers from "./Terrain/Layers";
import Texture, { PingPongTexture } from "./Texture";

export let gl: WebGL2RenderingContext;

export type TextureBundle = {
	heightMap: PingPongTexture,
	shadowMap: Texture,
	layers: Layers,
	brushes: Texture,
}

export function setGL(_gl: WebGL2RenderingContext) {
	gl = _gl;
}
