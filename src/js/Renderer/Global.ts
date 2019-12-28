import Layers from "./Terrain/Layers";
import Texture, { PingPongTexture } from "./Texture";

export default {
	gl: null as unknown as WebGL2RenderingContext
};

export type TextureBundle = {
	heightMap: PingPongTexture,
	shadowMap: Texture,
	layers: Layers,
	brushes: Texture,
}
