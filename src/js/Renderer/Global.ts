import ErosionParams from "./Terrain/ErosionParams";
import Layers from "./Terrain/Layers";
import Texture, { PingPongTexture } from "./Texture";

export let gl: WebGL2RenderingContext;
export let erosionParams = new ErosionParams();

export type TextureBundle = {
	heightMap: PingPongTexture,
	waterHeightMap: PingPongTexture;
	sedimentHardnessMap: PingPongTexture;
	waterFluxMap: PingPongTexture;
	waterVelocityMap: Texture;
	shadowMap: Texture,
	layers: Layers,
	brushes: Texture,
}

export function setGL(_gl: WebGL2RenderingContext) {
	gl = _gl;
}
