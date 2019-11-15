import { PingPongTexture } from "./Texture";

export default {
	gl: null as unknown as WebGL2RenderingContext
};

export type TextureBundle = {
	heightMap: PingPongTexture,
	albedoMap: PingPongTexture,
	terrainShadowMap: PingPongTexture,
}
