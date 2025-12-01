import { useRef, useEffect, useState } from 'react';
import "./Canvas.css";
import { Stage, Layer } from 'react-konva';
import GraphNodes from './GraphNodes';
import '../../services/api'
import GraphUploader from '../../services/api';

const Canvas = () => {
  const stageRef = useRef(null);
  const wrapperRef = useRef(null);
  const scrollInterval = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const updateDimensions = () => {
    if (wrapperRef.current) {
      const wrapper = wrapperRef.current;
      setDimensions({
        width: wrapper.clientWidth * 0.9,
        height: wrapper.clientHeight * 0.8,
      });
    }
  };

  useEffect(() => {
    const timer = setTimeout(updateDimensions, 0);

    const resizeObserver = new ResizeObserver(updateDimensions);
    if (wrapperRef.current) {
      resizeObserver.observe(wrapperRef.current);
    }

    window.addEventListener('resize', updateDimensions);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const scaleBy = 1.05;
    const handleWheel = (e) => {
      e.evt.preventDefault();
      const direction = e.evt.deltaY < 0 ? -1 : 1;
      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };
      const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
      stage.scale({ x: newScale, y: newScale });
      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };
      stage.position(newPos);
      stage.batchDraw();
    };

    stage.on("wheel", handleWheel);

    return () => {
      stage.off("wheel", handleWheel);
      clearInterval(scrollInterval.current);
    };
  }, []);

  return (
    <div className="canvas-wrapper" ref={wrapperRef}>
      <Stage
        ref={stageRef}
        className="stage"
        width={dimensions.width}
        height={dimensions.height}
        draggable
      >
        <Layer>
          <GraphUploader stageRef={stageRef} scrollInterval ={scrollInterval}/>
        </Layer>
      </Stage>
    </div>
  );
};

export default Canvas;