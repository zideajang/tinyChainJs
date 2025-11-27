
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

// 根据您的文件结构，假设主要的入口点是 tinychain 目录下的某个文件，
// 例如：tinychain/index.js 或 tinychain/core.js
// 假设入口文件是 tinychain/index.js (根据常见库的组织方式)
const inputPath = 'tinychain/index.js';

export default [
    // 1. UMD/Browser 构建 (压缩版)
    {
        input: inputPath,
        output: {
            // 输出文件名为 tinychain.min.js
            file: 'dist/tinychain.min.js', 
            // 模块格式：UMD (通用模块定义)，兼容浏览器和 CommonJS
            format: 'umd', 
            // 库的全局变量名
            name: 'TinyChain', 
            sourcemap: true,
        },
        plugins: [
            resolve(), // 处理 node_modules 依赖
            commonjs(), // 转换 CommonJS 依赖
            terser(), // 代码压缩
        ],
    },

    // 2. ESM/Node.js 构建 (未压缩版，用于现代工具链)
    {
        input: inputPath,
        output: {
            // 输出文件名为 tinychain.esm.js
            file: 'dist/tinychain.esm.js', 
            // 模块格式：ES Module
            format: 'esm', 
            sourcemap: true,
        },
        plugins: [
            resolve(),
            commonjs(),
        ],
    },
];