import React, { useEffect, useState } from 'react';
import { Spin } from 'antd';
import './App.css';
import { Canvas } from '@antv/g-canvas';
// @ts-ignore
import Worker from './main.worker.ts';

const CANVAS_HEIGHT = 600;
const CANVAS_WIDTH = 600;

function App() {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    if (
      !navigator.gpu && // WebGPU 还不支持 OffscreenCanvas
      'OffscreenCanvas' in window &&
      'transferControlToOffscreen' in canvas
    ) { 
      const worker = new Worker();
      const offscreen = canvas.transferControlToOffscreen();
      const timeStart = window.performance.now();
      worker.postMessage({ canvas: offscreen }, [offscreen]);
      worker.addEventListener('message', (e: MessageEvent) => {

        setTimeElapsed(window.performance.now() - timeStart);
        setLoading(false);

        const { vertexNum, edgeIndexBufferData, vertexEdgeData } = e.data;
        renderCircles(vertexNum, edgeIndexBufferData, vertexEdgeData);
      });
    } else {

    }
  }, []);
  return (
    <div style={{
      maxWidth: 700,
      margin: '100px auto',
    }}>
      <Spin spinning={loading} tip="主线程空闲中，等待 Worker 线程返回计算结果">
        <div>Elapsed time: {timeElapsed / 1000}s</div>
        <div>
          Ported from the same{' '}
          <a href="https://g6.antv.vision/en/examples/net/furchtermanLayout#fruchtermanWebWorker">
            example
          </a>{' '}
          in G6
        </div>
        <div id="container" />
      </Spin>
    </div>
  );
}

function renderCircles(
  numParticles: number,
  edgeIndexBufferData: number[],
  finalParticleData: Float32Array,
) {
  const canvas = new Canvas({
    container: 'container',
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
  });

  // draw edges
  for (let i = 0; i < edgeIndexBufferData.length; i += 2) {
    const x1 = finalParticleData[edgeIndexBufferData[i] * 4];
    const y1 = finalParticleData[edgeIndexBufferData[i] * 4 + 1];
    const x2 = finalParticleData[edgeIndexBufferData[i + 1] * 4];
    const y2 = finalParticleData[edgeIndexBufferData[i + 1] * 4 + 1];
    const group = canvas.addGroup();
    group.addShape('line', {
      attrs: {
        x1: convertWebGLCoord2Canvas(x1, CANVAS_WIDTH),
        y1: convertWebGLCoord2Canvas(y1, CANVAS_HEIGHT),
        x2: convertWebGLCoord2Canvas(x2, CANVAS_WIDTH),
        y2: convertWebGLCoord2Canvas(y2, CANVAS_HEIGHT),
        stroke: '#1890FF',
        lineWidth: 1,
      },
    });
  }

  // draw nodes
  for (let i = 0; i < numParticles * 4; i += 4) {
    const x = finalParticleData[i];
    const y = finalParticleData[i + 1];
    const group = canvas.addGroup();
    group.addShape('circle', {
      attrs: {
        x: convertWebGLCoord2Canvas(x, CANVAS_WIDTH),
        y: convertWebGLCoord2Canvas(y, CANVAS_HEIGHT),
        r: 5,
        fill: 'red',
        stroke: 'blue',
        lineWidth: 2,
      },
    });
  }
}

function convertWebGLCoord2Canvas(c: number, size: number) {
  return ((c + 1) / 2) * size;
}

export default App;
