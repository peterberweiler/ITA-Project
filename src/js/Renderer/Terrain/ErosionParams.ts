export default class ErosionParams {
	deltaTime = 0.02; // [0;0.05]
	rainRate = 0.012; // [0;0.05]
	evaporationRate = 0.015; // [0;0.05]
	pipeCrossSectionArea = 20.0; // [0.1;60]
	pipeLength = 1.0; // should be equal to texelSizeInMeters
	sedimentCapacity = 1.0; // [0.1;3]
	thermalErosionRate = 0.15; // [0; 3]
	suspensionRate = 0.5; // [0.1;2]
	depositionRate = 1.0; // [0.1;3]
	sedimentSofteningRate = 5.0; // [0;10]
	maxErosionDepth = 10.0; // [0;40]
	talusAngleTangentCoeff = 0.8; // [0;1]
	talusAngleTangentBias = 0.1; // [0;1]
}
