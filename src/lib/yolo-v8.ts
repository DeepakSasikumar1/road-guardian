import * as ort from 'onnxruntime-web';

export interface Detection {
  bbox: [number, number, number, number]; // [x1, y1, x2, y2]
  classId: number;
  className: string;
  confidence: number;
}

// Configure ONNX Runtime environment
if (typeof window !== 'undefined') {
  // Fix for Vite: ONNX Runtime looks at the root by default if not specified or when transpiled.
  // We specify the root explicitly to ensure consistency across dev and production.
  // Using CDN bypasses Vite's dynamic '?import' interception issues with local .mjs files in public/
  ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.24.3/dist/';

  // Crucial: Disable proxy for Vite to avoid worker-related dynamic import failures
  ort.env.wasm.proxy = false;

  // Limit to single thread for better compatibility on various hardware
  ort.env.wasm.numThreads = 1;

  console.log('AI Engine: Environment synchronized with root assets.');
}

export class YOLOv8Detector {
  private session: ort.InferenceSession | null = null;
  private classes: string[] = ['pothole', 'crack', 'water_hazard', 'debris']; // Customizable

  constructor(classes?: string[]) {
    if (classes) this.classes = classes;
  }

  async load(modelPath: string) {
    try {
      console.log(`AI: Connecting to model at ${modelPath}...`);
      this.session = await ort.InferenceSession.create(modelPath, {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all'
      });
      console.log('AI Engine: Neural networks fully operational.');
    } catch (e) {
      console.error('AI Engine: Critical failure loading YOLOv8 model:', e);
      throw e;
    }
  }

  async detect(source: HTMLImageElement | HTMLVideoElement): Promise<Detection[]> {
    if (!this.session) {
      console.warn("AI Session not initialized.");
      throw new Error('Model not loaded');
    }

    console.log("AI: Preprocessing image...");
    const [inputTensor, imgWidth, imgHeight] = await this.preprocess(source);

    console.log("AI: Running inference...");
    const start = performance.now();

    // Auto-detect input name if possible, fallback to 'images'
    const inputNames = this.session.inputNames;
    const inputName = inputNames.length > 0 ? inputNames[0] : 'images';

    const feeds: Record<string, ort.Tensor> = {};
    feeds[inputName] = inputTensor;

    const outputs = await this.session.run(feeds);
    const end = performance.now();

    const outputNames = Object.keys(outputs);
    console.log("AI: Inference complete in", (end - start).toFixed(2), "ms. Output nodes:", outputNames);

    const output = outputs[outputNames[0]];
    console.log("AI: Output Tensor Shape:", output.dims);

    const detections = this.postprocess(output, imgWidth, imgHeight);
    console.log(`AI: Found ${detections.length} total detections after NMS/Filtering.`);
    return detections;
  }

  private async preprocess(source: HTMLImageElement | HTMLVideoElement): Promise<[ort.Tensor, number, number]> {
    const modelWidth = 640;
    const modelHeight = 640;

    const canvas = document.createElement('canvas');
    canvas.width = modelWidth;
    canvas.height = modelHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source, 0, 0, modelWidth, modelHeight);

    const imageData = ctx.getImageData(0, 0, modelWidth, modelHeight);
    const { data } = imageData;

    const input = new Float32Array(modelWidth * modelHeight * 3);
    for (let i = 0; i < data.length / 4; i++) {
      input[i] = data[i * 4] / 255.0;
      input[i + (modelWidth * modelHeight)] = data[i * 4 + 1] / 255.0;
      input[i + (modelWidth * modelHeight * 2)] = data[i * 4 + 2] / 255.0;
    }

    const tensor = new ort.Tensor('float32', input, [1, 3, modelWidth, modelHeight]);

    const naturalWidth = (source as HTMLImageElement).naturalWidth || (source as HTMLVideoElement).videoWidth || 640;
    const naturalHeight = (source as HTMLImageElement).naturalHeight || (source as HTMLVideoElement).videoHeight || 640;

    return [tensor, naturalWidth, naturalHeight];
  }

  private postprocess(output: ort.Tensor, imgWidth: number, imgHeight: number): Detection[] {
    const confThreshold = 0.15;
    const iouThreshold = 0.45;
    const data = output.data as Float32Array;
    const shape = output.dims;

    let numRows: number;
    let numCols: number;
    let isTransposed = false;

    if (shape[1] > shape[2]) {
      numRows = shape[1];
      numCols = shape[2];
      isTransposed = true;
    } else {
      numRows = shape[1];
      numCols = shape[2];
      isTransposed = false;
    }

    const detections: Detection[] = [];
    const totalDetections = isTransposed ? numRows : numCols;
    const valuesPerDetection = isTransposed ? numCols : numRows;

    for (let i = 0; i < totalDetections; i++) {
      let maxScore = -1;
      let classId = -1;

      // Class scores start after the 4 bounding box coordinates
      for (let cl = 0; cl < valuesPerDetection - 4; cl++) {
        const scoreIndex = isTransposed
          ? (i * valuesPerDetection + (cl + 4))
          : ((cl + 4) * totalDetections + i);

        const score = data[scoreIndex];
        if (score > maxScore) {
          maxScore = score;
          classId = cl;
        }
      }

      if (maxScore > confThreshold) {
        const cxIndex = isTransposed ? (i * valuesPerDetection + 0) : (0 * totalDetections + i);
        const cyIndex = isTransposed ? (i * valuesPerDetection + 1) : (1 * totalDetections + i);
        const wIndex = isTransposed ? (i * valuesPerDetection + 2) : (2 * totalDetections + i);
        const hIndex = isTransposed ? (i * valuesPerDetection + 3) : (3 * totalDetections + i);

        const cx = data[cxIndex];
        const cy = data[cyIndex];
        const w = data[wIndex];
        const h = data[hIndex];

        // Scale to original image size
        const x1 = (cx - w / 2) * (imgWidth / 640);
        const y1 = (cy - h / 2) * (imgHeight / 640);
        const x2 = (cx + w / 2) * (imgWidth / 640);
        const y2 = (cy + h / 2) * (imgHeight / 640);

        detections.push({
          bbox: [x1, y1, x2, y2],
          classId,
          className: this.classes[classId] || `object_${classId}`,
          confidence: maxScore
        });
      }
    }

    return this.nonMaxSuppression(detections, iouThreshold);
  }

  private nonMaxSuppression(detections: Detection[], iouThreshold: number): Detection[] {
    detections.sort((a, b) => b.confidence - a.confidence);
    const result: Detection[] = [];
    const used = new Array(detections.length).fill(false);

    for (let i = 0; i < detections.length; i++) {
      if (used[i]) continue;
      result.push(detections[i]);
      used[i] = true;

      for (let j = i + 1; j < detections.length; j++) {
        if (used[j]) continue;
        if (this.calculateIoU(detections[i].bbox, detections[j].bbox) > iouThreshold) {
          used[j] = true;
        }
      }
    }
    return result;
  }

  private calculateIoU(box1: [number, number, number, number], box2: [number, number, number, number]): number {
    const xLeft = Math.max(box1[0], box2[0]);
    const yTop = Math.max(box1[1], box2[1]);
    const xRight = Math.min(box1[2], box2[2]);
    const yBottom = Math.min(box1[3], box2[3]);

    if (xRight < xLeft || yBottom < yTop) return 0;

    const intersectionArea = (xRight - xLeft) * (yBottom - yTop);
    const area1 = (box1[2] - box1[0]) * (box1[3] - box1[1]);
    const area2 = (box2[2] - box2[0]) * (box2[3] - box2[1]);

    return intersectionArea / (area1 + area2 - intersectionArea);
  }
}
