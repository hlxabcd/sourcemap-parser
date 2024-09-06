/**
 * 使用 Express 框架搭建的 Node.js 服务器
 * 提供文件上传、sourcemap 解析、ZIP 文件上传解压等功能
 */
const express = require('express');
const multer = require('multer');
const { readFile } = require('fs/promises');
const { SourceMapConsumer } = require('source-map');
const path = require('path');
const fs = require('fs');
const unzipper = require('unzipper'); // new

const app = express();
const port = 3000;

// 设置静态文件目录为 public
app.use(express.static('public'));
// 解析请求体中的 JSON 数据
app.use(express.json());

// 定义 multer 存储引擎
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'sourcemaps');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

// 创建 multer 中间件实例
const upload = multer({ storage });

/**
 * 递归获取指定目录下的所有 .map 文件
 *
 * @param {string} dir - 目录路径
 * @param {string} version - 版本号
 * @returns {Promise<Array>} - 包含文件信息的数组
 */
const getMapFiles = async (dir, version) => {
    let results = [];
    try {
        const list = await fs.promises.readdir(dir);
        console.log(`Directory list in ${dir}: ${list}`);

        for (const file of list) {
            const filePath = path.join(dir, file);
            const stat = await fs.promises.stat(filePath);
            if (stat && stat.isDirectory()) {
                const subDirResults = await getMapFiles(filePath, version);
                results = results.concat(subDirResults);
            } else if (path.extname(file) === '.map') {
                const relativePath = filePath.split(path.sep).join('/').replace(__dirname.split(path.sep).join('/'), '').substring(1);
                if (!version || relativePath.includes(version)) {
                    results.push({
                        file: relativePath,
                        ctime: stat.ctime // store creation time
                    });
                }
            }
        }

        // 按创建时间降序排序
        results.sort((a, b) => b.ctime - a.ctime);
    } catch (error) {
        console.error(`Error while reading directory ${dir}: ${error.message}`);
    }

    return results;
};

/**
 * 获取所有 .map 文件列表
 *
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
app.get('/sourcemaps', async (req, res) => {
    const version = req.query.version; // 获取version参数

    try {
        const files = await getMapFiles(path.join(__dirname, 'sourcemaps'), version);
        const finalFiles = files.filter(result => result && result.file).map(result => result.file);
        console.log(`Final files: ${JSON.stringify(finalFiles)}`);
        res.json(finalFiles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
/**
 * 解析 sourcemap 和 stacktrace
 *
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
app.post('/parse', upload.none(), async (req, res) => {
    const { mapFile, stacktrace } = req.body;
    const mapFilePath = path.join(__dirname, mapFile);
    try {
        // 解析 map 文件
        console.log(`Parsing map file at: ${mapFilePath}`);
        const rawSourceMap = await readFile(mapFilePath, 'utf8');
        const consumer = await new SourceMapConsumer(rawSourceMap);

        // 解析 stacktrace
        const parsedStacktrace = stacktrace.split('\n').map(line => {
            // 匹配堆栈信息中的文件名、行号和列号
            const match = /\/(.*?)\.js:(\d+):(\d+)/.exec(line);
            if (match) {
                // 构建原始位置对象
                const pos = {
                    source: match[1] + '.js',
                    line: parseInt(match[2]),
                    column: parseInt(match[3])
                };
                // 获取源代码位置
                const originalPosition = consumer.originalPositionFor(pos);
                if (originalPosition.source) {
                    // 替换堆栈信息中的文件名、行号和列号为源代码位置
                    return line.replace(match[0], `<span class="highlight">${originalPosition.source}:${originalPosition.line}:${originalPosition.column}</span>`);
                } else {
                    // 找不到源代码位置，添加错误信息
                    return `${line} <span class="error">(error: 未找到sourcemap原始位置)</span>`;
                }
            }
            // 返回原始行
            return line;
        // 拼接解析后的 stacktrace
        }).join('\n');

        // 返回解析后的 stacktrace
        res.json({ parsedStacktrace });
    } catch (error) {
        // 发生错误，返回错误信息
        res.status(500).json({ error: error.message });
    }
});

/**
 * 上传 ZIP 文件并解压
 *
 * @param req 请求对象
 * @param res 响应对象
 * @returns 无返回值
 */
app.post('/upload-zip', upload.single('zipFile'), async (req, res) => {
    try {
        // 获取上传的 ZIP 文件名并去掉扩展名
        // 修改 ZIP 文件上传及解压的逻辑
        const zipFileName = path.basename(req.file.filename, path.extname(req.file.filename));
        const extractPath = path.join('sourcemaps', zipFileName); // 创建前缀命名的文件夹

        // 创建解压目标路径
        await fs.promises.mkdir(extractPath, { recursive: true });

        // 读取 ZIP 文件并解压到指定路径
        fs.createReadStream(req.file.path)
            .pipe(unzipper.Extract({ path: extractPath }))
            .on('close', () => {
                // 删除上传的 ZIP 文件
                fs.unlinkSync(req.file.path);
                // 返回成功信息
                res.status(200).send('ZIP file uploaded and extracted successfully.');
            })
            .on('error', (err) => {
                // 返回错误信息
                res.status(500).json({ error: err.message });
            });
    } catch (error) {
        // 发生错误，返回错误信息
        res.status(500).json({ error: error.message });
    }
});

// 启动服务器
app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});