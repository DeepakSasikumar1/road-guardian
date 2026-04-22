import * as ort from 'onnxruntime-node';
import fs from 'fs';
import path from 'path';

async function test() {
    try {
        const p = path.resolve('public/models/RODS_best.onnx');
        const session = await ort.InferenceSession.create(p);
        fs.writeFileSync('test-out.txt', 'Loaded ' + session.inputNames.join(',') + ' | ' + session.outputNames.join(','));
    } catch (e) {
        fs.writeFileSync('test-out.txt', 'Error: ' + e.message + '\n' + e.stack);
    }
}
test();
