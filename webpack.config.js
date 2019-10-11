const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const path = require("path");
const sass = require("sass");

module.exports = env => {
	const PUBLIC_DIR = path.resolve(__dirname, "./public");

	const isDev = !(env && env.production);

	return {
		entry: "./src/js/main.ts",
		output: {
			path: PUBLIC_DIR,
			filename: "main.js",
		},
		resolve: {
			extensions: [".tsx", ".ts", ".js", ".json"],
		},
		module: {
			rules: [
				{ test: /\.tsx?$/, loader: "awesome-typescript-loader" },
				{ test: /\.(txt|fs|vs)$/i, use: "raw-loader" },
			]
		},
		mode: isDev ? "development" : "production",
		plugins: [
			new HtmlWebpackPlugin({
				filename: "index.html",
				template: "src/html/index.html"
			}),
			new CopyPlugin([
				{
					from: "src/styles/main.scss",
					to: path.resolve(PUBLIC_DIR, "./main.css"),
					transform: (content) => sass.renderSync({ data: content.toString() }).css,
				},
			]),
		],
		devServer: {
			contentBase: PUBLIC_DIR,
			compress: false,
			port: 8080,
			clientLogLevel: "warn",
			disableHostCheck: true,
			open: true,
			overlay: {
				warnings: true,
				errors: true
			},
			progress: true,
		}
	};
};
